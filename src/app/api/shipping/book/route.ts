import { NextRequest, NextResponse } from 'next/server';
import { manifestBigShipOrder } from '@/lib/bigship';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, masterCustomOrderId, courierId, courierName, shippingCharge } = await req.json();

    const manifestRes = await manifestBigShipOrder({
      masterCustomOrderId,
      courierId,
    });

    if (!manifestRes.status) {
      return NextResponse.json({ error: manifestRes.message || 'Failed to manifest order' }, { status: 400 });
    }

    // Update the order in our DB
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        bigshipOrderId: masterCustomOrderId,
        bigshipTrackingId: String(manifestRes.data.awb_assigned),
        bigshipCourierName: courierName,
        shippingCharge: parseFloat(shippingCharge),
      },
    });

    return NextResponse.json(manifestRes);
  } catch (error: any) {
    console.error('[SHIPPING_BOOK_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
