import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import {
  validateStageTransition,
  STAGE_DISPLAY_NAMES,
  REWORKABLE_STAGES,
} from "@/lib/ops/workflow";
import type { OpsProductionStage, OpsStageStatus } from "@/types/ops";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  // SECURITY: this must be the session-resolved role only. The employeeCode/name based
  // checks this used to also accept were based on Employee.name, which any employee can
  // edit on themselves via PATCH /api/ops/account — that let a worker grant themselves
  // management override powers (bypassing the 60% advance-payment gate and stage
  // sequencing below) just by renaming themselves to include "Pratik"/"Neeraj"/"Sanjay".
  const isManagement =
    auth.context.userRole === "ADMIN" ||
    auth.context.userRole === "SUPER_ADMIN";

  if (!isManagement) {
    return NextResponse.json(
      { error: "Access denied: Workers cannot advance order workflow stages. Only factory management can advance stages." },
      { status: 403 }
    );
  }

  try {
    const orderId = params.id;
    const isNumeric = /^\d+$/.test(orderId);
    const body = await req.json();

    const {
      targetStage,
      status: targetStatusInput,
      notes,
      metadata,
      attachments = [],
      isOverride = false,
      overrideReason,
      isRework = false,
      reworkReason,
    } = body;

    if (!targetStage) {
      return NextResponse.json({ error: "Target stage is required." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
      include: {
        stageExecutions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const currentStage = order.opsStage;
    const latestExecution = order.stageExecutions[0];
    const currentStatus = latestExecution?.status || "PENDING";

    // 1. Handle Rework from Quality Check
    if (isRework) {
      if (currentStage !== "QUALITY_CHECK") {
        return NextResponse.json(
          { error: "Rework can only be initiated from Quality Inspection (QC)." },
          { status: 400 }
        );
      }

      if (!REWORKABLE_STAGES.includes(targetStage)) {
        return NextResponse.json(
          {
            error: `Invalid rework target. Must be one of: ${REWORKABLE_STAGES.map((s) => STAGE_DISPLAY_NAMES[s]).join(", ")}`,
          },
          { status: 400 }
        );
      }

      if (!reworkReason || reworkReason.trim().length < 5) {
        return NextResponse.json(
          { error: "A detailed rework reason of at least 5 characters is required." },
          { status: 400 }
        );
      }

      const nextIteration = (latestExecution?.iteration || 1) + 1;

      // Transactionally record rework execution, update order stage, log audit, and notify
      const result = await prisma.$transaction(async (tx) => {
        // Complete current QC execution as FLAGGED_REWORK
        if (latestExecution) {
          await tx.productionStageExecution.update({
            where: { id: latestExecution.id },
            data: {
              status: "FLAGGED_REWORK",
              completedAt: new Date(),
              notes: reworkReason,
            },
          });
        }

        // Create new execution at the returned stage with incremented iteration
        const newExecution = await tx.productionStageExecution.create({
          data: {
            orderId: order.id,
            stage: targetStage as OpsProductionStage,
            status: "FLAGGED_REWORK",
            iteration: nextIteration,
            employeeId: null,
            employeeName: "Unassigned",
            notes: `Rework initiated from QC: ${reworkReason}`,
            metadata: {
              ...(metadata || {}),
              isStageMilestone: true,
              isExplicitTask: false,
              reworkReason,
              initiatedFrom: "QUALITY_CHECK",
              transitionedById: auth.context.employee.id,
              transitionedByName: auth.context.employee.name,
            },
            attachments,
            startedAt: new Date(),
          },
        });

        // Update Order opsStage to the rework target stage
        await tx.order.update({
          where: { id: order.id },
          data: {
            opsStage: targetStage as OpsProductionStage,
          },
        });

        // Audit timeline event
        await tx.orderTimelineEvent.create({
          data: {
            orderId: order.id,
            eventType: "OPS_STAGE_REWORK_FLAGGED",
            title: `QC Failed — Returned to ${STAGE_DISPLAY_NAMES[targetStage as OpsProductionStage]} (Iteration #${nextIteration})`,
            description: reworkReason,
            actorId: auth.context.employee.id,
            actorName: auth.context.employee.name,
            actorRole: "EMPLOYEE",
            isCustomerVisible: false,
            metadata: {
              previousStage: "QUALITY_CHECK",
              targetStage,
              iteration: nextIteration,
              reason: reworkReason,
            },
          },
        });

        // Team broadcast notification
        await tx.opsNotification.create({
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: "QC_FAILED_REWORK",
            title: `Rework Flagged: TT-${order.orderNumber}`,
            message: `Order TT-${order.orderNumber} failed QC and was returned to ${STAGE_DISPLAY_NAMES[targetStage as OpsProductionStage]} by ${auth.context.employee.name}. Reason: ${reworkReason}`,
            actorName: auth.context.employee.name,
            readBy: [auth.context.employee.id],
          },
        });

        return newExecution;
      });

      return NextResponse.json({
        success: true,
        isRework: true,
        stage: targetStage,
        iteration: nextIteration,
        execution: result,
      });
    }

    // 2. Standard Stage Progression Validation (includes 60% advance payment rule)
    // Factory management is authorized to transition stages directly
    const effectiveOverride = Boolean(isOverride || isManagement);
    const effectiveOverrideReason =
      overrideReason ||
      (notes && notes.length >= 5 ? notes : `Authorized by ${auth.context.employee.name}`);

    const validation = validateStageTransition(
      currentStage,
      targetStage,
      currentStatus,
      effectiveOverride,
      effectiveOverrideReason,
      {
        totalAmount: order.totalAmount,
        amountPaid: order.amountPaid || 0,
      }
    );

    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: validation.error,
          isOverrideRequired: validation.isOverrideRequired,
          isPaymentBlocked: validation.isPaymentBlocked,
        },
        { status: 400 }
      );
    }

    const determinedStatus: OpsStageStatus =
      (targetStatusInput as OpsStageStatus) ||
      (targetStage === "CLOSED" ? "COMPLETED" : "IN_PROGRESS");

    // Execute standard forward or override transition
    const transitionResult = await prisma.$transaction(async (tx) => {
      let executionRecord;
      const isOrderCloseEvent = targetStage === "CLOSED";

      // If completing current stage (e.g. Closing/Completing when already at CLOSED)
      if (currentStage === targetStage && latestExecution) {
        executionRecord = await tx.productionStageExecution.update({
          where: { id: latestExecution.id },
          data: {
            status: determinedStatus,
            completedAt: determinedStatus === "COMPLETED" ? new Date() : latestExecution.completedAt,
            notes: notes || latestExecution.notes,
          },
        });
      } else {
        // Complete previous stage execution if present
        if (latestExecution && latestExecution.stage === currentStage) {
          await tx.productionStageExecution.update({
            where: { id: latestExecution.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
        }

        // Create new stage execution (Macro stage milestone, not an assigned worker task)
        executionRecord = await tx.productionStageExecution.create({
          data: {
            orderId: order.id,
            stage: targetStage,
            status: determinedStatus,
            iteration: latestExecution?.iteration || 1,
            employeeId: null,
            employeeName: "Unassigned",
            notes: notes || null,
            metadata: {
              ...(metadata || {}),
              isStageMilestone: true,
              isExplicitTask: false,
              transitionedById: auth.context.employee.id,
              transitionedByName: auth.context.employee.name,
            },
            attachments,
            startedAt: new Date(),
            completedAt: determinedStatus === "COMPLETED" ? new Date() : null,
          },
        });
      }

      // Update Order's opsStage
      await tx.order.update({
        where: { id: order.id },
        data: {
          opsStage: targetStage,
          // Sync with legacy OrderStatus where appropriate
          ...(targetStage === "DISPATCHED" ? { status: "DISPATCHED" } : {}),
          ...(targetStage === "CLOSED" ? { status: "DELIVERED" } : {}),
        },
      });

      // Audit Timeline. isExplicitOverride reflects whether this transition actually
      // required an override (per validateStageTransition) — NOT just whether the raw
      // request body happened to set isOverride/overrideReason. Since StageActionModal
      // never sends those fields and effectiveOverride is forced true for every
      // management call above, using the raw body fields here meant isExplicitOverride
      // was always false, so a stage-skip or a 60%-payment-gate bypass was recorded
      // identically to a routine single-step advance — defeating the whole point of the
      // audit trail.
      const stageName = STAGE_DISPLAY_NAMES[targetStage as OpsProductionStage] || targetStage;
      const isExplicitOverride = Boolean(validation.isOverrideRequired);
      const eventTitle = isOrderCloseEvent
        ? `Order Completed & Closed`
        : isExplicitOverride
        ? `Stage Overridden to ${stageName}`
        : `Moved to ${stageName}`;

      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: isOrderCloseEvent
            ? "ORDER_COMPLETED"
            : isExplicitOverride
            ? "OPS_STAGE_OVERRIDDEN"
            : "OPS_STAGE_TRANSITION",
          title: eventTitle,
          description:
            notes ||
            (isOrderCloseEvent
              ? `Order finalized and marked completed by ${auth.context.employee.name}`
              : `Stage advanced to ${stageName} by ${auth.context.employee.name}`),
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: {
            fromStage: currentStage,
            toStage: targetStage,
            status: determinedStatus,
            isOverride: isExplicitOverride,
            overrideReason: isExplicitOverride ? effectiveOverrideReason : undefined,
            notes: notes || undefined,
          },
        },
      });

      // Broadcast Notification
      await tx.opsNotification.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: isOrderCloseEvent ? "ORDER_DELIVERED" : "STAGE_CHANGE",
          title: isOrderCloseEvent
            ? `TT-${order.orderNumber} Completed & Closed`
            : `TT-${order.orderNumber} → ${stageName}`,
          message: isOrderCloseEvent
            ? `Order TT-${order.orderNumber} was finalized and closed by ${auth.context.employee.name}`
            : `Order TT-${order.orderNumber} updated to ${stageName} by ${auth.context.employee.name}`,
          actorName: auth.context.employee.name,
          readBy: [auth.context.employee.id],
        },
      });

      return executionRecord;
    });

    return NextResponse.json({
      success: true,
      stage: targetStage,
      status: determinedStatus,
      execution: transitionResult,
    });
  } catch (error: any) {
    console.error("[OPS_STAGE_TRANSITION_ERROR]", error);
    return NextResponse.json({ error: "Failed to transition stage." }, { status: 500 });
  }
}
