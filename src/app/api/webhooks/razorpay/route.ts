import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { calculateLedgerFromTransactions } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[RAZORPAY_WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not configured in environment.");
      return NextResponse.json({ error: "Webhook configuration missing" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Timing-safe HMAC signature verification
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );

    if (!isMatch) {
      console.warn("[RAZORPAY_WEBHOOK] Invalid signature attempt rejected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id || req.headers.get("x-razorpay-event-id") || `evt_${Date.now()}`;
    const eventType = event.event;

    // Idempotency check: Ignore duplicate deliveries safely
    const alreadyProcessed = await prisma.processedWebhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "RAZORPAY",
          eventId,
        },
      },
    });

    if (alreadyProcessed) {
      console.log(`[RAZORPAY_WEBHOOK] Event ${eventId} (${eventType}) already processed. Skipping idempotently.`);
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    if (eventType === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (!payment) return NextResponse.json({ status: "ignored" }, { status: 200 });

      const razorpayPaymentId = payment.id;
      const razorpayOrderId = payment.order_id;
      const amountPaise = Math.round(Number(payment.amount));

      // Find order by notes or razorpay order id
      let orderId = payment.notes?.orderId;
      let order = null;

      if (orderId) {
        order = await prisma.order.findUnique({ where: { id: orderId } });
      }

      if (!order && razorpayOrderId) {
        order = await prisma.order.findFirst({
          where: {
            OR: [
              { razorpayOrderId: razorpayOrderId },
              { secondRazorpayOrderId: razorpayOrderId },
            ],
          },
        });
      }

      if (order) {
        const isSecondPayment = order.secondRazorpayOrderId === razorpayOrderId;

        // Upsert payment transaction in ledger
        const existingTx = await prisma.paymentTransaction.findUnique({
          where: { providerPaymentId: razorpayPaymentId },
        });

        if (!existingTx) {
          await prisma.paymentTransaction.create({
            data: {
              orderId: order.id,
              amountPaise,
              currency: payment.currency || "INR",
              type: "PAYMENT",
              status: "CAPTURED",
              provider: "RAZORPAY",
              providerOrderId: razorpayOrderId,
              providerPaymentId: razorpayPaymentId,
              referenceNote: isSecondPayment ? "Balance Payment (Webhook)" : "Initial Payment (Webhook)",
              metadata: payment,
            },
          });
        }

        // Recompute ledger
        const allTx = await prisma.paymentTransaction.findMany({
          where: { orderId: order.id },
        });
        const orderTotalPaise = Math.round(order.totalAmount * 100);
        const ledger = calculateLedgerFromTransactions(orderTotalPaise, allTx);

        let targetStatus = order.status;
        if (order.status === "PENDING") {
          targetStatus = "CONFIRMED";
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: targetStatus,
            amountPaid: ledger.netPaidPaise / 100,
            remainingAmount: ledger.balanceDuePaise / 100,
            ...(isSecondPayment
              ? { secondPaymentId: razorpayPaymentId, secondPaymentStatus: "PAID" }
              : { paymentId: razorpayPaymentId }),
          },
        });

        // Audit log
        await prisma.orderTimelineEvent.create({
          data: {
            orderId: order.id,
            eventType: "WEBHOOK_PAYMENT_CAPTURED",
            title: isSecondPayment ? "Balance Payment Captured" : "Order Payment Verified",
            description: `Payment of ₹${(amountPaise / 100).toFixed(2)} verified via Razorpay webhook (${razorpayPaymentId}).`,
            actorName: "Razorpay Webhook",
            actorRole: "WEBHOOK",
            isCustomerVisible: true,
            metadata: {
              eventId,
              amountPaise,
              balanceDuePaise: ledger.balanceDuePaise,
              providerPaymentId: razorpayPaymentId,
            },
          },
        });
      }
    } else if (eventType === "refund.processed" || eventType === "refund.created") {
      const refund = event.payload?.refund?.entity;
      if (refund) {
        const refundPaymentId = refund.payment_id;
        const refundAmountPaise = Math.round(Number(refund.amount));

        const originalTx = await prisma.paymentTransaction.findFirst({
          where: { providerPaymentId: refundPaymentId },
        });

        if (originalTx) {
          await prisma.paymentTransaction.create({
            data: {
              orderId: originalTx.orderId,
              amountPaise: refundAmountPaise,
              currency: refund.currency || "INR",
              type: "REFUND",
              status: "CAPTURED",
              provider: "RAZORPAY",
              providerPaymentId: refund.id,
              referenceNote: `Refund for ${refundPaymentId}`,
              metadata: refund,
            },
          });

          // Recompute ledger
          const order = await prisma.order.findUnique({ where: { id: originalTx.orderId } });
          if (order) {
            const allTx = await prisma.paymentTransaction.findMany({
              where: { orderId: order.id },
            });
            const ledger = calculateLedgerFromTransactions(Math.round(order.totalAmount * 100), allTx);
            await prisma.order.update({
              where: { id: order.id },
              data: {
                amountPaid: ledger.netPaidPaise / 100,
                remainingAmount: ledger.balanceDuePaise / 100,
                refundedAmount: ledger.totalRefundedPaise / 100,
                refundId: refund.id,
              },
            });
          }
        }
      }
    }

    // Record idempotency record
    await prisma.processedWebhookEvent.create({
      data: {
        provider: "RAZORPAY",
        eventId,
        eventType,
      },
    });

    return NextResponse.json({ status: "processed", eventId }, { status: 200 });
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
