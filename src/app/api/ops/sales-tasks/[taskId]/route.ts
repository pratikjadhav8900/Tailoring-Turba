import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import { completeLeadTask, TaskActionError } from "@/lib/crm/tasks";

export const dynamic = "force-dynamic";

const isAdminRole = (role: string) => role === "ADMIN" || role === "SUPER_ADMIN";

/**
 * Lets the assignee of a cross-department LeadTask (see /api/ops/sales-tasks)
 * acknowledge or complete it without needing /crm access. Only supports the
 * two actions that surface on that page — full editing stays a CRM-only
 * capability (/api/crm/leads/[id]/tasks/[taskId]).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();

    if (body.status === "COMPLETED") {
      const task = await prisma.$transaction((tx) =>
        completeLeadTask(tx, params.taskId, {
          actorEmployeeId: auth.context.employee.id,
          actorEmployeeName: auth.context.employee.name,
          isAdmin: isAdminRole(auth.context.userRole),
          completionNotes: body.completionNotes,
          newAttachments: body.attachments,
        })
      );
      return NextResponse.json({ success: true, task });
    }

    if (body.status === "IN_PROGRESS") {
      const existing = await prisma.leadTask.findUnique({ where: { id: params.taskId } });
      if (!existing) {
        return NextResponse.json({ error: "Task not found." }, { status: 404 });
      }
      const isOwner = existing.assignedToId === auth.context.employee.id;
      if (!isOwner && !isAdminRole(auth.context.userRole)) {
        return NextResponse.json({ error: "Only the assignee can update this task." }, { status: 403 });
      }
      const task = await prisma.leadTask.update({
        where: { id: params.taskId },
        data: { status: "IN_PROGRESS" },
      });
      return NextResponse.json({ success: true, task });
    }

    return NextResponse.json({ error: "Unsupported status update." }, { status: 400 });
  } catch (error: any) {
    if (error instanceof TaskActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[OPS_UPDATE_SALES_TASK_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}
