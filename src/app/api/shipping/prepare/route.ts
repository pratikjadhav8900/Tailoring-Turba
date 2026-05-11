import { NextRequest, NextResponse } from 'next/server';
import { createBigShipOrder, getRatesForOrder } from '@/lib/bigship';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getFullStateName } from '@/lib/logistics';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, warehouseId, weight, length, breadth, height } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shippingAddress: true, user: true, items: { include: { product: true } } },
    });

    if (!order || !order.shippingAddress) {
      return NextResponse.json({ error: 'Order or shipping address not found' }, { status: 404 });
    }

    // Calculate products and handle potential mismatch between totalAmount and sum of items
    const productsList = order.items.map((item) => ({
      productName: item.product.name.replace(/[^a-zA-Z\s\-_]/g, ''),
      qty: String(item.quantity),
      amount: String(item.price),
      totalAmount: item.price * item.quantity,
      collectableAmount: 0,
      categoryId: '1',
    }));

    const itemsTotal = productsList.reduce((sum, item) => sum + item.totalAmount, 0);
    const diff = order.totalAmount - itemsTotal;

    if (Math.abs(diff) > 0.01) {
      productsList.push({
        productName: diff > 0 ? 'Taxes and Service Charges' : 'Discount',
        qty: '1',
        amount: String(Math.abs(diff)),
        totalAmount: Math.abs(diff),
        collectableAmount: 0,
        categoryId: '1',
      } as any);
    }

    // Prepare BigShip Draft Order Payload (Orders use domestic_b2c)
    const bigShipPayload = {
      segment_type: 'domestic_b2c',
      MasterOrderPickUpLocation: parseInt(warehouseId),
      MasterOrderReturnLocation: parseInt(warehouseId),
      MasterOrderDate: new Date().toISOString().split('T')[0],
      MasterOrderPaymentMode: 1, // Prepaid
      OrderInvoiceNo: `${order.orderNumber || order.id}-${Date.now().toString().slice(-4)}`,
      MasterOrderInvoiceAmount: order.totalAmount,
      // Receiver Information
      MasterOrderShippingEmail: order.user.email || 'customer@example.com',
      MasterOrderShippingName: order.shippingAddress.name,
      MasterOrderShippingMobileNo: order.user.phone || '9999999999',
      MasterOrderShippingAddress: order.shippingAddress.street,
      MasterOrderShippingAddress2: '',
      MasterOrderShippingLandmark: '',
      MasterOrderShippingZipCode: order.shippingAddress.postalCode.trim(),
      MasterOrderShippingCountry: 'India',
      MasterOrderShippingState: getFullStateName(order.shippingAddress.state),
      MasterOrderShippingCity: order.shippingAddress.city.trim().toUpperCase(),
      totalNumOfBoxes: 1,
      boxes: [
        {
          weight_unit: 'kg',
          dimension_unit: 'cm',
          noOfBoxes: 1,
          dimensions: [
            {
              length: parseInt(length),
              breadth: parseInt(breadth),
              height: parseInt(height),
              weight: parseFloat(weight),
            },
          ],
          products: productsList,
        },
      ],
    };

    const draftRes = await createBigShipOrder(bigShipPayload);
    if (!draftRes.status) {
      return NextResponse.json({ error: draftRes.message || 'Failed to create draft order' }, { status: 400 });
    }

    const masterCustomOrderId = draftRes.data.CustomGlobalOrderId;

    // Get Rates
    const ratesRes = await getRatesForOrder(masterCustomOrderId);
    
    return NextResponse.json({
      masterCustomOrderId,
      rates: ratesRes.data?.calculatedRates || [],
    });

  } catch (error: any) {
    console.error('[SHIPPING_PREPARE_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
