import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { isCrmTaskNotificationRelevant, isCrmTaskNotificationType } from "@/lib/crm/tasks";
import type { CrmNotificationItem } from "@/types/crm";

export const dynamic = "force-dynamic";

/**
 * CRM-side notification bell. Shares the OpsNotification table with Turba
 * Ops, but only ever shows this employee the cross-department task events
 * explicitly targeted at them (e.g. "your quotation request was completed")
 * — never Ops's factory broadcast notifications.
 */
export async function GET(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const employeeId = auth.context.employee.id;

    const recent = await prisma.opsNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const mine = recent.filter(
      (n) => isCrmTaskNotificationType(n.type) && isCrmTaskNotificationRelevant(n, employeeId)
    );

    const unreadCount = mine.filter((n) => !n.readBy.includes(employeeId)).length;
    const resultList = (unreadOnly ? mine.filter((n) => !n.readBy.includes(employeeId)) : mine).slice(0, 50);

    const items: CrmNotificationItem[] = resultList.map((n) => {
      const meta = (n.metadata || {}) as Record<string, any>;
      return {
        id: n.id,
        leadId: meta.leadId ?? null,
        type: n.type,
        title: n.title,
        message: n.message,
        actorName: n.actorName,
        isReadByMe: n.readBy.includes(employeeId),
        createdAt: n.createdAt,
      };
    });

    return NextResponse.json({ notifications: items, unreadCount });
  } catch (error: any) {
    console.error("[CRM_GET_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { notificationId, markAllRead } = body;
    const employeeId = auth.context.employee.id;

    if (markAllRead) {
      const unread = await prisma.opsNotification.findMany({
        where: { NOT: { readBy: { has: employeeId } } },
        select: { id: true, type: true, metadata: true },
      });
      const mine = unread.filter(
        (n) => isCrmTaskNotificationType(n.type) && isCrmTaskNotificationRelevant(n, employeeId)
      );
      await Promise.all(
        mine.map((n) =>
          prisma.opsNotification.update({ where: { id: n.id }, data: { readBy: { push: employeeId } } })
        )
      );
      return NextResponse.json({ success: true, count: mine.length });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId or markAllRead is required." }, { status: 400 });
    }

    const target = await prisma.opsNotification.findUnique({
      where: { id: notificationId },
      select: { id: true, type: true, metadata: true, readBy: true },
    });

    if (
      target &&
      !target.readBy.includes(employeeId) &&
      isCrmTaskNotificationType(target.type) &&
      isCrmTaskNotificationRelevant(target, employeeId)
    ) {
      await prisma.opsNotification.update({
        where: { id: target.id },
        data: { readBy: { push: employeeId } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CRM_POST_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}
