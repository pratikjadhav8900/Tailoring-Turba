import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function timingSafeKeyMatch(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

// Google Ads Lead Form "webhook delivery" posts { api_version, google_key, lead_id, ... user_column_data[] }
// where google_key is the security token configured in the lead form's webhook settings.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const configuredKey = process.env.GOOGLE_LEAD_FORM_KEY;
    if (!configuredKey || typeof body.google_key !== "string" || !timingSafeKeyMatch(body.google_key, configuredKey)) {
      return NextResponse.json({ error: "Invalid webhook key" }, { status: 403 });
    }

    // Date.now() here would give every delivery/retry lacking lead_id/gcl_id a different
    // "id", defeating the dedupe check right below and creating a duplicate Lead on every
    // retry. Derive a stable key from the payload's own content instead.
    const fallbackKey = crypto
      .createHash("sha256")
      .update(JSON.stringify(body.user_column_data || body))
      .digest("hex")
      .slice(0, 32);
    const leadId = String(body.lead_id || body.gcl_id || fallbackKey);

    const existing = await prisma.lead.findFirst({
      where: { source: "GOOGLE_ADS", externalLeadId: leadId },
    });
    if (existing) {
      return NextResponse.json({ success: true, created: false });
    }

    const columns: { column_id?: string; string_value?: string }[] = body.user_column_data || [];
    const getField = (id: string) =>
      columns.find((c) => c.column_id === id)?.string_value?.trim() || "";

    const name = getField("FULL_NAME") || `${getField("FIRST_NAME")} ${getField("LAST_NAME")}`.trim();
    const email = getField("EMAIL");
    const phone = getField("PHONE_NUMBER");

    await prisma.lead.create({
      data: {
        name: name || "Google Ads Lead",
        email: email || null,
        phone: phone || null,
        source: "GOOGLE_ADS",
        externalLeadId: leadId,
        sourceDetail: body.campaign_id ? `Campaign ${body.campaign_id}` : "Google Lead Form",
        metadata: { campaignId: body.campaign_id, formId: body.form_id, raw: body },
      },
    });

    return NextResponse.json({ success: true, created: true });
  } catch (error: any) {
    console.error("[CRM_GOOGLE_WEBHOOK_ERROR]", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
