import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to proceed.' }, { status: 401 });
  }

  try {
    const { amount, currency = 'INR', items, shippingAddress, notes } = await request.json();

    // 1. Validate required fields
    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Minimum amount of 1 INR (100 paise) is required' },
        { status: 400 }
      );
    }

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Cart items are required to initiate payment' }, { status: 400 });
    }

    // 2. Handle Shipping Address
    let finalAddressId = null;
    if (shippingAddress) {
      try {
        const newAddress = await prisma.address.create({
          data: {
            id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId: session.user.id,
            name: shippingAddress.name,
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country || "India",
            updatedAt: new Date(),
          }
        });
        finalAddressId = newAddress.id;
      } catch (addrErr) {
        console.error("[ADDRESS_CREATE_ERROR]", addrErr);
        // We continue even if address fails, but ideally we should handle it
      }
    }

    // Calculate total quantity of items to check for bulk (>= 10) split payment
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const isSplitPayment = totalQuantity >= 10;
    const chargeAmount = isSplitPayment ? amount * 0.60 : amount;
    const remainingAmount = isSplitPayment ? amount * 0.40 : 0;

    // 3. Create the Razorpay order first to get the ID
    const razorpay = getRazorpay();
    console.log('[RAZORPAY] Initiating order creation for charge amount:', chargeAmount, 'Total amount:', amount);
    
    let rzpOrder: any;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: Math.round(chargeAmount * 100), // Ensure it's an integer in paise
        currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          ...notes,
          userId: session.user.id,
          timestamp: new Date().toISOString(),
        },
        payment_capture: true,
      });
      console.log('[RAZORPAY] Order created successfully:', rzpOrder.id);
    } catch (rzpErr: any) {
      console.error('[RAZORPAY_ERROR] Failed to create order at Razorpay:', rzpErr);
      throw new Error(`Razorpay Error: ${rzpErr.message || 'Failed to create order'}`);
    }

    // 4. Create a "PENDING" order in our database for sales tracking
    console.log('[DB] Creating pending order in database...');
    try {
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          totalAmount: amount,
          status: "PENDING", // Initial status for tracking
          razorpayOrderId: rzpOrder.id,
          isSplitPayment,
          amountPaid: 0,
          remainingAmount,
          ...(finalAddressId && { shippingAddressId: finalAddressId }),
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
              ...(i.customStateJson && { customStateJson: i.customStateJson }),
              ...(i.printFiles && { printFiles: i.printFiles }),
              ...(i.mockupUrl && { mockupUrl: i.mockupUrl }),
              ...(i.mockupUrlBack && { mockupUrlBack: i.mockupUrlBack })
            })),
          },
        }
      });
      console.log('[DB] Pending order created successfully:', order.id);
    } catch (dbErr: any) {
      console.error('[DB_ERROR] Failed to create pending order record:', dbErr);
      throw new Error(`Database Error: ${dbErr.message || 'Failed to save order'}`);
    }

    // 5. Return order details to frontend
    return NextResponse.json({
      success: true,
      order: {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        receipt: rzpOrder.receipt,
      },
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error('Razorpay order initiation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initiate payment',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

