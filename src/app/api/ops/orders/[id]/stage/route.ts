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
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
            notes: `Rework initiated from QC: ${reworkReason}`,
            metadata: {
              ...(metadata || {}),
              reworkReason,
              initiatedFrom: "QUALITY_CHECK",
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

    // 2. Standard Stage Progression Validation
    const validation = validateStageTransition(
      currentStage,
      targetStage,
      currentStatus,
      isOverride,
      overrideReason
    );

    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: validation.error,
          isOverrideRequired: validation.isOverrideRequired,
        },
        { status: 400 }
      );
    }

    const determinedStatus: OpsStageStatus =
      (targetStatusInput as OpsStageStatus) || "IN_PROGRESS";

    // Execute standard forward or override transition
    const transitionResult = await prisma.$transaction(async (tx) => {
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

      // Create new stage execution
      const newExecution = await tx.productionStageExecution.create({
        data: {
          orderId: order.id,
          stage: targetStage,
          status: determinedStatus,
          iteration: latestExecution?.iteration || 1,
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
          notes: notes || null,
          metadata: metadata || null,
          attachments,
          startedAt: new Date(),
        },
      });

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

      // Audit Timeline
      const stageName = STAGE_DISPLAY_NAMES[targetStage as OpsProductionStage] || targetStage;
      const eventTitle = isOverride
        ? `Stage Overridden to ${stageName}`
        : `Moved to ${stageName}`;

      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: isOverride ? "OPS_STAGE_OVERRIDDEN" : "OPS_STAGE_TRANSITION",
          title: eventTitle,
          description: isOverride
            ? `Override reason: ${overrideReason}`
            : notes || `Stage advanced by ${auth.context.employee.name}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: {
            fromStage: currentStage,
            toStage: targetStage,
            isOverride,
            overrideReason,
            notes,
          },
        },
      });

      // Broadcast Notification
      await tx.opsNotification.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: "STAGE_CHANGE",
          title: `TT-${order.orderNumber} → ${stageName}`,
          message: `Order TT-${order.orderNumber} updated to ${stageName} by ${auth.context.employee.name}`,
          actorName: auth.context.employee.name,
          readBy: [auth.context.employee.id],
        },
      });

      return newExecution;
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
