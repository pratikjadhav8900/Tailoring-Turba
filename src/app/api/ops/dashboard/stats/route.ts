import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type {
  OpsDashboardStats,
  OpsProductionStage,
  OpsWorkerPerformance,
  OpsMonthlyActivity,
} from "@/types/ops";
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

    // 6. Fetch all orders for comprehensive real calculations
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        amountPaid: true,
        opsStage: true,
        status: true,
        createdAt: true,
        items: {
          select: { quantity: true },
        },
      },
    });

    const grossRevenue = Math.round(allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0));
    const totalPaidRevenue = Math.round(allOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0));
    const totalOrdersCount = allOrders.length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(grossRevenue / totalOrdersCount) : 0;
    const totalPieces = allOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }, 0);

    // 7. Monthly transaction activity for current year
    const currentYear = now.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenueMap = new Array(12).fill(0);
    const monthlyCountMap = new Array(12).fill(0);

    allOrders.forEach((o) => {
      const date = new Date(o.createdAt);
      if (date.getFullYear() === currentYear) {
        const m = date.getMonth();
        monthlyRevenueMap[m] += o.totalAmount || 0;
        monthlyCountMap[m] += 1;
      }
    });

    const maxMonthlyRev = Math.max(...monthlyRevenueMap);
    const monthlyActivity = monthNames.map((name, idx) => {
      const rev = monthlyRevenueMap[idx];
      const count = monthlyCountMap[idx];
      const height = maxMonthlyRev > 0 ? Math.max(10, Math.round((rev / maxMonthlyRev) * 100)) : 10;
      const isCurrentMonth = idx === now.getMonth();
      return {
        name,
        monthIndex: idx,
        revenue: Math.round(rev),
        orderCount: count,
        height: rev > 0 ? height : 10,
        active: isCurrentMonth,
      };
    });

    const selectedYearAverageMonthlyRevenue = Math.round(grossRevenue / 12);

    // 8. Real task execution & production fulfillment performance
    const allStageExecutions = await prisma.productionStageExecution.findMany({
      where: {
        NOT: [
          {
            stage: "NEW_ORDER",
            notes: { contains: "Order created via Turba Ops" },
          },
        ],
      },
      select: {
        id: true,
        stage: true,
        status: true,
        employeeId: true,
        employeeName: true,
        completedAt: true,
        metadata: true,
      },
    });

    // Designated production floor tasks
    const workerTasks = allStageExecutions.filter((t) => {
      const meta = (t.metadata as Record<string, any>) || {};
      return Boolean(meta.taskTitle || meta.title || t.employeeId);
    });

    const totalTasks = workerTasks.length;
    const completedTasks = workerTasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 9. Real factory floor workers
    const workersList = await prisma.employee.findMany({
      where: {
        isActive: true,
        roleTitle: { contains: "Worker" },
      },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        roleTitle: true,
      },
    });

    const workers: OpsWorkerPerformance[] = workersList.map((w) => {
      const workerTasksForPerson = workerTasks.filter((t) => t.employeeId === w.id);
      const completed = workerTasksForPerson.filter((t) => t.status === "COMPLETED").length;
      const inProgress = workerTasksForPerson.filter((t) => t.status !== "COMPLETED").length;
      return {
        id: w.id,
        name: w.name,
        employeeCode: w.employeeCode,
        roleTitle: w.roleTitle,
        completedTasks: completed,
        inProgressTasks: inProgress,
      };
    });

    // 10. Total registered customer accounts
    const totalRegisteredClients = await prisma.user.count({
      where: { role: "USER" },
    });

    // 11. Vendor and External Work Metrics
    const [
      activeVendorsCount,
      awaitingVendorAssignment,
      rawMaterialPending,
      goodsWithExternalPartners,
      overdueDeliveries,
      partiallyReceivedGoods,
      completedAwaitingNextStage,
    ] = await Promise.all([
      prisma.vendorPartner.count({ where: { isActive: true } }),
      prisma.order.count({
        where: {
          opsStage: { in: ["RESOURCE_FABRIC", "CUTTING", "STITCHING", "BRANDING_PRINTING"] },
          externalAssignments: { none: {} },
        },
      }),
      prisma.externalWorkAssignment.count({
        where: {
          stage: "RESOURCE_FABRIC",
          status: { notIn: ["COMPLETED", "RECEIVED", "CANCELLED"] },
        },
      }),
      prisma.externalWorkAssignment.count({
        where: {
          status: { in: ["SENT_TO_PARTNER", "IN_PROGRESS", "PARTIALLY_RECEIVED"] },
        },
      }),
      prisma.externalWorkAssignment.count({
        where: {
          expectedDeliveryDate: { lt: now },
          status: { notIn: ["COMPLETED", "RECEIVED", "CANCELLED"] },
        },
      }),
      prisma.externalWorkAssignment.count({
        where: {
          status: "PARTIALLY_RECEIVED",
        },
      }),
      prisma.externalWorkAssignment.count({
        where: {
          status: { in: ["COMPLETED", "RECEIVED"] },
          order: {
            opsStage: { in: ["RESOURCE_FABRIC", "CUTTING", "STITCHING", "BRANDING_PRINTING"] },
          },
        },
      }),
    ]);

    const stats: OpsDashboardStats = {
      totalActiveOrders,
      urgentOrdersCount,
      dueSoonCount,
      stageCounts,
      reworkCount,
      completedTodayCount,
      grossRevenue,
      avgOrderValue,
      totalOrdersCount,
      totalPaidRevenue,
      totalPieces,
      totalRegisteredClients,
      taskPerformance: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionRate,
      },
      workers,
      monthlyActivity,
      selectedYearAverageMonthlyRevenue,
      vendorMetrics: {
        awaitingVendorAssignment,
        rawMaterialPending,
        goodsWithExternalPartners,
        overdueDeliveries,
        partiallyReceivedGoods,
        completedAwaitingNextStage,
        activeVendorsCount,
      },
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("[OPS_DASHBOARD_STATS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 });
  }
}
