import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sendOperationsOrderAlert } from '@/lib/mail';

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

    // 4. Update the order in our database from PENDING to PROCESSING
    let order;
    try {
      order = await prisma.order.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          status: "PROCESSING",
          paymentId: razorpay_payment_id,
        },
      });
      console.log('Order finalized successfully:', order.id);
    } catch (dbErr) {
      console.error("[DB_UPDATE_ERROR] Failed to update order status:", dbErr);
      // Even if DB update fails, the payment was successful, so we return 200 but log error
    }

    // 5. Notify Operations
    if (order) {
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

