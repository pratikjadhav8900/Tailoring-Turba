import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { OpsNotificationItem } from "@/types/ops";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const employeeId = auth.context.employee.id;

    const where: any = {};
    if (unreadOnly) {
      where.NOT = {
        readBy: { has: employeeId },
      };
    }

    const notifications = await prisma.opsNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.opsNotification.count({
      where: {
        NOT: {
          readBy: { has: employeeId },
        },
      },
    });

    const items: OpsNotificationItem[] = notifications.map((n) => ({
      id: n.id,
      orderId: n.orderId,
      orderNumber: n.orderNumber,
      type: n.type,
      title: n.title,
      message: n.message,
      actorName: n.actorName,
      isReadByMe: n.readBy.includes(employeeId),
      readByCount: n.readBy.length,
      createdAt: n.createdAt,
    }));

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
    const employeeId = auth.context.employee.id;

    if (markAllRead) {
      // Find all notifications not yet read by this employee and push employeeId
      const unreadNotifs = await prisma.opsNotification.findMany({
        where: {
          NOT: { readBy: { has: employeeId } },
        },
        select: { id: true, readBy: true },
      });

      await Promise.all(
        unreadNotifs.map((n) =>
          prisma.opsNotification.update({
            where: { id: n.id },
            data: {
              readBy: { push: employeeId },
            },
          })
        )
      );

      return NextResponse.json({ success: true, count: unreadNotifs.length });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId or markAllRead is required." },
        { status: 400 }
      );
    }

    const target = await prisma.opsNotification.findUnique({
      where: { id: notificationId },
      select: { id: true, readBy: true },
    });

    if (target && !target.readBy.includes(employeeId)) {
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
