import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const data: any = {};

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.dueAt !== undefined) data.dueAt = new Date(body.dueAt);
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null;
    if (body.completionNotes !== undefined) data.completionNotes = body.completionNotes?.trim() || null;

    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "COMPLETED") {
        data.completedAt = new Date();
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.leadTask.update({
        where: { id: params.taskId },
        data,
        include: { assignedTo: { select: { id: true, name: true } } },
      });

      if (body.status === "COMPLETED") {
        await tx.leadActivity.create({
          data: {
            leadId: params.id,
            type: "FOLLOW_UP",
            note: `Task completed: ${updated.title}${body.completionNotes ? ` — ${body.completionNotes}` : ""}`,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
            metadata: { taskId: updated.id },
          },
        });
        await tx.lead.update({ where: { id: params.id }, data: { lastContactedAt: new Date() } });
      }

      return updated;
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("[CRM_UPDATE_LEAD_TASK_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await prisma.leadTask.delete({ where: { id: params.taskId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    console.error("[CRM_DELETE_LEAD_TASK_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
