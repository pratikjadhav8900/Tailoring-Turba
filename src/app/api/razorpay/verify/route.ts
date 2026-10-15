import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sendOperationsOrderAlert, sendOrderConfirmationEmail } from '@/lib/mail';
import { getEstimatedDeliveryDateRange } from '@/lib/delivery';
import { generateInvoicePdf } from '@/lib/pdf';

// Helper to get Razorpay instance
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are missing in environment variables');
  }

  return new Razorpay({ key_id, key_secret });
}

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    // 1. Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      throw new Error("RAZORPAY_KEY_SECRET is not defined");
    }

    // 2. Verify signature
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Potential tampering detected.' },
        { status: 400 }
      );
    }

    // 3. Fetch payment details from Razorpay
    const razorpay = getRazorpay();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json(
        { error: 'Payment not successful', status: payment.status },
        { status: 400 }
      );
    }

    // 4. Find the order in our database
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { razorpayOrderId: razorpay_order_id },
          { secondRazorpayOrderId: razorpay_order_id }
        ]
      },
      include: {
        user: true,
        shippingAddress: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found for the given Razorpay Order ID' },
        { status: 404 }
      );
    }

    const isSecondPayment = existingOrder.secondRazorpayOrderId === razorpay_order_id;
    let order;

    // 5. Update the ledger and order in database
    try {
      const amountPaise = Math.round(Number(payment.amount));

      // Record transaction if not already registered by webhook
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { providerPaymentId: razorpay_payment_id },
      });

      if (!existingTx) {
        await prisma.paymentTransaction.create({
          data: {
            orderId: existingOrder.id,
            amountPaise,
            currency: payment.currency || 'INR',
            type: 'PAYMENT',
            status: 'CAPTURED',
            provider: 'RAZORPAY',
            providerOrderId: razorpay_order_id,
            providerPaymentId: razorpay_payment_id,
            providerSignature: razorpay_signature,
            referenceNote: isSecondPayment ? 'Balance Payment' : (existingOrder.isSplitPayment ? 'Advance Payment' : 'Full Payment'),
            metadata: payment as any,
          },
        });
      }

      // Compute authoritative ledger
      const allTx = await prisma.paymentTransaction.findMany({
        where: { orderId: existingOrder.id },
      });
      const orderTotalPaise = Math.round(existingOrder.totalAmount * 100);
      let grossPaidPaise = 0;
      let refundedPaise = 0;
      for (const t of allTx) {
        if (t.status === 'CAPTURED') {
          if (t.type === 'PAYMENT' || t.type === 'ADJUSTMENT') grossPaidPaise += t.amountPaise;
          if (t.type === 'REFUND') refundedPaise += t.amountPaise;
        }
      }
      const netPaidPaise = Math.max(0, grossPaidPaise - refundedPaise);
      const balanceDuePaise = Math.max(0, orderTotalPaise - netPaidPaise);

      // Determine order status progression (PENDING -> CONFIRMED)
      let targetStatus = existingOrder.status;
      let targetOpsStage = existingOrder.opsStage;
      if (existingOrder.status === 'PENDING') {
        targetStatus = 'CONFIRMED';
        if (existingOrder.opsStage === 'NEW_ORDER') {
          targetOpsStage = 'ORDER_CONFIRMED';
        }
      }

      order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: targetStatus,
          ...(targetOpsStage ? { opsStage: targetOpsStage } : {}),
          amountPaid: netPaidPaise / 100,
          remainingAmount: balanceDuePaise / 100,
          ...(isSecondPayment
            ? { secondPaymentId: razorpay_payment_id, secondPaymentStatus: 'PAID' }
            : { paymentId: razorpay_payment_id }
          ),
        },
        include: {
          user: true,
          shippingAddress: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Log timeline event
      await prisma.orderTimelineEvent.create({
        data: {
          orderId: existingOrder.id,
          eventType: isSecondPayment ? 'BALANCE_PAYMENT_CAPTURED' : 'PAYMENT_CAPTURED',
          title: isSecondPayment ? 'Balance Payment Received' : 'Order Payment Confirmed',
          description: `Received ₹${(amountPaise / 100).toFixed(2)} via Razorpay (${razorpay_payment_id}). ${balanceDuePaise === 0 ? 'Order is now Paid in Full.' : `Remaining Balance: ₹${(balanceDuePaise / 100).toFixed(2)}`}`,
          actorName: 'Razorpay Checkout',
          actorRole: 'CUSTOMER',
          isCustomerVisible: true,
          metadata: {
            amountPaise,
            balanceDuePaise,
            providerPaymentId: razorpay_payment_id,
            isSecondPayment,
          },
        },
      });

      if (targetOpsStage === 'ORDER_CONFIRMED') {
        try {
          await prisma.productionStageExecution.create({
            data: {
              orderId: existingOrder.id,
              stage: 'ORDER_CONFIRMED',
              status: 'COMPLETED',
              iteration: 1,
              employeeName: 'System / Razorpay',
              notes: 'Payment confirmed via checkout',
              startedAt: new Date(),
              completedAt: new Date(),
            },
          });

          await prisma.opsNotification.create({
            data: {
              orderId: existingOrder.id,
              orderNumber: existingOrder.orderNumber,
              type: 'ORDER_CREATED',
              title: `New Order TT-${existingOrder.orderNumber} Confirmed`,
              message: `Payment received for TT-${existingOrder.orderNumber}. Order confirmed and ready for Resource Allocation.`,
              actorName: 'Razorpay Checkout',
              readBy: [],
              metadata: {
                isNewOrder: true,
                orderId: existingOrder.id,
                orderNumber: existingOrder.orderNumber,
              },
            },
          });
        } catch (opsErr) {
          console.error('[OPS_NOTIF_RECORD_ERROR]', opsErr);
        }
      }

      console.log(`[PAYMENT_LEDGER] Payment ${razorpay_payment_id} recorded. Net Paid: ₹${netPaidPaise/100}, Balance: ₹${balanceDuePaise/100}`);
    } catch (dbErr) {
      console.error("[DB_UPDATE_ERROR] Failed to record payment in ledger:", dbErr);
    }

    // 6. Generate PDF invoice & Send email notification
    if (order) {
      try {
        const customerEmail = payment.notes?.email || payment.email || order.user.email;
        const customerName = payment.notes?.customerName || order.user.name || "Customer";

        const pdfBuffer = await generateInvoicePdf({
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          totalAmount: order.totalAmount,
          isSplitPayment: order.isSplitPayment,
          amountPaid: order.amountPaid,
          remainingAmount: order.remainingAmount,
          user: {
            name: customerName as string,
            email: customerEmail as string,
            phone: order.user.phone,
          },
          shippingAddress: order.shippingAddress ? {
            name: order.shippingAddress.name,
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          } : null,
          items: order.items.map((i: any) => ({
            product: {
              name: i.product.name,
            },
            quantity: i.quantity,
            price: i.price,
          })),
          type: isSecondPayment ? 'INVOICE' : 'PRO FORMA INVOICE',
        });

        if (customerEmail) {
          const totalQty = order.items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
          await sendOrderConfirmationEmail(
            customerEmail as string,
            customerName as string,
            order.id,
            order.isSplitPayment,
            order.amountPaid,
            pdfBuffer,
            order.orderNumber,
            getEstimatedDeliveryDateRange(order.createdAt, totalQty)
          );
          console.log('[MAIL] Invoice and confirmation email sent for order:', order.id);
        }
      } catch (err) {
        console.error('[INVOICE_MAIL_ERROR] Failed to generate/email invoice:', err);
      }

      // Notify operations of new order / updated payment
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const orderDetailsUrl = `${baseUrl}/admin/orders/${order.id}`;
      sendOperationsOrderAlert(order.id, orderDetailsUrl).catch(err => {
        console.error("[MAIL_ERROR] Failed to send operations alert:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order?.id,
    });

  } catch (error: any) {
    console.error('Razorpay payment verification error:', error);
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

