import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sendOperationsOrderAlert, sendOrderConfirmationEmail } from '@/lib/mail';
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

    // 5. Update the order in our database
    try {
      if (!isSecondPayment) {
        // Initial payment (100% or 60%)
        const initialPaid = existingOrder.isSplitPayment ? existingOrder.totalAmount * 0.60 : existingOrder.totalAmount;
        const initialRemaining = existingOrder.isSplitPayment ? existingOrder.totalAmount * 0.40 : 0;

        order = await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: "PROCESSING",
            paymentId: razorpay_payment_id,
            amountPaid: initialPaid,
            remainingAmount: initialRemaining,
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
        console.log('Initial order payment finalized successfully:', order.id);
      } else {
        // Balance payment (40%)
        order = await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            secondPaymentId: razorpay_payment_id,
            secondPaymentStatus: "PAID",
            amountPaid: existingOrder.totalAmount, // Mark as fully paid
            remainingAmount: 0,
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
        console.log('Balance order payment finalized successfully:', order.id);
      }
    } catch (dbErr) {
      console.error("[DB_UPDATE_ERROR] Failed to update order status:", dbErr);
      // Even if DB update fails, return 200 since Razorpay succeeded
    }

    // 6. Generate PDF invoice & Send email notification
    if (order) {
      try {
        const pdfBuffer = await generateInvoicePdf({
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          totalAmount: order.totalAmount,
          isSplitPayment: order.isSplitPayment,
          amountPaid: order.amountPaid,
          remainingAmount: order.remainingAmount,
          user: {
            name: order.user.name,
            email: order.user.email,
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
        });

        if (order.user.email) {
          await sendOrderConfirmationEmail(
            order.user.email,
            order.user.name || "Customer",
            order.id,
            order.isSplitPayment,
            order.amountPaid,
            pdfBuffer,
            order.orderNumber
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

