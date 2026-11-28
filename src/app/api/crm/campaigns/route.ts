import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { getResendClient, CAMPAIGN_FROM } from "@/lib/resend";
import {
  assertHasUnsubscribeTag,
  resolveCampaignAudience,
  syncRecipientsToSegment,
  type CampaignAudienceFilter,
} from "@/lib/crm/campaigns";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error("[CRM_GET_CAMPAIGNS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { name, subject, bodyHtml, audienceFilter, sendNow } = body as {
      name?: string;
      subject?: string;
      bodyHtml?: string;
      audienceFilter?: CampaignAudienceFilter;
      sendNow?: boolean;
    };

    if (!name?.trim() || !subject?.trim() || !bodyHtml?.trim()) {
      return NextResponse.json({ error: "Name, subject, and body are required." }, { status: 400 });
    }
    if (!audienceFilter || (!audienceFilter.includeLeads && !audienceFilter.includeCustomers)) {
      return NextResponse.json({ error: "Select at least one audience (leads or customers)." }, { status: 400 });
    }

    try {
      assertHasUnsubscribeTag(bodyHtml);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    let resend;
    try {
      resend = getResendClient();
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }

    const recipients = await resolveCampaignAudience(audienceFilter);
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients match this audience filter." }, { status: 400 });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml,
        audienceFilter: audienceFilter as any,
        recipientCount: recipients.length,
        createdById: auth.context.employee.id,
      },
    });

    try {
      const segment = await resend.segments.create({ name: `crm-campaign-${campaign.id}` });
      if (segment.error || !segment.data) {
        throw new Error(segment.error?.message || "Failed to create Resend segment.");
      }
      const segmentId = segment.data.id;

      const { succeeded, failed } = await syncRecipientsToSegment(resend, segmentId, recipients);
      if (succeeded === 0) {
        throw new Error("Failed to sync any recipients to Resend.");
      }

      const broadcastBase = {
        from: CAMPAIGN_FROM,
        subject: subject.trim(),
        html: bodyHtml,
        segmentId,
        name: name.trim(),
      };
      const broadcast = sendNow
        ? await resend.broadcasts.create({ ...broadcastBase, send: true })
        : await resend.broadcasts.create({ ...broadcastBase, send: false });

      if (broadcast.error || !broadcast.data) {
        throw new Error(broadcast.error?.message || "Failed to create Resend broadcast.");
      }

      const updated = await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: {
          resendSegmentId: segmentId,
          resendBroadcastId: broadcast.data.id,
          recipientCount: succeeded,
          status: sendNow ? "SENT" : "DRAFT",
          sentAt: sendNow ? new Date() : null,
        },
      });

      return NextResponse.json({ success: true, campaign: updated, failedSyncCount: failed });
    } catch (err: any) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: "FAILED", errorMessage: err.message || "Unknown error" },
      });
      return NextResponse.json({ error: err.message || "Failed to send campaign." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[CRM_CREATE_CAMPAIGN_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 });
  }
}
