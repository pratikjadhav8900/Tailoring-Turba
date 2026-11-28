import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Meta's one-time webhook handshake (Meta App Dashboard > Webhooks > WhatsApp Business Account).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

const STATUS_MAP: Record<string, { status: "DELIVERED" | "READ" | "FAILED"; field: "deliveredAt" | "readAt" | "failedAt" }> = {
  delivered: { status: "DELIVERED", field: "deliveredAt" },
  read: { status: "READ", field: "readAt" },
  failed: { status: "FAILED", field: "failedAt" },
};

/** Delivery-status updates for messages we sent (sent/delivered/read/failed) — same HMAC pattern as the Meta Lead Ads webhook. */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const configuredSecret = process.env.META_WHATSAPP_APP_SECRET;
    if (!configuredSecret) {
      console.error("[WHATSAPP_WEBHOOK] META_WHATSAPP_APP_SECRET is not configured.");
      return NextResponse.json({ success: false }, { status: 200 }); // 200 so Meta doesn't disable the subscription
    }

    const signatureHeader = req.headers.get("x-hub-signature-256") || "";
    const expectedSignature =
      "sha256=" + crypto.createHmac("sha256", configuredSecret).update(rawBody).digest("hex");
    const incomingBuffer = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      incomingBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(incomingBuffer, expectedBuffer)
    ) {
      console.warn("[WHATSAPP_WEBHOOK] Invalid or missing X-Hub-Signature-256.");
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const body = JSON.parse(rawBody);
    const entries = Array.isArray(body.entry) ? body.entry : [];
    let updated = 0;

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const statuses = change.value?.statuses || [];

        for (const statusUpdate of statuses) {
          const mapped = STATUS_MAP[statusUpdate.status as string];
          if (!mapped || !statusUpdate.id) continue;

          const result = await prisma.whatsAppBroadcastRecipient.updateMany({
            where: { waMessageId: statusUpdate.id },
            data: {
              status: mapped.status,
              [mapped.field]: new Date(),
              ...(mapped.status === "FAILED"
                ? { errorMessage: statusUpdate.errors?.[0]?.title || "Delivery failed" }
                : {}),
            },
          });
          updated += result.count;
        }
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("[WHATSAPP_WEBHOOK_ERROR]", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
