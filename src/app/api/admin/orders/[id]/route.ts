export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validateOrderTransition } from "@/lib/order-state";
import { calculateLedgerFromTransactions } from "@/lib/currency";

/**
 * Legacy Admin Order Endpoint Remediation (HIGH H-2)
 * Eliminates direct status mutation bypass.
 * Enforces the central state engine, dispatch payment gating, and audit logging.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, overrideConfirmed, overrideReason } = body;

    if (!status) {
      return NextResponse.json({ error: "Target status is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        paymentTransactions: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authoritative ledger calculation
    const ledger = calculateLedgerFromTransactions(
      Math.round(order.totalAmount * 100),
      order.paymentTransactions || []
    );

    // Fallback for legacy orders without PaymentTransaction records
    if (order.paymentTransactions.length === 0 && order.amountPaid > 0) {
      const paidPaise = Math.round(order.amountPaid * 100);
      ledger.grossPaidPaise = paidPaise;
      ledger.netPaidPaise = paidPaise;
      ledger.balanceDuePaise = Math.max(0, ledger.orderTotalPaise - paidPaise);
      ledger.isPaidInFull = ledger.balanceDuePaise === 0;
    }

    // Validate transition through central engine
    const validation = validateOrderTransition(order.status, status, ledger, {
      userRole: role,
      overrideConfirmed,
      overrideReason,
    });

    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: validation.message,
          code: validation.code,
          balanceDuePaise: ledger.balanceDuePaise,
        },
        { status: validation.code === "UNAUTHORIZED_OVERRIDE" ? 403 : 422 }
      );
    }

    // Perform authoritative mutation
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        ...(validation.isOverride && {
          dispatchOverrideReason: overrideReason,
          dispatchOverriddenBy: session.user.id || session.user.email,
        }),
      },
      include: {
        items: true,
        paymentTransactions: true,
      },
    });

    // Record audit timeline event
    await prisma.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventType: validation.isOverride ? "DISPATCH_OVERRIDE_APPLIED" : "STATUS_TRANSITION",
        title: validation.isOverride ? "Admin Dispatch Override" : `Status Changed to ${status}`,
        description: validation.isOverride
          ? `Dispatch authorized with unpaid balance ₹${(ledger.balanceDuePaise / 100).toFixed(2)}. Reason: ${overrideReason}`
          : `Order status moved from ${order.status} to ${status} via Admin Workspace.`,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email || "Administrator",
        actorRole: role as any,
        isCustomerVisible: true,
        metadata: {
          previousStatus: order.status,
          targetStatus: status,
          isOverride: validation.isOverride || false,
          overrideReason: overrideReason || null,
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("[ADMIN_ORDER_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
