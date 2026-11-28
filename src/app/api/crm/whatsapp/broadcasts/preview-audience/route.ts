import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { resolveWhatsAppAudience, type WhatsAppAudienceFilter } from "@/lib/crm/whatsapp-broadcasts";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const filter = (await req.json()) as WhatsAppAudienceFilter;
    const recipients = await resolveWhatsAppAudience(filter || {});
    return NextResponse.json({
      count: recipients.length,
      sample: recipients.slice(0, 8).map((r) => ({ name: r.name, phone: r.phone })),
    });
  } catch (error: any) {
    console.error("[CRM_WHATSAPP_PREVIEW_AUDIENCE_ERROR]", error);
    return NextResponse.json({ error: "Failed to preview audience" }, { status: 500 });
  }
}
