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
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const notes = await prisma.internalOrderNote.findMany({
      where: { orderId: order.id },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error("[OPS_GET_NOTES_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch internal notes." }, { status: 500 });
  }
}

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
    const { note, isPinned = false } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: "Note content cannot be empty." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const createdNote = await prisma.$transaction(async (tx) => {
      const n = await tx.internalOrderNote.create({
        data: {
          orderId: order.id,
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
          note: note.trim(),
          isPinned: !!isPinned,
        },
      });

      // Log to timeline
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "OPS_INTERNAL_NOTE_ADDED",
          title: "Internal Note Added",
          description: note.trim(),
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: { isPinned: !!isPinned },
        },
      });

      return n;
    });

    return NextResponse.json({ success: true, note: createdNote });
  } catch (error: any) {
    console.error("[OPS_CREATE_NOTE_ERROR]", error);
    return NextResponse.json({ error: "Failed to add internal note." }, { status: 500 });
  }
}
