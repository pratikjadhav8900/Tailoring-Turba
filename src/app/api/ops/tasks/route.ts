import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { OpsProductionStage, OpsStageStatus } from "@/types/ops";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/tasks
 * Retrieve tasks across orders, filterable by worker or active user.
 */
export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const myTasksOnly = searchParams.get("myTasks") === "true";
    const workerId = searchParams.get("workerId");
    const orderId = searchParams.get("orderId");
    const statusParam = searchParams.get("status") || "ACTIVE"; // ACTIVE, COMPLETED, ALL

    const where: any = {};

    // Filter by worker
    if (myTasksOnly) {
      where.employeeId = auth.context.employee.id;
    } else if (workerId && workerId !== "ALL") {
      where.employeeId = workerId;
    }

    // Filter by order
    if (orderId) {
      const isNumeric = /^\d+$/.test(orderId);
      if (isNumeric) {
        where.order = { orderNumber: parseInt(orderId, 10) };
      } else {
        where.orderId = orderId;
      }
    }

    // Status filter
    if (statusParam === "ACTIVE") {
      where.status = { in: ["PENDING", "IN_PROGRESS"] };
    } else if (statusParam === "COMPLETED") {
      where.status = "COMPLETED";
    }

    const tasks = await prisma.productionStageExecution.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            opsStage: true,
            priority: true,
            dueDate: true,
            orderSource: true,
            totalAmount: true,
            amountPaid: true,
            user: {
              select: {
                name: true,
                companyName: true,
                phone: true,
              },
            },
            items: {
              select: {
                id: true,
                quantity: true,
                customStateJson: true,
                product: {
                  select: { name: true, sku: true },
                },
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            roleTitle: true,
          },
        },
      },
    });

    const formattedTasks = tasks.map((t) => {
      const meta = (t.metadata as Record<string, any>) || {};
      const totalPieces = t.order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      return {
        id: t.id,
        orderId: t.orderId,
        orderNumber: t.order.orderNumber,
        formattedOrderNumber: `TT-${t.order.orderNumber}`,
        stage: t.stage,
        taskKey: meta.taskKey || t.stage,
        title: meta.taskTitle || meta.title || t.stage.replace(/_/g, " "),
        status: t.status,
        iteration: t.iteration,
        employeeId: t.employeeId,
        employeeName: t.employeeName,
        assignedBy: meta.assignedByName || "Management",
        instructions: meta.instructions || t.notes || "",
        notes: t.notes,
        vendorName: meta.vendorName || null,
        vendorCost: meta.vendorCost || null,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        createdAt: t.createdAt,
        // Enriched order info
        orderCustomer: t.order.user?.name || "Customer",
        orderCompany: t.order.user?.companyName || null,
        orderPriority: t.order.priority || "NORMAL",
        orderDueDate: t.order.dueDate,
        orderTotalPieces: totalPieces,
        orderStage: t.order.opsStage,
        orderSource: t.order.orderSource,
      };
    });

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      totalCount: formattedTasks.length,
      currentEmployeeId: auth.context.employee.id,
      currentEmployeeName: auth.context.employee.name,
    });
  } catch (error: any) {
    console.error("[OPS_GET_TASKS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  }
}

/**
 * POST /api/ops/tasks
 * Allows Neeraj, Sanjay, or Pratik to assign single or multiple parallel tasks to workers.
 */
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      orderId,
      tasks, // Array of { stage, taskKey, title, assignedToId, instructions } OR single task fields
      stage,
      taskKey,
      title,
      assignedToId,
      instructions,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    const isNumeric = /^\d+$/.test(orderId);
    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Normalize task payload (supports bulk parallel assignment)
    const taskList: Array<{
      stage: OpsProductionStage;
      taskKey: string;
      title: string;
      assignedToId: string;
      instructions?: string;
    }> = Array.isArray(tasks) && tasks.length > 0
      ? tasks
      : [
          {
            stage: stage as OpsProductionStage,
            taskKey: taskKey || stage,
            title: title || "Production Task",
            assignedToId,
            instructions,
          },
        ];

    if (taskList.length === 0 || !taskList[0].assignedToId) {
      return NextResponse.json(
        { error: "At least one task with an assigned worker is required." },
        { status: 400 }
      );
    }

    // Resolve workers
    const workerIds = Array.from(new Set(taskList.map((t) => t.assignedToId)));
    const workers = await prisma.employee.findMany({
      where: { id: { in: workerIds } },
    });
    const workerMap = new Map(workers.map((w) => [w.id, w]));

    const createdExecutions = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const t of taskList) {
        const worker = workerMap.get(t.assignedToId);
        const workerName = worker?.name || "Assigned Worker";

        const execution = await tx.productionStageExecution.create({
          data: {
            orderId: order.id,
            stage: t.stage,
            status: "IN_PROGRESS",
            iteration: 1,
            employeeId: t.assignedToId,
            employeeName: workerName,
            notes: t.instructions || null,
            metadata: {
              taskKey: t.taskKey,
              taskTitle: t.title,
              assignedById: auth.context.employee.id,
              assignedByName: auth.context.employee.name,
              instructions: t.instructions || "",
            },
            startedAt: new Date(),
          },
        });

        // Create timeline event
        await tx.orderTimelineEvent.create({
          data: {
            orderId: order.id,
            eventType: "TASK_ASSIGNED",
            title: `Task Assigned: ${t.title} → ${workerName}`,
            description: t.instructions || `Assigned by ${auth.context.employee.name}`,
            actorId: auth.context.employee.id,
            actorName: auth.context.employee.name,
            actorRole: "EMPLOYEE",
            isCustomerVisible: false,
            metadata: {
              taskTitle: t.title,
              workerId: t.assignedToId,
              workerName,
              instructions: t.instructions,
            },
          },
        });

        // Create real-time notification targeting the worker
        await tx.opsNotification.create({
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: "TASK_ASSIGNED",
            title: `New Task: ${t.title} (TT-${order.orderNumber})`,
            message: `${auth.context.employee.name} assigned you: "${t.title}" for Order TT-${order.orderNumber}.${t.instructions ? ` Note: "${t.instructions}"` : ""}`,
            actorName: auth.context.employee.name,
            readBy: [], // unread
            metadata: {
              targetWorkerId: t.assignedToId,
              orderId: order.id,
              orderNumber: order.orderNumber,
              taskTitle: t.title,
            },
          },
        });

        records.push(execution);
      }

      return records;
    });

    return NextResponse.json({
      success: true,
      count: createdExecutions.length,
      tasks: createdExecutions,
    });
  } catch (error: any) {
    console.error("[OPS_ASSIGN_TASK_ERROR]", error);
    return NextResponse.json({ error: "Failed to assign task(s)." }, { status: 500 });
  }
}
