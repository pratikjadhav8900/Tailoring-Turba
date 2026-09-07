import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { calculateAuthoritativePricing } from '@/lib/server-pricing';

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
    const { amount: clientReportedAmount, currency = 'INR', items, shippingAddress, notes } = await request.json();

    // 1. Validate cart presence
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required to initiate payment' }, { status: 400 });
    }

    // 2. Compute Authoritative Server-Side Pricing (Server-Authoritative C-1)
    let pricing;
    try {
      pricing = await calculateAuthoritativePricing(items, clientReportedAmount);
    } catch (pricingErr: any) {
      return NextResponse.json({ error: pricingErr.message || 'Invalid cart item configuration.' }, { status: 400 });
    }

    // 3. Handle Shipping Address
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
      }
    }

    // 4. Create the Razorpay order with authoritative server charge amount
    const razorpay = getRazorpay();
    console.log(
      '[RAZORPAY] Initiating authoritative order:',
      'Charge (paise):', pricing.chargeAmountPaise,
      'Final Total (INR):', pricing.finalTotal,
      'Client claimed:', clientReportedAmount
    );
    
    let rzpOrder: any;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: pricing.chargeAmountPaise, // Authoritative integer in paise
        currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          ...notes,
          userId: session.user.id,
          authoritativeTotal: String(pricing.finalTotal),
          timestamp: new Date().toISOString(),
        },
        payment_capture: true,
      });
      console.log('[RAZORPAY] Order created successfully:', rzpOrder.id);
    } catch (rzpErr: any) {
      console.error('[RAZORPAY_ERROR] Failed to create order at Razorpay:', rzpErr);
      throw new Error(`Razorpay Error: ${rzpErr.message || 'Failed to create order'}`);
    }

    // 5. Create "PENDING" order in database storing authoritative server prices
    console.log('[DB] Creating pending order in database...');
    try {
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          totalAmount: pricing.finalTotal, // Authoritative total
          status: "PENDING",
          razorpayOrderId: rzpOrder.id,
          isSplitPayment: pricing.isSplitPayment,
          amountPaid: 0,
          remainingAmount: pricing.remainingAmount,
          ...(finalAddressId && { shippingAddressId: finalAddressId }),
          items: {
            create: pricing.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.effectiveUnitPrice, // Authoritative unit price
              ...(i.customStateJson && { customStateJson: i.customStateJson }),
              ...(i.printFiles && { printFiles: i.printFiles }),
              ...(i.mockupUrl && { mockupUrl: i.mockupUrl }),
              ...(i.mockupUrlBack && { mockupUrlBack: i.mockupUrlBack }),
              ...(i.mockupUrlLeft && { mockupUrlLeft: i.mockupUrlLeft }),
              ...(i.mockupUrlRight && { mockupUrlRight: i.mockupUrlRight })
            })),
          },
        }
      });
      console.log('[DB] Pending order created successfully:', order.id);
    } catch (dbErr: any) {
      console.error('[DB_ERROR] Failed to create pending order record:', dbErr);
      throw new Error(`Database Error: ${dbErr.message || 'Failed to save order'}`);
    }

    // 6. Return order details to frontend
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
