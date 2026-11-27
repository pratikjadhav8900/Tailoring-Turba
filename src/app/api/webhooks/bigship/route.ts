import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";
import { calculateLedgerFromTransactions } from "@/lib/currency";
import { processOutboxNotification } from "@/lib/outbox";

export const dynamic = "force-dynamic";

function mapBigShipStatusToShipmentStatus(rawStatus: string): ShipmentStatus {
  const s = (rawStatus || "").toUpperCase();
  // RTO and "undelivered" checks MUST run before the generic DELIVERED check below:
  // carrier strings like "RTO DELIVERED" and "UNDELIVERED" both contain the substring
  // "DELIVERED" and would otherwise be misclassified as a successful delivery.
  if (s.includes("RTO") || s.includes("RETURN")) return "RETURNED_TO_ORIGIN";
  if (s.includes("UNDELIVERED") || s.includes("FAILED")) return "FAILED_ATTEMPT";
  if (s.includes("DELIVERED")) return "DELIVERED";
  if (s.includes("OUT FOR DELIVERY") || s.includes("OUT_FOR_DELIVERY")) return "OUT_FOR_DELIVERY";
  if (s.includes("IN TRANSIT") || s.includes("IN_TRANSIT") || s.includes("REACHED") || s.includes("CONNECTED")) return "IN_TRANSIT";
  if (s.includes("PICKED UP") || s.includes("PICKED_UP") || s.includes("MANIFEST")) return "PICKED_UP";
  if (s.includes("CANCEL")) return "CANCELLED";
  return "IN_TRANSIT";
}

export async function POST(req: NextRequest) {
  try {
    // 1. Webhook Authentication Gate: Fail closed if secret is not configured
    const configuredSecret = process.env.BIGSHIP_WEBHOOK_SECRET;
    if (!configuredSecret) {
      console.error("[BIGSHIP_WEBHOOK] BIGSHIP_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ error: "Webhook authentication configuration error." }, { status: 500 });
    }

    const incomingSecret =
      req.headers.get("x-bigship-secret") ||
      req.headers.get("x-webhook-secret") ||
      (req.headers.get("authorization")?.startsWith("Bearer ")
        ? req.headers.get("authorization")?.slice(7).trim()
        : null) ||
      req.nextUrl.searchParams.get("secret") ||
      req.nextUrl.searchParams.get("token");

    if (!incomingSecret) {
      return NextResponse.json({ error: "Unauthorized: Missing webhook authentication." }, { status: 401 });
    }

    // Timing-safe secret verification
    const incomingBuffer = Buffer.from(incomingSecret);
    const configuredBuffer = Buffer.from(configuredSecret);

    if (
      incomingBuffer.length !== configuredBuffer.length ||
      !crypto.timingSafeEqual(incomingBuffer, configuredBuffer)
    ) {
      return NextResponse.json({ error: "Forbidden: Invalid webhook secret." }, { status: 403 });
    }

    const body = await req.json();
    const eventId = body.event_id || body.scan_id || `bs_${Date.now()}`;
    const awb = body.awb || body.tracking_no || body.airway_bill_no;
    const rawStatus = body.current_status || body.status || "";
    const location = body.location || body.hub || "";
    const message = body.status_description || body.message || rawStatus;

    if (!awb) {
      return NextResponse.json({ error: "Missing AWB" }, { status: 400 });
    }

    // Idempotency check
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "BIGSHIP",
          eventId: String(eventId),
        },
      },
    });

    if (existingEvent) {
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    // Find active shipment
    const shipment = await prisma.shipment.findFirst({
      where: { awbNumber: String(awb) },
      include: {
        order: {
          include: {
            user: true,
            paymentTransactions: true,
          },
        },
      },
    });

    if (!shipment) {
      console.warn(`[BIGSHIP_WEBHOOK] No shipment record found for AWB: ${awb}`);
      return NextResponse.json({ status: "shipment_not_found" }, { status: 200 });
    }

    const newShipmentStatus = mapBigShipStatusToShipmentStatus(rawStatus);
    const existingCheckpoints = Array.isArray(shipment.checkpoints) ? (shipment.checkpoints as any[]) : [];
    const updatedCheckpoints = [
      ...existingCheckpoints,
      {
        timestamp: new Date().toISOString(),
        rawStatus,
        status: newShipmentStatus,
        location,
        message,
      },
    ];

    // Update Shipment entity (authoritative current courier state)
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: newShipmentStatus,
        checkpoints: updatedCheckpoints,
        ...(newShipmentStatus === "DELIVERED" && { deliveredAt: new Date() }),
      },
    });

    // Customer Out-for-Delivery notification rule
    if (newShipmentStatus === "OUT_FOR_DELIVERY" && shipment.status !== "OUT_FOR_DELIVERY") {
      const order = shipment.order;
      const ledger = calculateLedgerFromTransactions(
        Math.round(order.totalAmount * 100),
        order.paymentTransactions || []
      );

      await prisma.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "SHIPMENT_OUT_FOR_DELIVERY",
          title: "Out for Delivery",
          description: `Package is on the delivery vehicle for final delivery today via ${shipment.courierName || "carrier"} (AWB: ${awb}).`,
          actorName: "BigShip Logistics",
          actorRole: "WEBHOOK",
          isCustomerVisible: true,
          metadata: {
            awb,
            courierName: shipment.courierName,
            balanceDuePaise: ledger.balanceDuePaise,
          },
        },
      });

      // Queue Outbox notification for customer, then attempt it immediately — there is no
      // separate worker/cron draining this table, so without this the row just sits as
      // PENDING forever and the customer never gets the email.
      if (order.user?.email) {
        const outboxEntry = await prisma.outboxNotification.create({
          data: {
            orderId: order.id,
            channel: "EMAIL",
            template: "OUT_FOR_DELIVERY",
            recipient: order.user.email,
            payload: {
              orderNumber: order.orderNumber,
              awb,
              courierName: shipment.courierName,
              balanceDuePaise: ledger.balanceDuePaise,
              isPaidInFull: ledger.isPaidInFull,
            },
          },
        });
        processOutboxNotification(outboxEntry.id).catch((err) =>
          console.error("[OUTBOX_IMMEDIATE_SEND_ERROR]", err)
        );
      }
    }

    // Carrier confirmed delivery
    if (newShipmentStatus === "DELIVERED" && shipment.order.status !== "DELIVERED") {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: "DELIVERED" },
      });

      await prisma.orderTimelineEvent.create({
        data: {
          orderId: shipment.orderId,
          eventType: "ORDER_DELIVERED",
          title: "Order Delivered",
          description: `Package successfully delivered to recipient by ${shipment.courierName || "carrier"}.`,
          actorName: "BigShip Logistics",
          actorRole: "WEBHOOK",
          isCustomerVisible: true,
          metadata: { awb },
        },
      });
    }

    // Save processed event
    await prisma.processedWebhookEvent.create({
      data: {
        provider: "BIGSHIP",
        eventId: String(eventId),
        eventType: rawStatus,
        orderId: shipment.orderId,
      },
    });

    return NextResponse.json({ status: "success", shipmentId: shipment.id }, { status: 200 });
  } catch (error: any) {
    console.error("[BIGSHIP_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
