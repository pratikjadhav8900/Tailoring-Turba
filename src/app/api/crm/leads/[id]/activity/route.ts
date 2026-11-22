import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { type = "NOTE", note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: "Note text is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.leadActivity.create({
        data: {
          leadId: params.id,
          type,
          note: note.trim(),
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
        },
      });

      const touchData: any = { updatedAt: new Date() };
      if (["CALL", "EMAIL", "WHATSAPP", "MEETING"].includes(type)) {
        touchData.lastContactedAt = new Date();
      }
      await tx.lead.update({ where: { id: params.id }, data: touchData });

      return created;
    });

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error("[CRM_CREATE_ACTIVITY_ERROR]", error);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
