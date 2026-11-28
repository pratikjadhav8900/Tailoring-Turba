import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { notifyCrmTaskAssigned } from "@/lib/crm/tasks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const tasks = await prisma.leadTask.findMany({
      where: { leadId: params.id },
      orderBy: { dueAt: "asc" },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("[CRM_GET_LEAD_TASKS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { type = "CUSTOM", title, description, dueAt, priority = "NORMAL", assignedToId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    if (!dueAt) {
      return NextResponse.json({ error: "Due date is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.leadTask.create({
        data: {
          leadId: params.id,
          type,
          title: title.trim(),
          description: description?.trim() || null,
          dueAt: new Date(dueAt),
          priority,
          assignedToId: assignedToId || auth.context.employee.id,
          createdById: auth.context.employee.id,
        },
        include: { assignedTo: { select: { id: true, name: true } } },
      });

      await tx.leadActivity.create({
        data: {
          leadId: params.id,
          type: "FOLLOW_UP",
          note: `Task created: ${created.title}`,
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
          metadata: { taskId: created.id },
        },
      });

      if (created.assignedToId) {
        await notifyCrmTaskAssigned(tx, {
          targetEmployeeId: created.assignedToId,
          actorEmployeeId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          leadId: params.id,
          leadName: lead.name,
          leadTaskId: created.id,
          taskTitle: created.title,
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("[CRM_CREATE_LEAD_TASK_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
