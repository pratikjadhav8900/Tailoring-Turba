import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import { calculateAdvancePaymentDetails } from "@/lib/ops/workflow";
import type { PaymentProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

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

    const {
      amount,
      mode = "UPI",
      reference = "",
      note = "",
      receivedAt,
    } = body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "A valid positive payment amount is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Map UI mode to Prisma PaymentProvider
    let provider: PaymentProvider = "UPI_MANUAL";
    if (mode === "CASH") provider = "CASH";
    else if (mode === "BANK_TRANSFER" || mode === "NEFT" || mode === "RTGS" || mode === "IMPS")
      provider = "MANUAL_BANK_TRANSFER";
    else if (mode === "RAZORPAY") provider = "RAZORPAY";
    else if (mode === "UPI") provider = "UPI_MANUAL";

    const currentPaid = Math.max(0, order.amountPaid || 0);
    const remainingBalance = Math.max(0, order.totalAmount - currentPaid);

    if (remainingBalance <= 0) {
      return NextResponse.json(
        {
          error: `Order TT-${order.orderNumber} is already fully paid (₹${order.totalAmount.toLocaleString("en-IN")}). No further payment can be recorded.`,
        },
        { status: 400 }
      );
    }

    if (parsedAmount > remainingBalance) {
      return NextResponse.json(
        {
          error: `Amount entered (₹${parsedAmount.toLocaleString("en-IN")}) exceeds remaining balance of ₹${remainingBalance.toLocaleString("en-IN")}. Maximum acceptable payment is ₹${remainingBalance.toLocaleString("en-IN")}.`,
        },
        { status: 400 }
      );
    }

    const newAmountPaid = Math.min(order.totalAmount, currentPaid + parsedAmount);
    const newRemainingAmount = Math.max(0, order.totalAmount - newAmountPaid);
    const isFullyPaid = newRemainingAmount === 0;

    const paymentCalculation = calculateAdvancePaymentDetails(
      order.totalAmount,
      newAmountPaid
    );

    const transactionId = reference.trim() || `MANUAL-${Date.now()}`;

    // Transactionally update Order, create PaymentTransaction, log TimelineEvent, and dispatch Notification
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create PaymentTransaction
      const paymentTx = await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          amountPaise: Math.round(parsedAmount * 100),
          currency: "INR",
          type: "PAYMENT",
          status: "CAPTURED",
          provider,
          providerPaymentId: transactionId,
          referenceNote: note?.trim() || `Manual ${mode} payment recorded by ${auth.context.employee.name}`,
          metadata: {
            mode,
            recordedByEmployeeId: auth.context.employee.id,
            recordedByEmployeeName: auth.context.employee.name,
            receivedAt: receivedAt || new Date().toISOString(),
          },
        },
      });

      // 2. Update Order amounts
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount: newRemainingAmount,
          isSplitPayment: newAmountPaid > 0 && newRemainingAmount > 0,
          status: isFullyPaid ? "CONFIRMED" : order.status,
        },
      });

      // 3. Create Timeline Event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "PAYMENT_RECORDED",
          title: `₹${parsedAmount.toLocaleString("en-IN")} Advance Recorded (${mode})`,
          description: `Recorded by ${auth.context.employee.name}. Ref: ${transactionId}. Total paid: ₹${newAmountPaid.toLocaleString("en-IN")} of ₹${order.totalAmount.toLocaleString("en-IN")}${note ? ` • Note: ${note}` : ""}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: true,
          metadata: {
            amount: parsedAmount,
            mode,
            reference: transactionId,
            note,
            advanceCleared: paymentCalculation.isAdvanceCleared,
          },
        },
      });

      // 4. Create OpsNotification for team
      await tx.opsNotification.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: paymentCalculation.isAdvanceCleared ? "ADVANCE_PAYMENT_CLEARED" : "PAYMENT_RECORDED",
          title: paymentCalculation.isAdvanceCleared
            ? `60% Advance Cleared: TT-${order.orderNumber}`
            : `₹${parsedAmount} Recorded: TT-${order.orderNumber}`,
          message: `${auth.context.employee.name} recorded ₹${parsedAmount.toLocaleString("en-IN")} (${mode}) for Order TT-${order.orderNumber}. Total received: ₹${newAmountPaid.toLocaleString("en-IN")} (${paymentCalculation.currentPercentage}%). ${paymentCalculation.isAdvanceCleared ? "Ready for Procurement!" : `₹${paymentCalculation.remainingAdvance.toLocaleString("en-IN")} needed for 60% threshold.`}`,
          actorName: auth.context.employee.name,
          readBy: [auth.context.employee.id],
        },
      });

      return { updatedOrder, paymentTx };
    });

    return NextResponse.json({
      success: true,
      amount: parsedAmount,
      mode,
      totalAmount: order.totalAmount,
      amountPaid: newAmountPaid,
      remainingAmount: newRemainingAmount,
      paymentDetails: paymentCalculation,
      transaction: result.paymentTx,
    });
  } catch (error: any) {
    console.error("[OPS_PAYMENT_RECORD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to record manual payment." },
      { status: 500 }
    );
  }
}
