import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { LEAD_STAGE_ORDER, LEAD_STAGE_LABELS, WON_STAGES } from "@/types/crm";
import type { LeadStage } from "@/types/crm";

export const dynamic = "force-dynamic";

// "Qualified" on the dashboard = leads that engaged positively (Interested, Converted, or Closed).
const QUALIFIED_PLUS_STAGES = new Set<LeadStage>(["INTERESTED", ...WON_STAGES]);
const WON_SET = new Set<LeadStage>(WON_STAGES);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Three queries total (leads, recent contact activities, open tasks) instead of
 * ~17 separate count/aggregate round-trips — every stat below is derived in memory.
 */
export async function GET() {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const since7 = daysAgo(7);
    const prev7 = daysAgo(14);
    const since30 = daysAgo(30);
    const since14 = daysAgo(14);
    const now = new Date();
    const todayStart = daysAgo(0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [leads, contactedActivities, openTasks] = await Promise.all([
      prisma.lead.findMany({
        select: {
          id: true,
          status: true,
          score: true,
          expectedValue: true,
          createdAt: true,
          updatedAt: true,
          convertedAt: true,
          nextFollowUpAt: true,
        },
      }),
      prisma.leadActivity.findMany({
        where: {
          type: { in: ["CALL", "WHATSAPP", "EMAIL", "MEETING"] },
          createdAt: { gte: since30 },
        },
        select: { leadId: true, createdAt: true },
      }),
      prisma.leadTask.findMany({
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        select: { dueAt: true },
      }),
    ]);

    const totalLeads = leads.length;
    let newLast7 = 0;
    let newPrev7 = 0;
    let qualifiedTotal = 0;
    let qualifiedLast7 = 0;
    let qualifiedPrev7 = 0;
    let hotLeads = 0;
    let overdueCount = 0;
    let wonLast30 = 0;
    let lostLast30 = 0;
    let pipelineValue = 0;
    let wonValueLast30 = 0;
    const stageCountMap = new Map<string, number>();
    const createdMap = new Map<string, Date>();
    const sparklineBuckets = new Array(7).fill(0);

    for (const lead of leads) {
      createdMap.set(lead.id, lead.createdAt);
      stageCountMap.set(lead.status, (stageCountMap.get(lead.status) || 0) + 1);

      const isQualifiedPlus = QUALIFIED_PLUS_STAGES.has(lead.status as LeadStage);
      const isWon = WON_SET.has(lead.status as LeadStage);
      const isTerminal = isWon || lead.status === "NOT_INTERESTED";

      if (lead.createdAt >= since7) newLast7++;
      else if (lead.createdAt >= prev7) newPrev7++;

      if (lead.createdAt >= since14) {
        const dayIndex = Math.floor((now.getTime() - lead.createdAt.getTime()) / 86400000);
        const bucket = 6 - dayIndex;
        if (bucket >= 0 && bucket < 7) sparklineBuckets[bucket]++;
      }

      if (isQualifiedPlus) {
        qualifiedTotal++;
        if (lead.updatedAt >= since7) qualifiedLast7++;
        else if (lead.updatedAt >= prev7) qualifiedPrev7++;
      }

      if (lead.score >= 8) hotLeads++;

      if (lead.nextFollowUpAt && lead.nextFollowUpAt < now && !isTerminal) overdueCount++;

      if (isWon && lead.convertedAt && lead.convertedAt >= since30) {
        wonLast30++;
        wonValueLast30 += lead.expectedValue || 0;
      }
      if (lead.status === "NOT_INTERESTED" && lead.updatedAt >= since30) lostLast30++;

      if (!isTerminal) pipelineValue += lead.expectedValue || 0;
    }

    // Average response time: hours from lead creation to first contact activity.
    let avgResponseHours: number | null = null;
    if (contactedActivities.length > 0) {
      const firstContactMap = new Map<string, Date>();
      for (const activity of contactedActivities) {
        const existing = firstContactMap.get(activity.leadId);
        if (!existing || activity.createdAt < existing) {
          firstContactMap.set(activity.leadId, activity.createdAt);
        }
      }
      const diffs: number[] = [];
      firstContactMap.forEach((contactedAt, leadId) => {
        const createdAt = createdMap.get(leadId);
        if (createdAt) diffs.push((contactedAt.getTime() - createdAt.getTime()) / 36e5);
      });
      if (diffs.length > 0) avgResponseHours = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    }

    let overdueTaskCount = 0;
    let todayTaskCount = 0;
    for (const task of openTasks) {
      if (task.dueAt < now) overdueTaskCount++;
      else if (task.dueAt >= todayStart && task.dueAt < todayEnd) todayTaskCount++;
    }

    const pctChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 1000) / 10;
    };

    const funnel = LEAD_STAGE_ORDER.map((stage) => ({
      stage,
      label: LEAD_STAGE_LABELS[stage],
      count: stageCountMap.get(stage) || 0,
      pct: totalLeads > 0 ? Math.round(((stageCountMap.get(stage) || 0) / totalLeads) * 1000) / 10 : 0,
    }));

    const conversionRate30 = wonLast30 + lostLast30 > 0 ? Math.round((wonLast30 / (wonLast30 + lostLast30)) * 1000) / 10 : null;

    return NextResponse.json({
      totalLeads,
      newLeads: { value: newLast7, changePct: pctChange(newLast7, newPrev7), sparkline: sparklineBuckets },
      qualifiedLeads: { value: qualifiedTotal, changePct: pctChange(qualifiedLast7, qualifiedPrev7) },
      hotLeads: { value: hotLeads },
      overdueFollowUps: { value: overdueCount },
      wonLast30Days: { value: wonLast30 },
      lostLast30Days: { value: lostLast30 },
      conversionRate30Days: conversionRate30,
      pipelineValue,
      wonValueLast30Days: wonValueLast30,
      avgResponseTimeHours: avgResponseHours,
      funnel,
      tasks: { overdue: overdueTaskCount, dueToday: todayTaskCount },
    });
  } catch (error: any) {
    console.error("[CRM_DASHBOARD_STATS_ERROR]", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
