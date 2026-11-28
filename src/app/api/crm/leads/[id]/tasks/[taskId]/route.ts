import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth, isCrmAdmin } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { completeLeadTask, TaskActionError } from "@/lib/crm/tasks";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();

    if (body.status === "COMPLETED") {
      const task = await prisma.$transaction((tx) =>
        completeLeadTask(tx, params.taskId, {
          actorEmployeeId: auth.context.employee.id,
          actorEmployeeName: auth.context.employee.name,
          isAdmin: isCrmAdmin(auth.context),
          completionNotes: body.completionNotes,
          newAttachments: body.attachments,
        })
      );
      return NextResponse.json({ success: true, task });
    }

    const data: any = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.dueAt !== undefined) data.dueAt = new Date(body.dueAt);
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null;
    if (body.completionNotes !== undefined) data.completionNotes = body.completionNotes?.trim() || null;
    if (body.status !== undefined) data.status = body.status;

    const task = await prisma.leadTask.update({
      where: { id: params.taskId },
      data,
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    if (error instanceof TaskActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
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
