import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const orderId = params.id;
    const isNumeric = /^\d+$/.test(orderId);

    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        timelineEvents: {
          orderBy: { createdAt: "desc" },
        },
        stageExecutions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      timelineEvents: order.timelineEvents,
      stageExecutions: order.stageExecutions,
    });
  } catch (error: any) {
    console.error("[OPS_GET_ACTIVITY_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch activity history." }, { status: 500 });
  }
}
