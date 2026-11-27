export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Razorpay from "razorpay";
import { sendBalancePaymentRequestEmail, sendOrderCancellationEmail, sendTaxInvoiceEmail, sendOrderDeliveredEmail } from "@/lib/mail";
import { generateInvoicePdf } from "@/lib/pdf";
import { validateOrderTransition } from "@/lib/order-state";
import { calculateLedgerFromTransactions } from "@/lib/currency";

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are missing in environment variables');
  }

  return new Razorpay({ key_id, key_secret });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      paymentTransactions: true,
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  if (order.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { status, bigshipCourierName, bigshipTrackingId, overrideConfirmed, overrideReason } = body;
  
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "IN_PRODUCTION",
    "QUALITY_CHECK",
    "READY_TO_SHIP",
    "DISPATCHED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED"
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  // Fetch current order state and ledger
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: true, paymentTransactions: true }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Check roles
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isOwner = order.userId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Customers can only cancel their own orders, and only if status is PENDING, CONFIRMED, or PROCESSING
  if (!isAdmin) {
    if (status !== "CANCELLED") {
      return NextResponse.json({ error: "Forbidden status change." }, { status: 403 });
    }
    if (order.status !== "PENDING" && order.status !== "CONFIRMED" && order.status !== "PROCESSING") {
      return NextResponse.json({ error: "Cannot cancel order that has already entered production or shipped." }, { status: 400 });
    }
  }

  // Authoritative Ledger Calculation
  const ledger = calculateLedgerFromTransactions(
    Math.round(order.totalAmount * 100),
    order.paymentTransactions || []
  );
  // Legacy fallback if no ledger entries exist
  if (order.paymentTransactions.length === 0 && order.amountPaid > 0) {
    const paidPaise = Math.round(order.amountPaid * 100);
    ledger.grossPaidPaise = paidPaise;
    ledger.netPaidPaise = paidPaise;
    ledger.balanceDuePaise = Math.max(0, ledger.orderTotalPaise - paidPaise);
    ledger.isPaidInFull = ledger.balanceDuePaise === 0;
  }

  // Enforce transition validation & dispatch gating
  const validation = validateOrderTransition(order.status, status, ledger, {
    userRole: role,
    overrideConfirmed,
    overrideReason,
  });

  if (!validation.allowed) {
    return NextResponse.json({
      error: validation.message,
      code: validation.code,
      balanceDuePaise: ledger.balanceDuePaise,
    }, { status: validation.code === "UNAUTHORIZED_OVERRIDE" ? 403 : 422 });
  }

  // If dispatch override was executed, log dedicated audit event
  if (validation.isOverride) {
    await prisma.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventType: "DISPATCH_OVERRIDE_EXECUTED",
        title: "Dispatch Override Authorized",
        description: `Admin override executed by ${session.user.name || session.user.email}. Reason: "${overrideReason}". Outstanding balance: ₹${(ledger.balanceDuePaise / 100).toFixed(2)}.`,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email || "Admin",
        actorRole: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
        isCustomerVisible: false,
        metadata: {
          previousStatus: order.status,
          targetStatus: status,
          balanceDuePaise: ledger.balanceDuePaise,
          reason: overrideReason,
        },
      },
    });
  }

  // Handle Cancellation (Refund Calculation and API call)
  let refundedAmount = null;
  let refundId = null;
  let cancellationOutcome: { within24h: boolean; refundAmount: number; feeDeducted: number; refundSucceeded: boolean } | null = null;

  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    let refundAmount = 0;
    let feeDeducted = 0;
    let within24h = false;
    let refundAttempted = false;
    let refundSucceeded = false;

    if (order.amountPaid > 0 && order.paymentId) {
      const now = new Date();
      const diffInMs = now.getTime() - order.createdAt.getTime();
      within24h = diffInMs <= 24 * 60 * 60 * 1000;

      if (within24h) {
        refundAmount = order.amountPaid * 0.75;
        feeDeducted = order.amountPaid * 0.25;
        refundAttempted = true;

        try {
          const razorpay = getRazorpay();
          const refund = await razorpay.payments.refund(order.paymentId, {
            amount: Math.round(refundAmount * 100), // in paise
            notes: {
              orderId: order.id,
              reason: "Auto-refund: Order cancelled within 24 hours"
            }
          });
          refundId = refund.id;
          refundedAmount = refundAmount;
          refundSucceeded = true;
          console.log(`[RAZORPAY] Auto-refund successful. Refund ID: ${refundId}, Amount: ${refundAmount}`);
        } catch (refundErr: any) {
          // IMPORTANT: refundedAmount/refundId stay null on failure (so the order record
          // never claims a refund that didn't happen) and refundSucceeded stays false so
          // the customer email and the Ops alert below both reflect the real outcome
          // instead of silently telling everyone a refund is on its way.
          console.error(`[RAZORPAY_REFUND_ERROR] Failed to auto-refund order ${order.id}:`, refundErr);
        }
      } else {
        feeDeducted = order.amountPaid;
        refundAmount = 0;
      }
    }

    cancellationOutcome = { within24h, refundAmount, feeDeducted, refundSucceeded: refundAttempted ? refundSucceeded : true };

    // Send Cancellation Email
    if (order.user.email) {
      sendOrderCancellationEmail(
        order.user.email,
        order.user.name || "Customer",
        order.id,
        order.amountPaid,
        refundAmount,
        feeDeducted,
        within24h,
        order.orderNumber,
        refundAttempted ? refundSucceeded : true
      ).catch(err => console.error("[MAIL_ERROR] Failed to send cancellation email:", err));
    }

    // Make the cancellation visible to Ops: cancellation previously never touched
    // opsStage, created no timeline entry and sent no notification, so a cancelled
    // order's production work could silently continue (the /api/ops/orders ACTIVE
    // filter above now also excludes CANCELLED orders as a second line of defense).
    await prisma.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventType: "ORDER_CANCELLED",
        title: "Order Cancelled by Customer",
        description: refundAttempted
          ? (refundSucceeded
              ? `Customer cancelled the order. 75% refund of ₹${refundAmount.toFixed(2)} processed automatically via Razorpay (25% cancellation fee retained).`
              : `Customer cancelled the order. Automatic 75% refund of ₹${refundAmount.toFixed(2)} FAILED — requires manual refund via Razorpay.`)
          : `Customer cancelled the order.${feeDeducted > 0 ? ` No refund issued (cancelled after the 24-hour window; ₹${feeDeducted.toFixed(2)} forfeited).` : ""}`,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email || "Customer",
        actorRole: isAdmin ? "ADMIN" : "CUSTOMER",
        isCustomerVisible: true,
        metadata: { within24h, refundAttempted, refundSucceeded, refundAmount, feeDeducted },
      },
    });

    await prisma.opsNotification.create({
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        type: refundAttempted && !refundSucceeded ? "ORDER_CANCELLED_REFUND_FAILED" : "ORDER_CANCELLED",
        title: refundAttempted && !refundSucceeded ? "Order Cancelled — Refund Needs Manual Action" : "Order Cancelled",
        message: refundAttempted && !refundSucceeded
          ? `Order #${order.orderNumber} was cancelled by the customer. The automatic refund of ₹${refundAmount.toFixed(2)} failed — process it manually in Razorpay.`
          : `Order #${order.orderNumber} was cancelled by the customer. Stop any in-progress production work on this order.`,
        actorName: session.user.name || session.user.email || "Customer",
        metadata: { within24h, refundAttempted, refundSucceeded, refundAmount, feeDeducted },
      },
    });
  }

  // Handle Dispatch / Shipped (Split Payment Balance Request Email + Tax Invoice)
  if (status === "SHIPPED" && order.status !== "SHIPPED") {
    // If it's a split payment and the balance is still unpaid
    if (order.isSplitPayment && order.remainingAmount > 0 && order.secondPaymentStatus !== "PAID") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const paymentLink = `${baseUrl}/checkout/pay-balance?orderId=${order.id}`;
      
      if (order.user.email) {
        sendBalancePaymentRequestEmail(
          order.user.email,
          order.user.name || "Customer",
          order.id,
          order.remainingAmount,
          paymentLink,
          order.orderNumber
        ).catch(err => console.error("[MAIL_ERROR] Failed to send balance request email:", err));
        console.log(`[MAIL] Sent split payment balance request email for order: ${order.id}`);
      }
    }

    // Generate and email Tax Invoice PDF to customer
    if (order.user.email) {
      const fullOrderForPdf = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          items: { include: { product: true } },
          user: { select: { name: true, email: true, phone: true } },
          shippingAddress: true,
        },
      });

      if (fullOrderForPdf) {
        const pdfOrder = {
          id: fullOrderForPdf.id,
          orderNumber: fullOrderForPdf.orderNumber,
          createdAt: fullOrderForPdf.createdAt,
          totalAmount: fullOrderForPdf.totalAmount,
          isSplitPayment: fullOrderForPdf.isSplitPayment ?? false,
          amountPaid: fullOrderForPdf.amountPaid ?? 0,
          remainingAmount: fullOrderForPdf.remainingAmount ?? 0,
          user: {
            name: fullOrderForPdf.user?.name ?? null,
            email: fullOrderForPdf.user?.email ?? null,
            phone: fullOrderForPdf.user?.phone ?? null,
          },
          shippingAddress: fullOrderForPdf.shippingAddress ? {
            name: fullOrderForPdf.shippingAddress.name,
            street: fullOrderForPdf.shippingAddress.street,
            city: fullOrderForPdf.shippingAddress.city,
            state: fullOrderForPdf.shippingAddress.state,
            postalCode: fullOrderForPdf.shippingAddress.postalCode,
            country: fullOrderForPdf.shippingAddress.country,
          } : null,
          items: fullOrderForPdf.items.map(i => ({ product: { name: i.product.name }, quantity: i.quantity, price: i.price })),
          type: 'INVOICE' as const,
        };

        generateInvoicePdf(pdfOrder).then(pdfBuffer => {
          return sendTaxInvoiceEmail(
            fullOrderForPdf.user!.email!,
            fullOrderForPdf.user!.name || 'Customer',
            fullOrderForPdf.id,
            pdfBuffer,
            fullOrderForPdf.orderNumber ?? undefined
          );
        }).catch(err => console.error("[MAIL_ERROR] Failed to send Tax Invoice email:", err));
        console.log(`[MAIL] Queued Tax Invoice email for order: ${order.id}`);
      }
    }
  }

  // Handle Delivered
  if (status === "DELIVERED" && order.status !== "DELIVERED") {
    if (order.user.email) {
      sendOrderDeliveredEmail(
        order.user.email,
        order.user.name || "Customer",
        order.id,
        order.orderNumber ?? undefined
      ).catch(err => console.error("[MAIL_ERROR] Failed to send order delivered email:", err));
      console.log(`[MAIL] Sent order delivered email for order: ${order.id}`);
    }
  }

  // Update order status in DB
  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { 
      status,
      ...(refundedAmount !== null && { refundedAmount }),
      ...(refundId !== null && { refundId }),
      ...(bigshipCourierName !== undefined && { bigshipCourierName }),
      ...(bigshipTrackingId !== undefined && { bigshipTrackingId })
    },
  });

  return NextResponse.json(cancellationOutcome ? { ...updated, cancellationOutcome } : updated);
}
