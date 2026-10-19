import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/chat
 * Retrieves real-time internal team messages for Turba Ops floor.
 */
export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const currentEmployee = auth.context.employee;

  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "all";
    const limit = parseInt(searchParams.get("limit") || "60", 10);

    const where: any = {
      type: "TEAM_CHAT",
    };

    if (channel !== "all") {
      where.title = channel;
    }

    const messages = await prisma.opsNotification.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const unreadCount = messages.filter(
      (m) =>
        !m.readBy.includes(currentEmployee.id) &&
        !m.readBy.includes(currentEmployee.employeeCode)
    ).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      messages: messages.map((m) => {
        const meta = (m.metadata as any) || {};
        return {
          id: m.id,
          channel: m.title || "general",
          message: m.message,
          senderName: m.actorName,
          senderCode: meta.employeeCode || "STAFF",
          senderRole: meta.roleTitle || "Operations",
          priority: meta.priority || "NORMAL",
          orderNumber: meta.orderNumber || m.orderNumber || null,
          createdAt: m.createdAt,
          isSelf:
            meta.employeeCode === currentEmployee.employeeCode ||
            m.actorName === currentEmployee.name,
        };
      }),
    });
  } catch (error: any) {
    console.error("[OPS_CHAT_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load team chat messages" }, { status: 500 });
  }
}

/**
 * POST /api/ops/chat
 * Broadcasts a new internal message to the team.
 */
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const employee = auth.context.employee;

  try {
    const body = await req.json();
    const { message, channel = "general", orderNumber, priority = "NORMAL" } = body;

    const trimmed = (message || "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    let parsedOrderNumber: number | null = null;
    let linkedOrderId: string | null = null;

    if (orderNumber) {
      const num = parseInt(String(orderNumber).replace(/#/g, ""), 10);
      if (!isNaN(num)) {
        parsedOrderNumber = num;
        const matchingOrder = await prisma.order.findUnique({
          where: { orderNumber: num },
          select: { id: true },
        });
        if (matchingOrder) linkedOrderId = matchingOrder.id;
      }
    }

    const newRecord = await prisma.opsNotification.create({
      data: {
        type: "TEAM_CHAT",
        title: channel,
        message: trimmed,
        actorName: employee.name,
        orderId: linkedOrderId,
        orderNumber: parsedOrderNumber,
        readBy: [employee.id, employee.employeeCode],
        metadata: {
          employeeCode: employee.employeeCode,
          roleTitle: employee.roleTitle,
          channel,
          priority: priority === "URGENT" || priority === "ANNOUNCEMENT" ? priority : "NORMAL",
          orderNumber: parsedOrderNumber,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: newRecord.id,
        channel: newRecord.title,
        message: newRecord.message,
        senderName: newRecord.actorName,
        senderCode: employee.employeeCode,
        senderRole: employee.roleTitle,
        priority,
        orderNumber: parsedOrderNumber,
        createdAt: newRecord.createdAt,
        isSelf: true,
      },
    });
  } catch (error: any) {
    console.error("[OPS_CHAT_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to broadcast message" }, { status: 500 });
  }
}

/**
 * PATCH /api/ops/chat
 * Mark all chat messages as read for current employee
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const employee = auth.context.employee;

  try {
    const unreadMessages = await prisma.opsNotification.findMany({
      where: {
        type: "TEAM_CHAT",
        NOT: {
          readBy: {
            has: employee.id,
          },
        },
      },
      select: { id: true, readBy: true },
    });

    await Promise.all(
      unreadMessages.map((msg) =>
        prisma.opsNotification.update({
          where: { id: msg.id },
          data: {
            readBy: {
              push: employee.id,
            },
          },
        })
      )
    );

    return NextResponse.json({ success: true, markedCount: unreadMessages.length });
  } catch (error: any) {
    console.error("[OPS_CHAT_MARK_READ_ERROR]", error);
    return NextResponse.json({ error: "Failed to mark chat as read" }, { status: 500 });
  }
}
