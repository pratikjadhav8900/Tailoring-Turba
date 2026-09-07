import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { trackBigShipOrder } from "@/lib/bigship";
import { calculateLedgerFromTransactions, paiseToRupees } from "@/lib/currency";
import { ShipmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

import { CUSTOMER_STAGES, deriveTrackingStage } from "@/lib/tracking-stages";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        paymentTransactions: true,
        shipments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        timelineEvents: {
          where: { isCustomerVisible: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const role = (session?.user as { role?: string })?.role;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    if (order.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let activeShipment = order.shipments[0] || null;

    // Optional on-demand sync from BigShip if active and not updated recently (> 5 mins)
    if (activeShipment?.providerOrderId && activeShipment.status !== "DELIVERED") {
      const lastUpdated = new Date(activeShipment.updatedAt).getTime();
      const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
      if (lastUpdated < fiveMinsAgo) {
        try {
          const trackRes = await trackBigShipOrder(activeShipment.providerOrderId);
          if (trackRes?.status && trackRes.data) {
            // Updated checkpoints
            activeShipment = await prisma.shipment.update({
              where: { id: activeShipment.id },
              data: {
                checkpoints: trackRes.data.tracking_history || activeShipment.checkpoints,
              },
            });
          }
        } catch (syncErr) {
          console.warn("[TRACKING_SYNC_ERROR] BigShip sync failed:", syncErr);
        }
      }
    }

    // Ledger balance
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

    const { stageKey, stageIndex } = deriveTrackingStage(order.status, activeShipment?.status);

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      currentStage: stageKey,
      currentStageIndex: stageIndex,
      stages: CUSTOMER_STAGES.map((s, idx) => ({
        ...s,
        completed: idx + 1 < stageIndex,
        active: idx + 1 === stageIndex,
        upcoming: idx + 1 > stageIndex,
      })),
      ledger: {
        totalAmountPaise: ledger.orderTotalPaise,
        netPaidPaise: ledger.netPaidPaise,
        balanceDuePaise: ledger.balanceDuePaise,
        isPaidInFull: ledger.isPaidInFull,
        balanceDueFormatted: `₹${(ledger.balanceDuePaise / 100).toFixed(2)}`,
      },
      shipment: activeShipment
        ? {
            courierName: activeShipment.courierName,
            awbNumber: activeShipment.awbNumber,
            status: activeShipment.status,
            checkpoints: activeShipment.checkpoints,
          }
        : null,
      timeline: order.timelineEvents.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("[ORDER_TRACK_ROUTE_ERROR]", { message: error?.message });
    return NextResponse.json({ error: "Failed to retrieve tracking details. Please try again." }, { status: 500 });
  }
}
