import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackBigShipOrder } from "@/lib/bigship";
import { calculateLedgerFromTransactions, paiseToRupees, rupeesToPaise } from "@/lib/currency";
import { CUSTOMER_STAGES, deriveTrackingStage } from "@/lib/tracking-stages";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 1. IP-level rate limiting: max 15 requests per minute
    const ipLimit = checkRateLimit(`track_public_ip_${clientIp}`, 15, 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many tracking attempts. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { orderIdentifier, contactInfo } = body;

    if (!orderIdentifier || !contactInfo) {
      return NextResponse.json(
        { error: "Please provide both Order Number and Email/Phone used during checkout." },
        { status: 400 }
      );
    }

    const cleanId = String(orderIdentifier).trim();
    const cleanContact = String(contactInfo).trim().toLowerCase();

    // 2. Pair-level rate limiting (orderIdentifier + contact): max 5 queries per 5 minutes
    const pairLimit = checkRateLimit(`track_pair_${cleanId}_${cleanContact}`, 5, 5 * 60 * 1000);
    if (!pairLimit.allowed) {
      return NextResponse.json(
        { error: "Too many lookup requests for this order. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(pairLimit.retryAfterSeconds) } }
      );
    }

    const isEmail = cleanContact.includes("@");
    const digitsOnly = cleanContact.replace(/\D/g, "");

    // Require valid email or at least 10 digits for phone match (rejects partial searches like "9")
    if (!isEmail && digitsOnly.length < 10) {
      return NextResponse.json(
        { error: "No matching order found. Please verify your Order Number and Email/Phone." },
        { status: 404 }
      );
    }

    const last10 = digitsOnly.slice(-10);
    const contactCondition = isEmail
      ? [{ user: { email: { equals: cleanContact, mode: "insensitive" as const } } }]
      : [
          {
            user: {
              OR: [
                { phone: { equals: cleanContact } },
                { phone: { equals: digitsOnly } },
                { phone: { equals: `+91${last10}` } },
                { phone: { equals: `+91 ${last10}` } },
                { phone: { equals: `0${last10}` } },
                { phone: { equals: last10 } },
              ],
            },
          },
        ];

    const isNumericId = !isNaN(Number(cleanId)) && Number.isInteger(Number(cleanId));
    const orderNumberCondition = isNumericId ? [{ orderNumber: Number(cleanId) }] : [];

    // Look up by order number, ID, or AWB
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...orderNumberCondition,
          { id: cleanId },
          { shipments: { some: { awbNumber: cleanId } } },
          { bigshipTrackingId: cleanId },
        ],
        AND: contactCondition,
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
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
      // 3. Failed lookup tracking to deter sequential order enumeration
      const failedLimit = checkRateLimit(`track_fail_ip_${clientIp}`, 8, 5 * 60 * 1000);
      if (!failedLimit.allowed) {
        return NextResponse.json(
          { error: "Too many failed lookup attempts. Tracking temporarily blocked." },
          { status: 429, headers: { "Retry-After": String(failedLimit.retryAfterSeconds) } }
        );
      }

      return NextResponse.json(
        { error: "No matching order found. Please verify your Order Number and Email/Phone." },
        { status: 404 }
      );
    }

    let activeShipment = order.shipments[0] || null;

    // Synchronize latest checkpoints from BigShip if active
    if (activeShipment?.providerOrderId && activeShipment.status !== "DELIVERED") {
      const lastUpdated = new Date(activeShipment.updatedAt).getTime();
      const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
      if (lastUpdated < fiveMinsAgo) {
        try {
          const trackRes = await trackBigShipOrder(activeShipment.providerOrderId);
          if (trackRes?.status && trackRes.data) {
            activeShipment = await prisma.shipment.update({
              where: { id: activeShipment.id },
              data: {
                checkpoints: trackRes.data.tracking_history || activeShipment.checkpoints,
              },
            });
          }
        } catch (syncErr) {
          console.warn("[PUBLIC_TRACKING_SYNC_ERROR] BigShip sync failed:", syncErr);
        }
      }
    }

    // Authoritative financial ledger
    let ledger;
    if (order.paymentTransactions && order.paymentTransactions.length > 0) {
      ledger = calculateLedgerFromTransactions(rupeesToPaise(order.totalAmount), order.paymentTransactions as any);
    } else {
      const grossPaidPaise = rupeesToPaise(order.amountPaid || 0);
      const totalPaise = rupeesToPaise(order.totalAmount);
      const balancePaise = Math.max(0, totalPaise - grossPaidPaise);
      ledger = {
        orderTotalPaise: totalPaise,
        grossPaidPaise,
        totalRefundedPaise: rupeesToPaise(order.refundedAmount || 0),
        netPaidPaise: grossPaidPaise,
        balanceDuePaise: balancePaise,
        isPaidInFull: balancePaise === 0,
      };
    }

    const stage = deriveTrackingStage(order.status, activeShipment?.status);
    const balanceDueRupees = Math.round(paiseToRupees(ledger.balanceDuePaise));

    // Return sanitized customer tracking DTO
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber || order.id.slice(-8).toUpperCase(),
      createdAt: order.createdAt,
      status: order.status,
      currentStage: {
        key: stage.stageKey,
        index: stage.stageIndex,
        label: CUSTOMER_STAGES[stage.stageIndex - 1]?.label || stage.stageKey,
        description: CUSTOMER_STAGES[stage.stageIndex - 1]?.description || "",
      },
      stages: CUSTOMER_STAGES,
      ledger: {
        totalAmount: order.totalAmount,
        balanceDueRupees,
        isPaidInFull: ledger.isPaidInFull,
        canPayBalance: balanceDueRupees > 0 && order.status !== "CANCELLED",
      },
      shipment: activeShipment
        ? {
            carrier: activeShipment.courierName || "Courier Partner",
            awbNumber: activeShipment.awbNumber,
            status: activeShipment.status,
            checkpoints: Array.isArray(activeShipment.checkpoints) ? activeShipment.checkpoints : [],
          }
        : order.bigshipTrackingId
        ? {
            carrier: order.bigshipCourierName || "Logistics Partner",
            awbNumber: order.bigshipTrackingId,
            status: order.status === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
            checkpoints: [],
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product?.name || "Custom Apparel",
        quantity: item.quantity,
        image: item.product?.images?.[0] || null,
      })),
      timeline: order.timelineEvents.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        createdAt: e.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("[PUBLIC_TRACK_ERROR]", err);
    return NextResponse.json({ error: "Unable to track order. Please try again." }, { status: 500 });
  }
}
