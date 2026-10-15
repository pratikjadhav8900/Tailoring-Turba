import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { OpsDashboardStats, OpsProductionStage } from "@/types/ops";
import { STAGE_SEQUENCE } from "@/lib/ops/workflow";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Group active orders by opsStage
    const stageGroupings = await prisma.order.groupBy({
      by: ["opsStage"],
      where: {
        opsStage: { not: null },
      },
      _count: { _all: true },
    });

    const stageCounts = STAGE_SEQUENCE.reduce((acc, stage) => {
      acc[stage] = 0;
      return acc;
    }, {} as Record<OpsProductionStage, number>);

    let totalActiveOrders = 0;
    stageGroupings.forEach((group) => {
      if (group.opsStage && group.opsStage in stageCounts) {
        stageCounts[group.opsStage] = group._count._all;
        if (group.opsStage !== "CLOSED") {
          totalActiveOrders += group._count._all;
        }
      }
    });

    // 2. Urgent orders count
    const urgentOrdersCount = await prisma.order.count({
      where: {
        opsStage: { notIn: ["CLOSED"] },
        priority: { in: ["URGENT", "RUSH"] },
      },
    });

    // 3. Due soon count (due within 48 hours and not closed)
    const dueSoonCount = await prisma.order.count({
      where: {
        opsStage: { notIn: ["CLOSED"] },
        dueDate: {
          lte: in48Hours,
          gte: now,
        },
      },
    });

    // 4. Rework count (orders currently flagged for rework in their active execution)
    const reworkCount = await prisma.productionStageExecution.count({
      where: {
        status: "FLAGGED_REWORK",
        order: {
          opsStage: { not: "CLOSED" },
        },
      },
    });

    // 5. Orders completed today
    const completedTodayCount = await prisma.order.count({
      where: {
        opsStage: "CLOSED",
        updatedAt: { gte: startOfToday },
      },
    });

    // 6. Aggregate financial metrics (Rupees)
    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: { _all: true },
    });

    const stats: OpsDashboardStats = {
      totalActiveOrders,
      urgentOrdersCount,
      dueSoonCount,
      stageCounts,
      reworkCount,
      completedTodayCount,
      grossRevenue: Math.round(revenueAgg._sum.totalAmount || 0),
      avgOrderValue: Math.round(revenueAgg._avg.totalAmount || 0),
      totalOrdersCount: revenueAgg._count._all || 0,
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("[OPS_DASHBOARD_STATS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 });
  }
}
