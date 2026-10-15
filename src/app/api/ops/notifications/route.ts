import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { OpsNotificationItem } from "@/types/ops";

export const dynamic = "force-dynamic";

/**
 * Determine if an employee is a shop-floor worker (e.g. Ajay TT005, Mahesh TT004).
 * Founders/managers (Neeraj TT001, Sanjay TT002, Pratik TT003) are never workers.
 */
function isWorkerRole(employee: { employeeCode?: string | null; roleTitle?: string | null }): boolean {
  if (!employee) return false;
  const code = (employee.employeeCode || "").trim().toUpperCase();
  const role = (employee.roleTitle || "").trim().toLowerCase();

  // Explicit worker codes
  if (code === "TT004" || code === "TT005") return true;

  // Management codes are always management
  if (code === "TT001" || code === "TT002" || code === "TT003") return false;

  // Title-based fallback
  return (
    role.includes("worker") ||
    role.includes("craftsman") ||
    role.includes("tailor") ||
    role.includes("cutter")
  );
}

/**
 * Rule: Workers must ONLY receive:
 * 1) Tasks assigned specifically to THEM.
 * 2) New Order alerts (so they know when new orders arrive).
 * 3) NOTHING ELSE (no task completions, other workers' tasks, payments, rework, etc.).
 */
function isAllowedForWorker(
  notification: {
    type: string;
    title?: string | null;
    metadata?: any;
  },
  workerId: string
): boolean {
  const meta = (notification.metadata || {}) as Record<string, any>;

  // 1. Task assigned specifically to this worker
  if (notification.type === "TASK_ASSIGNED") {
    const target = meta.targetWorkerId || meta.assignedWorkerId || meta.workerId;
    return target === workerId;
  }

  // 2. New Order announcements
  if (
    notification.type === "ORDER_CREATED" ||
    notification.type === "NEW_ORDER" ||
    meta.isNewOrder === true ||
    (notification.type === "STAGE_CHANGE" &&
      typeof notification.title === "string" &&
      (notification.title.toLowerCase().includes("new order") ||
        notification.title.toLowerCase().includes("order confirmed")))
  ) {
    return true;
  }

  // Workers must never see TASK_COMPLETED, payments, stage advances, or other workers' tasks
  return false;
}

export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const employee = auth.context.employee;
    const employeeId = employee.id;

    const isWorker = isWorkerRole(employee);

    // Fetch recent notifications
    const allNotifications = await prisma.opsNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Filter strictly based on employee role
    const filteredNotifications = isWorker
      ? allNotifications.filter((n) => isAllowedForWorker(n, employeeId))
      : allNotifications;

    // Unread count strictly for this user's visible notifications
    const unreadCount = filteredNotifications.filter(
      (n) => !n.readBy.includes(employeeId)
    ).length;

    // If caller requested unreadOnly (e.g. badge polling in layout)
    const resultList = unreadOnly
      ? filteredNotifications.filter((n) => !n.readBy.includes(employeeId))
      : filteredNotifications;

    const items: OpsNotificationItem[] = resultList.slice(0, 50).map((n) => {
      const meta = (n.metadata || {}) as Record<string, any>;
      let message = n.message;

      // Personalize message for worker vs management view
      if (n.type === "TASK_ASSIGNED") {
        const target = meta.targetWorkerId || meta.assignedWorkerId;
        const taskTitle = meta.taskTitle || "task";
        const orderNum = n.orderNumber ? `TT-${n.orderNumber}` : "";

        if (isWorker && target === employeeId) {
          if (!message.includes("assigned you")) {
            message = `${n.actorName} assigned you: "${taskTitle}"${orderNum ? ` for Order ${orderNum}` : ""}.`;
          }
        } else if (!isWorker && meta.workerName && message.includes("assigned you:")) {
          message = message.replace("assigned you:", `assigned ${meta.workerName}:`);
        }
      }

      return {
        id: n.id,
        orderId: n.orderId,
        orderNumber: n.orderNumber,
        type: n.type,
        title: n.title,
        message,
        actorName: n.actorName,
        isReadByMe: n.readBy.includes(employeeId),
        readByCount: n.readBy.length,
        createdAt: n.createdAt,
      };
    });

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (error: any) {
    console.error("[OPS_GET_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { notificationId, markAllRead } = body;
    const employee = auth.context.employee;
    const employeeId = employee.id;
    const isWorker = isWorkerRole(employee);

    if (markAllRead) {
      // Find all unread notifications
      const unreadNotifs = await prisma.opsNotification.findMany({
        where: {
          NOT: { readBy: { has: employeeId } },
        },
        select: { id: true, type: true, title: true, metadata: true, readBy: true },
      });

      // If worker, only mark read notifications that belong to them
      const relevantNotifs = isWorker
        ? unreadNotifs.filter((n) => isAllowedForWorker(n, employeeId))
        : unreadNotifs;

      await Promise.all(
        relevantNotifs.map((n) =>
          prisma.opsNotification.update({
            where: { id: n.id },
            data: {
              readBy: { push: employeeId },
            },
          })
        )
      );

      return NextResponse.json({ success: true, count: relevantNotifs.length });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId or markAllRead is required." },
        { status: 400 }
      );
    }

    const target = await prisma.opsNotification.findUnique({
      where: { id: notificationId },
      select: { id: true, type: true, title: true, metadata: true, readBy: true },
    });

    if (target && !target.readBy.includes(employeeId)) {
      // Ensure worker cannot read or manipulate notifications they shouldn't see
      if (isWorker && !isAllowedForWorker(target, employeeId)) {
        return NextResponse.json({ success: true });
      }

      await prisma.opsNotification.update({
        where: { id: target.id },
        data: {
          readBy: { push: employeeId },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[OPS_POST_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}

