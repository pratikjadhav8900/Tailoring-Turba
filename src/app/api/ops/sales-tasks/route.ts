import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Cross-department LeadTask view for employees who don't have /crm access
 * (e.g. Accounts staff asked by a sales rep to prepare a quotation). Reuses
 * the same LeadTask rows CRM writes — this is the Ops-side window onto them,
 * not a separate task system.
 */
export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") === "created" ? "created" : "assigned";
    const statusParam = searchParams.get("status") || "ACTIVE"; // ACTIVE | COMPLETED | ALL

    const where: any = view === "created"
      ? { createdById: auth.context.employee.id }
      : { assignedToId: auth.context.employee.id };

    if (statusParam === "ACTIVE") {
      where.status = { in: ["PENDING", "IN_PROGRESS"] };
    } else if (statusParam === "COMPLETED") {
      where.status = "COMPLETED";
    }

    const tasks = await prisma.leadTask.findMany({
      where,
      orderBy: { dueAt: "asc" },
      take: 100,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
            requirements: true,
            quantity: true,
            expectedValue: true,
          },
        },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      tasks,
      currentEmployeeId: auth.context.employee.id,
    });
  } catch (error: any) {
    console.error("[OPS_GET_SALES_TASKS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  }
}
