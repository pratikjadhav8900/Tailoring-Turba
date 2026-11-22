import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, name: true, employeeCode: true } },
        createdBy: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { dueAt: "asc" }, include: { assignedTo: { select: { id: true, name: true } } } },
        tags: { include: { tag: true } },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error("[CRM_GET_LEAD_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const data: any = {};
    const activityLogs: { type: any; note: string; metadata?: any }[] = [];

    if (body.name !== undefined) data.name = body.name?.trim();
    if (body.email !== undefined) data.email = body.email?.trim() || null;
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
    if (body.companyName !== undefined) data.companyName = body.companyName?.trim() || null;
    if (body.sourceDetail !== undefined) data.sourceDetail = body.sourceDetail?.trim() || null;
    if (body.requirements !== undefined) data.requirements = body.requirements?.trim() || null;
    if (body.quantity !== undefined) data.quantity = body.quantity ? Number(body.quantity) : null;
    if (body.productCategory !== undefined) data.productCategory = body.productCategory?.trim() || null;
    if (body.expectedValue !== undefined) data.expectedValue = body.expectedValue ? Number(body.expectedValue) : null;
    if (body.city !== undefined) data.city = body.city?.trim() || null;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    if (body.score !== undefined) data.score = Math.max(0, Math.min(10, Number(body.score) || 0));
    if (body.isFavourite !== undefined) data.isFavourite = !!body.isFavourite;
    if (body.nextFollowUpAt !== undefined) {
      data.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null;
    }

    if (body.source !== undefined && body.source !== existing.source) {
      data.source = body.source;
    }

    if (body.status !== undefined && body.status !== existing.status) {
      data.status = body.status;
      if (["INTERESTED", "NOT_INTERESTED"].includes(body.status)) {
        data.lastContactedAt = new Date();
      }
      activityLogs.push({
        type: "STATUS_CHANGE",
        note: `Status changed from ${existing.status} to ${body.status}`,
        metadata: { from: existing.status, to: body.status },
      });
      if (body.status === "CONVERTED") {
        data.convertedAt = new Date();
      }
    }

    if (body.lostReason !== undefined) {
      data.lostReason = body.lostReason?.trim() || null;
    }

    if (body.assignedToId !== undefined && body.assignedToId !== existing.assignedToId) {
      data.assignedToId = body.assignedToId || null;
      activityLogs.push({
        type: "ASSIGNED",
        note: body.assignedToId
          ? `Reassigned by ${auth.context.employee.name}`
          : `Unassigned by ${auth.context.employee.name}`,
        metadata: { from: existing.assignedToId, to: body.assignedToId || null },
      });
    }

    const lead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id: params.id },
        data,
        include: {
          assignedTo: { select: { id: true, name: true, employeeCode: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      for (const log of activityLogs) {
        await tx.leadActivity.create({
          data: {
            leadId: params.id,
            type: log.type,
            note: log.note,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
            metadata: log.metadata,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("[CRM_UPDATE_LEAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await prisma.lead.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CRM_DELETE_LEAD_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
