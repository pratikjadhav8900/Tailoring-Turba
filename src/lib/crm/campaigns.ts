import type { Resend } from "resend";
import type { LeadSource, LeadStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RESEND_UNSUBSCRIBE_TAG } from "@/lib/crm/campaign-constants";

export interface CampaignAudienceFilter {
  includeLeads: boolean;
  leadStages?: LeadStage[]; // empty/omitted = all stages
  leadSources?: LeadSource[]; // empty/omitted = all sources
  includeCustomers: boolean;
}

export interface CampaignRecipient {
  email: string;
  name: string;
}

export function assertHasUnsubscribeTag(bodyHtml: string) {
  if (!bodyHtml.includes(RESEND_UNSUBSCRIBE_TAG)) {
    throw new Error(
      "The email body must include an unsubscribe link (the inserted unsubscribe tag) before it can be sent."
    );
  }
}

/** Resolves the audience from our own DB — Resend Segments are just static containers, the filtering logic lives here. */
export async function resolveCampaignAudience(filter: CampaignAudienceFilter): Promise<CampaignRecipient[]> {
  const recipients = new Map<string, CampaignRecipient>();

  if (filter.includeLeads) {
    const where: Prisma.LeadWhereInput = { email: { not: null } };
    if (filter.leadStages && filter.leadStages.length > 0) where.status = { in: filter.leadStages };
    if (filter.leadSources && filter.leadSources.length > 0) where.source = { in: filter.leadSources };

    const leads = await prisma.lead.findMany({ where, select: { name: true, email: true } });
    for (const lead of leads) {
      if (!lead.email) continue;
      const key = lead.email.toLowerCase().trim();
      if (!recipients.has(key)) recipients.set(key, { email: lead.email.trim(), name: lead.name });
    }
  }

  if (filter.includeCustomers) {
    const customers = await prisma.user.findMany({
      where: { role: "USER", email: { not: null } },
      select: { name: true, email: true },
    });
    for (const customer of customers) {
      if (!customer.email) continue;
      const key = customer.email.toLowerCase().trim();
      if (!recipients.has(key)) recipients.set(key, { email: customer.email.trim(), name: customer.name || "" });
    }
  }

  return Array.from(recipients.values());
}

async function withConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      await fn(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 1 }, worker));
}

/**
 * Resend Contacts are global per-account; a contact already existing (from a
 * prior campaign) is expected, not an error — fetched by email and attached
 * to the new segment instead of re-created. Bounded concurrency keeps this
 * inside a single Vercel function's time budget for realistic list sizes;
 * like the CRM's CSV import, a very large list could still hit the timeout —
 * not solved here, same accepted tradeoff already documented for that path.
 */
export async function syncRecipientsToSegment(
  resend: Resend,
  segmentId: string,
  recipients: CampaignRecipient[]
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  await withConcurrency(recipients, 5, async (recipient) => {
    try {
      const [firstName, ...rest] = recipient.name.trim().split(" ").filter(Boolean);
      const created = await resend.contacts.create({
        email: recipient.email,
        firstName: firstName || undefined,
        lastName: rest.join(" ") || undefined,
        segments: [{ id: segmentId }],
      });

      if (created.error) {
        const existing = await resend.contacts.get({ email: recipient.email });
        if (existing.error || !existing.data) {
          failed++;
          return;
        }
        await resend.contacts.segments.add({ contactId: existing.data.id, segmentId });
      }
      succeeded++;
    } catch {
      failed++;
    }
  });

  return { succeeded, failed };
}
