export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'INR', receipt, notes } = await request.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order: any = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise (Razorpay expects amount in smallest currency unit)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        ...notes,
        timestamp: new Date().toISOString(),
      },
      payment_capture: true, // Auto-capture payment
    });

    // Return order details to frontend
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
      },
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

