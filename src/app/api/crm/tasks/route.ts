import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "all"; // today | overdue | upcoming | completed | all
    const assignedToId = searchParams.get("assignedToId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    switch (view) {
      case "today":
        where.dueAt = { gte: todayStart, lt: todayEnd };
        where.status = { in: ["PENDING", "IN_PROGRESS"] };
        break;
      case "overdue":
        where.dueAt = { lt: now };
        where.status = { in: ["PENDING", "IN_PROGRESS"] };
        break;
      case "upcoming":
        where.dueAt = { gte: todayEnd };
        where.status = { in: ["PENDING", "IN_PROGRESS"] };
        break;
      case "completed":
        where.status = "COMPLETED";
        break;
      default:
        where.status = { in: ["PENDING", "IN_PROGRESS"] };
        break;
    }

    if (assignedToId) where.assignedToId = assignedToId === "unassigned" ? null : assignedToId;

    const [tasks, totalCount] = await Promise.all([
      prisma.leadTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueAt: "asc" },
        include: {
          lead: { select: { id: true, name: true, companyName: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.leadTask.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch (error: any) {
    console.error("[CRM_GET_TASKS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
