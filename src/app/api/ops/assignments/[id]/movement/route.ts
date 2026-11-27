import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { GoodsMovementType, AssignmentStatus } from "@/types/ops";

export const dynamic = "force-dynamic";

/**
 * POST /api/ops/assignments/[id]/movement
 * Records Goods-Outward (Challan) or Goods-Inward (Receipt)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const body = await req.json();
    const {
      movementType, // "OUTWARD_CHALLAN" | "INWARD_RECEIPT"
      quantity,
      discrepancyQuantity = 0,
      movementDate,
      notes,
      conditionNotes,
      attachments = [],
    } = body;

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive integer." }, { status: 400 });
    }

    if (!movementType || (movementType !== "OUTWARD_CHALLAN" && movementType !== "INWARD_RECEIPT")) {
      return NextResponse.json({ error: "Valid movementType (OUTWARD_CHALLAN or INWARD_RECEIPT) is required." }, { status: 400 });
    }

    const assignment = await prisma.externalWorkAssignment.findUnique({
      where: { id },
      include: {
        vendor: true,
        order: { select: { id: true, orderNumber: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Re-read the running totals HERE, inside the transaction, immediately before
      // computing deltas — the earlier findUnique (above, outside the transaction) is
      // only used for the 404 check and vendor/order display data. Reading the counters
      // outside the transaction and then writing back computed absolute values is what
      // let two concurrent goods-movement submissions silently clobber each other: both
      // would read the same stale totals, and whichever update committed last would
      // overwrite the other's increment even though both GoodsMovement audit rows exist.
      const fresh = await tx.externalWorkAssignment.findUnique({ where: { id } });
      if (!fresh) {
        throw Object.assign(new Error("Assignment not found."), { code: "NOT_FOUND" });
      }

      let newStatus: AssignmentStatus = fresh.status;
      let pendingAfter: number;

      if (movementType === "OUTWARD_CHALLAN") {
        const newQuantitySent = fresh.quantitySent + parsedQty;
        newStatus = fresh.quantityReceived > 0 ? "PARTIALLY_RECEIVED" : "SENT_TO_PARTNER";
        pendingAfter = Math.max(0, newQuantitySent - fresh.quantityReceived);
      } else {
        // INWARD_RECEIPT: validate against the freshly-read pending quantity, not a
        // value read earlier in the request.
        const pendingBefore = fresh.quantitySent - fresh.quantityReceived;
        if (parsedQty > pendingBefore) {
          throw Object.assign(
            new Error(
              `Cannot receive ${parsedQty} units. Only ${pendingBefore} units are currently pending with ${assignment.vendor.name} (Sent: ${fresh.quantitySent}, Already Received: ${fresh.quantityReceived}).`
            ),
            { code: "OVER_RECEIPT" }
          );
        }
        const newQuantityReceived = fresh.quantityReceived + parsedQty;
        newStatus = newQuantityReceived >= fresh.quantitySent ? "RECEIVED" : "PARTIALLY_RECEIVED";
        pendingAfter = Math.max(0, fresh.quantitySent - newQuantityReceived);
      }

      // 1. Record GoodsMovement
      const movement = await tx.goodsMovement.create({
        data: {
          assignmentId: assignment.id,
          orderId: assignment.orderId,
          vendorId: assignment.vendorId,
          movementType: movementType as GoodsMovementType,
          quantity: parsedQty,
          discrepancyQuantity: parseInt(discrepancyQuantity, 10) || 0,
          movementDate: movementDate ? new Date(movementDate) : new Date(),
          actorEmployeeId: auth.context.employee.id,
          actorEmployeeName: auth.context.employee.name,
          notes: notes?.trim() || null,
          conditionNotes: conditionNotes?.trim() || null,
          attachments: Array.isArray(attachments) ? attachments : [],
        },
      });

      // 2. Update assignment totals and status — atomic increment, not a computed
      // absolute value, so a concurrent transaction's increment can never be lost even
      // if both transactions' fresh reads above happened to overlap.
      const updatedAssignment = await tx.externalWorkAssignment.update({
        where: { id },
        data: {
          quantitySent: movementType === "OUTWARD_CHALLAN" ? { increment: parsedQty } : undefined,
          quantityReceived: movementType === "INWARD_RECEIPT" ? { increment: parsedQty } : undefined,
          status: newStatus,
        },
      });

      // 3. Log Timeline Event
      const isOutward = movementType === "OUTWARD_CHALLAN";
      await tx.orderTimelineEvent.create({
        data: {
          orderId: assignment.orderId,
          eventType: isOutward ? "GOODS_SENT_TO_VENDOR" : "GOODS_RECEIVED_FROM_VENDOR",
          title: isOutward
            ? `Goods Dispatched: ${parsedQty} pcs → ${assignment.vendor.name}`
            : `Goods Received: ${parsedQty} pcs ← ${assignment.vendor.name}`,
          description: `${auth.context.employee.name} recorded ${parsedQty} pieces ${isOutward ? "sent to" : "received from"} ${assignment.vendor.name} (${assignment.stage.replace(/_/g, " ")}). Pending: ${pendingAfter} pcs.${conditionNotes ? ` Condition: "${conditionNotes}"` : ""}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: {
            movementId: movement.id,
            movementType,
            quantity: parsedQty,
            vendorName: assignment.vendor.name,
            pendingQuantity: pendingAfter,
            conditionNotes,
          },
        },
      });

      // 4. Create Notification
      await tx.opsNotification.create({
        data: {
          orderId: assignment.orderId,
          orderNumber: assignment.order.orderNumber,
          type: "GOODS_MOVEMENT",
          title: `${isOutward ? "Challan Sent" : "Receipt Inward"}: ${parsedQty} pcs (${assignment.vendor.name})`,
          message: `${parsedQty} pcs ${isOutward ? "dispatched to" : "received from"} ${assignment.vendor.name} for TT-${assignment.order.orderNumber}. Outstanding: ${pendingAfter} pcs.`,
          actorName: auth.context.employee.name,
          readBy: [],
          metadata: {
            orderId: assignment.orderId,
            orderNumber: assignment.order.orderNumber,
            vendorName: assignment.vendor.name,
            pendingQuantity: pendingAfter,
          },
        },
      });

      return { movement, updatedAssignment, pendingQuantity: pendingAfter };
    });

    return NextResponse.json({
      success: true,
      movement: result.movement,
      assignment: result.updatedAssignment,
      pendingQuantity: result.pendingQuantity,
      message: `Recorded ${parsedQty} pcs ${movementType === "OUTWARD_CHALLAN" ? "dispatched to" : "received from"} ${assignment.vendor.name}.`,
    });
  } catch (error: any) {
    if (error?.code === "NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error?.code === "OVER_RECEIPT") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[OPS_RECORD_MOVEMENT_ERROR]", error);
    return NextResponse.json({ error: "Failed to record goods movement." }, { status: 500 });
  }
}
