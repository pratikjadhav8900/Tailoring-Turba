import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppConfig, listApprovedTemplates } from "@/lib/whatsapp";
import {
  resolveWhatsAppAudience,
  processPendingWhatsAppRecipients,
  type WhatsAppAudienceFilter,
} from "@/lib/crm/whatsapp-broadcasts";

export const dynamic = "force-dynamic";

const FIRST_BATCH_LIMIT = 40;

export async function GET() {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const broadcasts = await prisma.whatsAppBroadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
    });
    return NextResponse.json({ broadcasts });
  } catch (error: any) {
    console.error("[CRM_GET_WHATSAPP_BROADCASTS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch broadcasts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { name, templateName, templateLanguage, templateCategory, variables, audienceFilter } = body as {
      name?: string;
      templateName?: string;
      templateLanguage?: string;
      templateCategory?: string;
      variables?: string[];
      audienceFilter?: WhatsAppAudienceFilter;
    };

    if (!name?.trim() || !templateName || !templateLanguage) {
      return NextResponse.json({ error: "Name and template are required." }, { status: 400 });
    }

    try {
      getWhatsAppConfig();
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }

    const approved = await listApprovedTemplates();
    const template = approved.find((t) => t.name === templateName && t.language === templateLanguage);
    if (!template) {
      return NextResponse.json({ error: "That template is no longer approved. Pick another." }, { status: 400 });
    }

    const recipients = await resolveWhatsAppAudience(audienceFilter || {});
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients match this audience filter." }, { status: 400 });
    }

    const broadcast = await prisma.$transaction(async (tx) => {
      const created = await tx.whatsAppBroadcast.create({
        data: {
          name: name.trim(),
          templateName,
          templateLanguage,
          templateCategory: templateCategory || template.category,
          variables: variables && variables.length > 0 ? variables : undefined,
          audienceFilter: (audienceFilter || {}) as any,
          recipientCount: recipients.length,
          createdById: auth.context.employee.id,
        },
      });

      await tx.whatsAppBroadcastRecipient.createMany({
        data: recipients.map((r) => ({
          broadcastId: created.id,
          leadId: r.leadId,
          name: r.name,
          phone: r.phone,
        })),
      });

      return created;
    });

    const result = await processPendingWhatsAppRecipients({ broadcastId: broadcast.id, limit: FIRST_BATCH_LIMIT });

    const updated = await prisma.whatsAppBroadcast.findUnique({ where: { id: broadcast.id } });

    return NextResponse.json({ success: true, broadcast: updated, firstBatch: result });
  } catch (error: any) {
    console.error("[CRM_CREATE_WHATSAPP_BROADCAST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to create broadcast" }, { status: 500 });
  }
}
