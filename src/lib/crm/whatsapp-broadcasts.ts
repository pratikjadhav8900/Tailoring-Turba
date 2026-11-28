import type { LeadSource, LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendTemplateMessage } from "@/lib/whatsapp";
import { validateAndNormalizePhone } from "@/lib/phone";

export interface WhatsAppAudienceFilter {
  leadStages?: LeadStage[]; // empty/omitted = all stages
  leadSources?: LeadSource[]; // empty/omitted = all sources
}

export interface WhatsAppRecipientCandidate {
  leadId: string;
  name: string;
  phone: string; // E.164
}

/** Leads only (see schema comment on WhatsAppBroadcast) — excludes opted-out and unparseable phone numbers. */
export async function resolveWhatsAppAudience(
  filter: WhatsAppAudienceFilter
): Promise<WhatsAppRecipientCandidate[]> {
  const where: any = { phone: { not: null }, whatsappOptOut: false };
  if (filter.leadStages && filter.leadStages.length > 0) where.status = { in: filter.leadStages };
  if (filter.leadSources && filter.leadSources.length > 0) where.source = { in: filter.leadSources };

  const leads = await prisma.lead.findMany({ where, select: { id: true, name: true, phone: true } });

  const seen = new Set<string>();
  const recipients: WhatsAppRecipientCandidate[] = [];
  for (const lead of leads) {
    if (!lead.phone) continue;
    const { isValid, normalized } = validateAndNormalizePhone(lead.phone, "IN");
    if (!isValid || !normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    recipients.push({ leadId: lead.id, name: lead.name, phone: normalized });
  }
  return recipients;
}

const LEAD_NAME_TOKEN = "{{lead_name}}";

function resolveBodyParams(variables: unknown, recipientName: string): string[] | undefined {
  if (!Array.isArray(variables) || variables.length === 0) return undefined;
  return variables.map((v) => (v === LEAD_NAME_TOKEN ? recipientName : String(v)));
}

/**
 * Processes up to `limit` PENDING recipients (optionally scoped to one
 * broadcast), sending each via the Graph API and updating status. Called
 * from three places: synchronously right after a broadcast is created,
 * a manual "Send more" button, and the daily cron safety net — see the
 * schema comment on WhatsAppBroadcast for why there's no real-time queue.
 */
export async function processPendingWhatsAppRecipients(params: {
  broadcastId?: string;
  limit: number;
}): Promise<{ processed: number; sent: number; failed: number }> {
  const pending = await prisma.whatsAppBroadcastRecipient.findMany({
    where: { status: "PENDING", ...(params.broadcastId ? { broadcastId: params.broadcastId } : {}) },
    orderBy: { createdAt: "asc" },
    take: params.limit,
    include: { broadcast: true },
  });

  let sent = 0;
  let failed = 0;

  for (const recipient of pending) {
    const bodyParams = resolveBodyParams(recipient.broadcast.variables, recipient.name);
    const result = await sendTemplateMessage({
      to: recipient.phone,
      templateName: recipient.broadcast.templateName,
      languageCode: recipient.broadcast.templateLanguage,
      bodyParams,
    });

    if (result.success) {
      sent++;
      await prisma.whatsAppBroadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "SENT", waMessageId: result.waMessageId, sentAt: new Date() },
      });
    } else {
      failed++;
      await prisma.whatsAppBroadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "FAILED", errorMessage: result.error, failedAt: new Date() },
      });
    }
  }

  const touchedBroadcastIds = Array.from(new Set(pending.map((r) => r.broadcastId)));
  for (const broadcastId of touchedBroadcastIds) {
    const remainingPending = await prisma.whatsAppBroadcastRecipient.count({
      where: { broadcastId, status: "PENDING" },
    });
    if (remainingPending > 0) continue;

    const [total, failedCount] = await Promise.all([
      prisma.whatsAppBroadcastRecipient.count({ where: { broadcastId } }),
      prisma.whatsAppBroadcastRecipient.count({ where: { broadcastId, status: "FAILED" } }),
    ]);

    await prisma.whatsAppBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: failedCount === 0 ? "SENT" : failedCount === total ? "FAILED" : "PARTIAL",
        sentAt: new Date(),
      },
    });
  }

  return { processed: pending.length, sent, failed };
}
