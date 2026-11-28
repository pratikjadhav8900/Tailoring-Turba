import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { getResendClient } from "@/lib/resend";

export const dynamic = "force-dynamic";

/** Sends a campaign that was previously saved as a draft (sendNow: false on creation). */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const campaign = await prisma.emailCampaign.findUnique({ where: { id: params.id } });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }
    if (campaign.status !== "DRAFT" || !campaign.resendBroadcastId) {
      return NextResponse.json({ error: "Only a draft campaign can be sent." }, { status: 400 });
    }

    let resend;
    try {
      resend = getResendClient();
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }

    const result = await resend.broadcasts.send(campaign.resendBroadcastId);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const updated = await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    console.error("[CRM_SEND_CAMPAIGN_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to send campaign" }, { status: 500 });
  }
}
