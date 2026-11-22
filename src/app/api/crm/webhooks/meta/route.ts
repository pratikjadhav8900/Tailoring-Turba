import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Meta's one-time webhook handshake (Meta App Dashboard > Webhooks > Lead Ads).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

async function fetchLeadFromGraph(leadgenId: string) {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!accessToken) return null;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`
  );
  if (!res.ok) return null;
  const data = await res.json();

  const fields: Record<string, string> = {};
  for (const f of data.field_data || []) {
    fields[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
  }
  return {
    name: fields.full_name || `${fields.first_name || ""} ${fields.last_name || ""}`.trim(),
    email: fields.email,
    phone: fields.phone_number,
    campaignId: data.campaign_id,
    adId: data.ad_id,
    formName: data.form_name || data.form_id,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta sends a batch of entry[].changes[] for page leadgen events.
    const entries = Array.isArray(body.entry) ? body.entry : [];
    let created = 0;

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;
        const leadgenId = change.value?.leadgen_id;
        if (!leadgenId) continue;

        const existing = await prisma.lead.findFirst({
          where: { source: "META_ADS", externalLeadId: String(leadgenId) },
        });
        if (existing) continue;

        const details = await fetchLeadFromGraph(String(leadgenId));

        await prisma.lead.create({
          data: {
            name: details?.name?.trim() || "Meta Ads Lead",
            email: details?.email || null,
            phone: details?.phone || null,
            source: "META_ADS",
            externalLeadId: String(leadgenId),
            sourceDetail: details?.formName || details?.campaignId || "Meta Lead Ads",
            metadata: { adId: details?.adId, campaignId: details?.campaignId, raw: change.value },
          },
        });
        created++;
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (error: any) {
    console.error("[CRM_META_WEBHOOK_ERROR]", error);
    // Always 200 so Meta doesn't disable the subscription after a transient error.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
