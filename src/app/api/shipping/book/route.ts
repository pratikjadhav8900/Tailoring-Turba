import { NextRequest, NextResponse } from 'next/server';
import { manifestBigShipOrder } from '@/lib/bigship';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { calculateLedgerFromTransactions } from '@/lib/currency';
import { generateInvoicePdf } from '@/lib/pdf';
import { sendTaxInvoiceEmail } from '@/lib/mail';
import { processOutboxNotification } from '@/lib/outbox';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      orderId,
      masterCustomOrderId,
      courierId,
      courierName,
      shippingCharge,
      overrideConfirmed,
      overrideReason,
    } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentTransactions: true,
        user: true,
        shippingAddress: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 1. Dispatch Gating: Calculate Ledger Balance
    const ledger = calculateLedgerFromTransactions(
      Math.round(order.totalAmount * 100),
      order.paymentTransactions || []
    );
    if (order.paymentTransactions.length === 0 && order.amountPaid > 0) {
      const paidPaise = Math.round(order.amountPaid * 100);
      ledger.grossPaidPaise = paidPaise;
      ledger.netPaidPaise = paidPaise;
      ledger.balanceDuePaise = Math.max(0, ledger.orderTotalPaise - paidPaise);
      ledger.isPaidInFull = ledger.balanceDuePaise === 0;
    }

    if (ledger.balanceDuePaise > 0) {
      if (!overrideConfirmed) {
        return NextResponse.json({
          error: 'DISPATCH_LOCKED',
          code: 'DISPATCH_LOCKED',
          message: `Cannot book shipment: Outstanding balance of ₹${(ledger.balanceDuePaise / 100).toFixed(2)} must be settled, or an authorized admin override must be confirmed.`,
          balanceDuePaise: ledger.balanceDuePaise,
        }, { status: 422 });
      }

      if (!overrideReason || overrideReason.trim().length < 5) {
        return NextResponse.json({
          error: 'A detailed reason (at least 5 characters) must be provided for a dispatch override.',
          code: 'MISSING_OVERRIDE_REASON',
        }, { status: 422 });
      }

      // Log dispatch override event
      await prisma.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'DISPATCH_OVERRIDE_EXECUTED',
          title: 'Carrier Dispatch Override Authorized',
          description: `BigShip booking authorized with unpaid balance of ₹${(ledger.balanceDuePaise / 100).toFixed(2)}. Rationale: "${overrideReason}".`,
          actorId: session.user.id,
          actorName: session.user.name || session.user.email || 'Admin',
          actorRole: session.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
          isCustomerVisible: false,
          metadata: {
            courierName,
            balanceDuePaise: ledger.balanceDuePaise,
            reason: overrideReason,
          },
        },
      });
    }

    // 2. Manifest shipment with BigShip
    const manifestRes = await manifestBigShipOrder({
      masterCustomOrderId,
      courierId,
    });

    if (!manifestRes.status) {
      return NextResponse.json({ error: manifestRes.message || 'Failed to manifest order with BigShip' }, { status: 400 });
    }

    const awbAssigned = String(manifestRes.data?.awb_assigned || '');
    const shippingChargePaise = shippingCharge ? Math.round(parseFloat(shippingCharge) * 100) : null;

    // 3. Create Shipment record in dedicated logistics table
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        status: 'BOOKED',
        provider: 'BIGSHIP',
        courierName: courierName || 'BigShip Courier',
        awbNumber: awbAssigned,
        providerOrderId: masterCustomOrderId,
        shippingChargePaise,
        dispatchedAt: new Date(),
        checkpoints: [
          {
            timestamp: new Date().toISOString(),
            status: 'BOOKED',
            message: `Shipment manifested with ${courierName}. AWB: ${awbAssigned}`,
          },
        ],
      },
    });

    // 4. Update Order (authoritative status = DISPATCHED + legacy mirrors)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DISPATCHED',
        bigshipOrderId: masterCustomOrderId,
        bigshipTrackingId: awbAssigned,
        bigshipCourierName: courierName,
        shippingCharge: shippingCharge ? parseFloat(shippingCharge) : undefined,
        ...(overrideReason && { dispatchOverrideReason: overrideReason, dispatchOverriddenBy: session.user.id }),
      },
    });

    // 5. Log Timeline Event
    await prisma.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventType: 'SHIPMENT_DISPATCHED',
        title: 'Order Dispatched',
        description: `Package manifested via ${courierName || 'carrier'}. Tracking No (AWB): ${awbAssigned}`,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email || 'Admin',
        actorRole: session.user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
        isCustomerVisible: true,
        metadata: {
          shipmentId: shipment.id,
          courierName,
          awbNumber: awbAssigned,
        },
      },
    });

    // 6. Non-blocking Side Effect: Generate and send Tax Invoice PDF
    if (order.user?.email) {
      const pdfOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        isSplitPayment: order.isSplitPayment ?? false,
        amountPaid: order.amountPaid ?? 0,
        remainingAmount: order.remainingAmount ?? 0,
        user: {
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        },
        shippingAddress: order.shippingAddress
          ? {
              name: order.shippingAddress.name,
              street: order.shippingAddress.street,
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              postalCode: order.shippingAddress.postalCode,
              country: order.shippingAddress.country,
            }
          : null,
        items: order.items.map((i) => ({ product: { name: i.product.name }, quantity: i.quantity, price: i.price })),
        type: 'INVOICE' as const,
      };

      generateInvoicePdf(pdfOrder)
        .then((pdfBuffer) => {
          return sendTaxInvoiceEmail(
            order.user!.email!,
            order.user!.name || 'Customer',
            order.id,
            pdfBuffer,
            order.orderNumber ?? undefined
          );
        })
        .catch(async (emailErr) => {
          console.error('[INVOICE_EMAIL_ERROR] Failed to send Tax Invoice email:', emailErr);
          // Record the failed attempt, then immediately retry once — there is no separate
          // worker/cron draining this table, so without this the row just sits as FAILED
          // forever and the customer never gets the tax invoice.
          const outboxEntry = await prisma.outboxNotification.create({
            data: {
              orderId: order.id,
              channel: 'EMAIL',
              template: 'TAX_INVOICE',
              recipient: order.user!.email!,
              payload: { orderId: order.id, awbAssigned },
              status: 'FAILED',
              lastError: emailErr.message || 'Failed to dispatch email',
              attemptCount: 1,
            },
          });
          processOutboxNotification(outboxEntry.id).catch((err) =>
            console.error('[OUTBOX_IMMEDIATE_SEND_ERROR]', err)
          );
        });
    }

    return NextResponse.json({
      success: true,
      data: manifestRes.data,
      shipmentId: shipment.id,
      awbNumber: awbAssigned,
    });
  } catch (error: any) {
    console.error('[SHIPPING_BOOK_ERROR]', { message: error?.message });
    return NextResponse.json({ error: "Failed to book shipment with carrier. Please check details and try again." }, { status: 500 });
  }
}
