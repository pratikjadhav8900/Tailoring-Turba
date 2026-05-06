export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

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

    // Validate required fields
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

    // Create the expected signature
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Verify signature
    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Potential tampering detected.' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay to double-confirm
    const razorpay = getRazorpay();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json(
        { error: 'Payment not successful', status: payment.status },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Save order details to your database
    // 2. Update inventory
    // 3. Send confirmation emails
    // 4. Create shipping records
    
    const paymentRecord = {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: payment.created_at,
      order_details: order_details,
    };

    console.log('Payment verified successfully:', paymentRecord);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: paymentRecord,
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

