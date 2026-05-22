export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Razorpay from "razorpay";
import { sendBalancePaymentRequestEmail, sendOrderCancellationEmail, sendTaxInvoiceEmail } from "@/lib/mail";
import { generateInvoicePdf } from "@/lib/pdf";

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

  const { status } = await req.json();
  const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  // Fetch current order state
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: true }
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

  // Customers can only cancel their own orders, and only if status is PENDING or PROCESSING
  if (!isAdmin) {
    if (status !== "CANCELLED") {
      return NextResponse.json({ error: "Forbidden status change." }, { status: 403 });
    }
    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return NextResponse.json({ error: "Cannot cancel order that has already shipped or completed." }, { status: 400 });
    }
  }

  // Handle Cancellation (Refund Calculation and API call)
  let refundedAmount = null;
  let refundId = null;

  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    let refundAmount = 0;
    let feeDeducted = 0;
    let within24h = false;

    if (order.amountPaid > 0 && order.paymentId) {
      const now = new Date();
      const diffInMs = now.getTime() - order.createdAt.getTime();
      within24h = diffInMs <= 24 * 60 * 60 * 1000;

      if (within24h) {
        refundAmount = order.amountPaid * 0.75;
        feeDeducted = order.amountPaid * 0.25;

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
          console.log(`[RAZORPAY] Auto-refund successful. Refund ID: ${refundId}, Amount: ${refundAmount}`);
        } catch (refundErr: any) {
          console.error(`[RAZORPAY_REFUND_ERROR] Failed to auto-refund order ${order.id}:`, refundErr);
        }
      } else {
        feeDeducted = order.amountPaid;
        refundAmount = 0;
      }
    }

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
        order.orderNumber
      ).catch(err => console.error("[MAIL_ERROR] Failed to send cancellation email:", err));
    }
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

  // Update order status in DB
  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { 
      status,
      ...(refundedAmount !== null && { refundedAmount }),
      ...(refundId !== null && { refundId })
    },
  });

  return NextResponse.json(updated);
}
