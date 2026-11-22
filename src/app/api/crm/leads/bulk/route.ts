import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { leadIds, action, value } = body as {
      leadIds: string[];
      action: "assign" | "status" | "delete" | "favourite";
      value?: string | boolean;
    };

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "No leads selected" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
      return NextResponse.json({ success: true, affected: leadIds.length });
    }

    if (action === "assign") {
      await prisma.$transaction(async (tx) => {
        await tx.lead.updateMany({
          where: { id: { in: leadIds } },
          data: { assignedToId: (value as string) || null },
        });
        await tx.leadActivity.createMany({
          data: leadIds.map((leadId) => ({
            leadId,
            type: "ASSIGNED" as const,
            note: `Bulk reassigned by ${auth.context.employee.name}`,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
          })),
        });
      });
      return NextResponse.json({ success: true, affected: leadIds.length });
    }

    if (action === "status") {
      await prisma.$transaction(async (tx) => {
        await tx.lead.updateMany({
          where: { id: { in: leadIds } },
          data: { status: value as any },
        });
        await tx.leadActivity.createMany({
          data: leadIds.map((leadId) => ({
            leadId,
            type: "STATUS_CHANGE" as const,
            note: `Bulk status change to ${value} by ${auth.context.employee.name}`,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
          })),
        });
      });
      return NextResponse.json({ success: true, affected: leadIds.length });
    }

    if (action === "favourite") {
      await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { isFavourite: !!value },
      });
      return NextResponse.json({ success: true, affected: leadIds.length });
    }

    return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  } catch (error: any) {
    console.error("[CRM_BULK_LEAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Bulk action failed" }, { status: 500 });
  }
}
