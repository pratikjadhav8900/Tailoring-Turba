import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/ops/tasks/[id]
 * Worker punches "Done" on an assigned task with optional vendor notes / details.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const taskId = params.id;
    const body = await req.json();

    const {
      status = "COMPLETED",
      notes,
      vendorName,
      vendorCost,
      attachments = [],
    } = body;

    const task = await prisma.productionStageExecution.findUnique({
      where: { id: taskId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            opsStage: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Permission check: only assigned worker or Management (Admin / Neeraj / Sanjay / Pratik) can complete
    const isAssignedWorker = task.employeeId === auth.context.employee.id;
    const isManagement =
      auth.context.userRole === "ADMIN" ||
      auth.context.userRole === "SUPER_ADMIN" ||
      ["TT001", "TT002", "TT003"].includes(auth.context.employee.employeeCode);

    if (!isAssignedWorker && !isManagement) {
      return NextResponse.json(
        { error: `This task is assigned to ${task.employeeName}. Only they can punch it done.` },
        { status: 403 }
      );
    }

    const existingMeta = (task.metadata as Record<string, any>) || {};
    const taskTitle = existingMeta.taskTitle || existingMeta.title || task.stage.replace(/_/g, " ");

    const updatedMetadata = {
      ...existingMeta,
      vendorName: vendorName?.trim() || existingMeta.vendorName || null,
      vendorCost: vendorCost ? Number(vendorCost) : existingMeta.vendorCost || null,
      completedByEmployeeId: auth.context.employee.id,
      completedByEmployeeName: auth.context.employee.name,
      punchedOnBehalf: !isAssignedWorker && isManagement,
      assignedWorkerName: task.employeeName,
      completionTimestamp: new Date().toISOString(),
    };

    const isMarkingCompleted = status === "COMPLETED";

    const updatedExecution = await prisma.$transaction(async (tx) => {
      // 1. Update task execution
      const updated = await tx.productionStageExecution.update({
        where: { id: taskId },
        data: {
          status: status as any,
          notes: notes?.trim() || task.notes,
          metadata: updatedMetadata,
          attachments: attachments.length > 0 ? attachments : task.attachments,
          completedAt: isMarkingCompleted ? new Date() : null,
        },
      });

      // 2. Add Timeline Audit Event
      const vendorDetailStr = vendorName ? ` [Vendor: ${vendorName}${vendorCost ? ` • ₹${vendorCost}` : ""}]` : "";
      const onBehalfStr = !isAssignedWorker ? ` (on behalf of ${task.employeeName})` : "";
      const description = notes?.trim()
        ? `${notes}${onBehalfStr}${vendorDetailStr}`
        : `Completed by ${auth.context.employee.name}${onBehalfStr}${vendorDetailStr}`;

      await tx.orderTimelineEvent.create({
        data: {
          orderId: task.orderId,
          eventType: isMarkingCompleted ? "TASK_COMPLETED" : "TASK_UPDATED",
          title: `✓ Done: ${taskTitle} (${auth.context.employee.name}${onBehalfStr})`,
          description,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: {
            taskId: task.id,
            taskTitle,
            workerName: auth.context.employee.name,
            assignedWorkerName: task.employeeName,
            punchedOnBehalf: !isAssignedWorker,
            notes,
            vendorName,
            vendorCost,
          },
        },
      });

      // 3. Dispatch Notification to Neeraj, Sanjay, and Pratik
      if (isMarkingCompleted) {
        const actorLabel = isAssignedWorker
          ? auth.context.employee.name
          : `${auth.context.employee.name} (on behalf of ${task.employeeName})`;

        await tx.opsNotification.create({
          data: {
            orderId: task.orderId,
            orderNumber: task.order.orderNumber,
            type: "TASK_COMPLETED",
            title: `Task Completed: ${taskTitle} (TT-${task.order.orderNumber})`,
            message: `${actorLabel} punched DONE on "${taskTitle}" for Order TT-${task.order.orderNumber}.${notes ? ` Note: "${notes}"` : ""}${vendorName ? ` (Vendor: ${vendorName})` : ""}`,
            actorName: auth.context.employee.name,
            readBy: [auth.context.employee.id], // marked read by worker who finished it, unread for managers
            metadata: {
              orderId: task.orderId,
              orderNumber: task.order.orderNumber,
              taskTitle,
              workerName: auth.context.employee.name,
              notes,
              vendorName,
            },
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      task: updatedExecution,
    });
  } catch (error: any) {
    console.error("[OPS_UPDATE_TASK_ERROR]", error);
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}
