import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // 1. Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Authorize user
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this order' }, { status: 403 });
    }

    // 3. Validate order split status
    if (!order.isSplitPayment) {
      return NextResponse.json({ error: 'This order is not configured for split payments' }, { status: 400 });
    }

    if (order.remainingAmount <= 0 || order.secondPaymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Balance is already fully paid' }, { status: 400 });
    }

    // 4. Create the Razorpay order for the remaining amount
    const razorpay = getRazorpay();
    console.log(`[RAZORPAY] Creating balance order for order ID ${order.id}, remaining amount: ${order.remainingAmount}`);

    let rzpOrder: any;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: Math.round(order.remainingAmount * 100), // in paise
        currency: "INR",
        receipt: `receipt_bal_${order.id.slice(-6)}_${Date.now()}`,
        notes: {
          orderId: order.id,
          userId: session.user.id,
          paymentType: "balance_40",
          timestamp: new Date().toISOString(),
        },
        payment_capture: true,
      });
      console.log('[RAZORPAY] Balance order created successfully:', rzpOrder.id);
    } catch (rzpErr: any) {
      console.error('[RAZORPAY_ERROR] Failed to create balance order at Razorpay:', rzpErr);
      return NextResponse.json(
        { error: `Razorpay Error: ${rzpErr.message || 'Failed to create order'}` },
        { status: 500 }
      );
    }

    // 5. Update order record in database with the second razorpay order ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        secondRazorpayOrderId: rzpOrder.id,
        secondPaymentStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: rzpOrder.id,
      description: `Order #${order.orderNumber || order.id.slice(-8).toUpperCase()} Balance Payment (40%)`,
    });

  } catch (error: any) {
    console.error('Razorpay balance order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate balance payment', details: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
