import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/account
 * Returns full profile, assigned active tasks, completed count, and recent activity for the authenticated employee.
 */
export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const currentEmployee = auth.context.employee;

  try {
    // 1. Fetch fresh employee record with relations
    const employee = await prisma.employee.findUnique({
      where: { id: currentEmployee.id },
      include: {
        user: {
          select: {
            role: true,
            createdAt: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    // 2. Fetch assigned active tasks
    const activeTasks = await prisma.productionStageExecution.findMany({
      where: {
        employeeId: employee.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            priority: true,
            dueDate: true,
            opsStage: true,
            user: {
              select: {
                name: true,
                companyName: true,
              },
            },
            items: {
              select: {
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    // 3. Count completed tasks & stats
    const completedTasksCount = await prisma.productionStageExecution.count({
      where: {
        employeeId: employee.id,
        status: "COMPLETED",
      },
    });

    const activeTasksCount = await prisma.productionStageExecution.count({
      where: {
        employeeId: employee.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    const notesCount = await prisma.internalOrderNote.count({
      where: { employeeId: employee.id },
    });

    // 4. Fetch recent stage executions history (activity log)
    const recentActivity = await prisma.productionStageExecution.findMany({
      where: { employeeId: employee.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            user: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        phone: employee.phone || "",
        roleTitle: employee.roleTitle,
        systemRole: employee.user?.role || auth.context.userRole,
        isActive: employee.isActive,
        createdAt: employee.createdAt,
      },
      stats: {
        activeTasksCount,
        completedTasksCount,
        notesCount,
        totalActionsCount: activeTasksCount + completedTasksCount + notesCount,
      },
      activeTasks: activeTasks.map((t) => ({
        id: t.id,
        stage: t.stage,
        status: t.status,
        iteration: t.iteration,
        orderId: t.orderId,
        orderNumber: t.order?.orderNumber || 0,
        companyName: t.order?.user?.companyName || null,
        customerName: t.order?.user?.name || null,
        priority: t.order?.priority || "NORMAL",
        dueDate: t.order?.dueDate ? t.order.dueDate.toISOString() : null,
        totalQuantity: t.order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        startedAt: t.startedAt ? t.startedAt.toISOString() : null,
        notes: t.notes,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        stage: a.stage,
        status: a.status,
        orderId: a.orderId,
        orderNumber: a.order?.orderNumber || 0,
        companyName: a.order?.user?.companyName || null,
        createdAt: a.createdAt.toISOString(),
        completedAt: a.completedAt ? a.completedAt.toISOString() : null,
      })),
    });
  } catch (error: any) {
    console.error("[OPS_ACCOUNT_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch employee account details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ops/account
 * Update contact information (phone, display name)
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const currentEmployee = auth.context.employee;

  try {
    const body = await req.json();
    const { phone, name } = body;

    const updatedData: { phone?: string; name?: string } = {};
    if (typeof phone === "string") updatedData.phone = phone.trim();
    if (typeof name === "string" && name.trim()) updatedData.name = name.trim();

    const updatedEmployee = await prisma.employee.update({
      where: { id: currentEmployee.id },
      data: updatedData,
    });

    // Also sync user name if provided and user relation exists
    if (updatedData.name && currentEmployee.userId) {
      await prisma.user.update({
        where: { id: currentEmployee.userId },
        data: { name: updatedData.name },
      });
    }

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
    });
  } catch (error: any) {
    console.error("[OPS_ACCOUNT_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update employee profile" },
      { status: 500 }
    );
  }
}
