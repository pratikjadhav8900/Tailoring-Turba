import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { resolveCampaignAudience, type CampaignAudienceFilter } from "@/lib/crm/campaigns";

export const dynamic = "force-dynamic";

/** Resolves (but does not send to) an audience filter, so the composer can show a live recipient count before sending. */
export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const audienceFilter = (await req.json()) as CampaignAudienceFilter;
    if (!audienceFilter || (!audienceFilter.includeLeads && !audienceFilter.includeCustomers)) {
      return NextResponse.json({ count: 0, sample: [] });
    }

    const recipients = await resolveCampaignAudience(audienceFilter);
    return NextResponse.json({
      count: recipients.length,
      sample: recipients.slice(0, 8),
    });
  } catch (error: any) {
    console.error("[CRM_PREVIEW_AUDIENCE_ERROR]", error);
    return NextResponse.json({ error: "Failed to preview audience" }, { status: 500 });
  }
}
