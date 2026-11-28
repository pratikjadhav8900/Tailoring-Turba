import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processPendingWhatsAppRecipients } from "@/lib/crm/whatsapp-broadcasts";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 100;

/**
 * Safety net for any WhatsApp recipients left PENDING after the in-request
 * first batch and any manual "Send more" clicks — see the schema comment on
 * WhatsAppBroadcast. Runs once/day (vercel.json), the max frequency Vercel's
 * Hobby plan allows for cron jobs; Vercel only auto-sends the CRON_SECRET
 * Authorization header on an actual cron invocation.
 */
export async function POST(req: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    console.error("[WHATSAPP_CRON] CRON_SECRET is not configured.");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${configuredSecret}`;
  const incomingBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);
  if (
    incomingBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(incomingBuffer, expectedBuffer)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processPendingWhatsAppRecipients({ limit: BATCH_LIMIT });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[WHATSAPP_CRON_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to process queue" }, { status: 500 });
  }
}

// Vercel invokes cron jobs with GET by default.
export const GET = POST;
