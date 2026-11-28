import type { Prisma, LeadTaskType } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

/**
 * Notification `type` values for cross-department LeadTask events, stored in
 * OpsNotification.type. Unlike Ops's broadcast notifications, these always
 * carry a `targetEmployeeId` in `metadata` and are only ever visible to that
 * one employee — see isCrmTaskNotificationRelevant below.
 */
export const CRM_TASK_NOTIFICATION_TYPES = ["CRM_TASK_ASSIGNED", "CRM_TASK_COMPLETED"] as const;

export function isCrmTaskNotificationType(type: string): boolean {
  return (CRM_TASK_NOTIFICATION_TYPES as readonly string[]).includes(type);
}

/**
 * A CRM task notification is targeted at exactly one employee (the assignee
 * on ASSIGNED, the creator on COMPLETED), regardless of the viewer's
 * worker/management classification used for Ops's broadcast notifications.
 */
export function isCrmTaskNotificationRelevant(
  notification: { type: string; metadata?: unknown },
  employeeId: string
): boolean {
  const meta = (notification.metadata || {}) as Record<string, unknown>;
  return meta.targetEmployeeId === employeeId;
}

/** Task types where completion requires at least one uploaded attachment. */
export function taskRequiresAttachmentOnCompletion(type: LeadTaskType): boolean {
  return type === "SEND_QUOTATION";
}

export async function notifyCrmTaskAssigned(
  db: PrismaTx,
  params: {
    targetEmployeeId: string;
    actorEmployeeId: string;
    actorName: string;
    leadId: string;
    leadName: string;
    leadTaskId: string;
    taskTitle: string;
  }
) {
  if (!params.targetEmployeeId || params.targetEmployeeId === params.actorEmployeeId) return;

  await db.opsNotification.create({
    data: {
      type: "CRM_TASK_ASSIGNED",
      title: `New Task: ${params.taskTitle}`,
      message: `${params.actorName} assigned you "${params.taskTitle}" for lead ${params.leadName}.`,
      actorName: params.actorName,
      readBy: [],
      metadata: {
        targetEmployeeId: params.targetEmployeeId,
        leadId: params.leadId,
        leadTaskId: params.leadTaskId,
        taskTitle: params.taskTitle,
        leadName: params.leadName,
      },
    },
  });
}

export async function notifyCrmTaskCompleted(
  db: PrismaTx,
  params: {
    targetEmployeeId: string;
    actorEmployeeId: string;
    actorName: string;
    leadId: string;
    leadName: string;
    leadTaskId: string;
    taskTitle: string;
    hasAttachment: boolean;
  }
) {
  if (!params.targetEmployeeId || params.targetEmployeeId === params.actorEmployeeId) return;

  await db.opsNotification.create({
    data: {
      type: "CRM_TASK_COMPLETED",
      title: `Task Completed: ${params.taskTitle}`,
      message: `${params.actorName} marked "${params.taskTitle}" done for lead ${params.leadName}.${
        params.hasAttachment ? " A file is attached — open the task to grab it." : ""
      }`,
      actorName: params.actorName,
      readBy: [],
      metadata: {
        targetEmployeeId: params.targetEmployeeId,
        leadId: params.leadId,
        leadTaskId: params.leadTaskId,
        taskTitle: params.taskTitle,
        leadName: params.leadName,
      },
    },
  });
}

export class TaskActionError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Shared completion path for LeadTask, used by both the CRM-side route
 * (/api/crm/leads/[id]/tasks/[taskId]) and the Ops-side route
 * (/api/ops/sales-tasks/[taskId]) so a non-Sales employee (e.g. Accounts)
 * can complete a task assigned to them without full /crm access, while the
 * business rules (attachment requirement, notifying the requester) stay in
 * one place.
 */
export async function completeLeadTask(
  db: PrismaTx,
  taskId: string,
  params: {
    actorEmployeeId: string;
    actorEmployeeName: string;
    isAdmin: boolean;
    completionNotes?: string | null;
    newAttachments?: string[];
  }
) {
  const task = await db.leadTask.findUnique({
    where: { id: taskId },
    include: { lead: { select: { id: true, name: true } } },
  });

  if (!task) {
    throw new TaskActionError(404, "Task not found.");
  }

  const isOwner = task.assignedToId === params.actorEmployeeId;
  if (!isOwner && !params.isAdmin) {
    throw new TaskActionError(403, "Only the assignee (or an admin) can complete this task.");
  }

  const newAttachments = (params.newAttachments || []).filter(Boolean);
  const totalAttachmentCount = task.attachments.length + newAttachments.length;

  if (taskRequiresAttachmentOnCompletion(task.type) && totalAttachmentCount === 0) {
    throw new TaskActionError(
      400,
      "Please upload the quotation file before marking this task complete."
    );
  }

  const updated = await db.leadTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completionNotes: params.completionNotes?.trim() || task.completionNotes,
      attachments: newAttachments.length > 0 ? { push: newAttachments } : undefined,
    },
    include: { assignedTo: { select: { id: true, name: true } }, lead: { select: { id: true, name: true } } },
  });

  await db.leadActivity.create({
    data: {
      leadId: task.leadId,
      type: "FOLLOW_UP",
      note: `Task completed: ${updated.title}${params.completionNotes ? ` — ${params.completionNotes}` : ""}`,
      employeeId: params.actorEmployeeId,
      employeeName: params.actorEmployeeName,
      metadata: { taskId: updated.id },
    },
  });

  await db.lead.update({ where: { id: task.leadId }, data: { lastContactedAt: new Date() } });

  if (task.createdById) {
    await notifyCrmTaskCompleted(db, {
      targetEmployeeId: task.createdById,
      actorEmployeeId: params.actorEmployeeId,
      actorName: params.actorEmployeeName,
      leadId: task.leadId,
      leadName: task.lead.name,
      leadTaskId: task.id,
      taskTitle: updated.title,
      hasAttachment: updated.attachments.length > 0,
    });
  }

  return updated;
}
