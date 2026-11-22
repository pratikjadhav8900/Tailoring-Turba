import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { WON_STAGES } from "@/types/crm";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const current = auth.context.employee;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: current.id },
      include: { user: { select: { image: true, role: true, createdAt: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    const [assignedCount, wonCount, lostCount, openTaskCount, activityCount] = await Promise.all([
      prisma.lead.count({ where: { assignedToId: employee.id } }),
      prisma.lead.count({ where: { assignedToId: employee.id, status: { in: WON_STAGES as any } } }),
      prisma.lead.count({ where: { assignedToId: employee.id, status: "NOT_INTERESTED" } }),
      prisma.leadTask.count({ where: { assignedToId: employee.id, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      prisma.leadActivity.count({ where: { employeeId: employee.id } }),
    ]);

    return NextResponse.json({
      success: true,
      profile: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        phone: employee.phone || "",
        roleTitle: employee.roleTitle,
        department: employee.department || "",
        systemRole: employee.user?.role || auth.context.userRole,
        isActive: employee.isActive,
        image: employee.user?.image || null,
        createdAt: employee.createdAt,
      },
      stats: {
        assignedCount,
        wonCount,
        lostCount,
        openTaskCount,
        activityCount,
        conversionRate: assignedCount > 0 ? Math.round((wonCount / assignedCount) * 1000) / 10 : null,
      },
    });
  } catch (error: any) {
    console.error("[CRM_ACCOUNT_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch account details" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const current = auth.context.employee;

  try {
    const body = await req.json();
    const { phone, name, image } = body;

    const employeeData: { phone?: string; name?: string } = {};
    if (typeof phone === "string") employeeData.phone = phone.trim();
    if (typeof name === "string" && name.trim()) employeeData.name = name.trim();

    const updatedEmployee = await prisma.employee.update({
      where: { id: current.id },
      data: employeeData,
    });

    if (current.userId && (employeeData.name || typeof image === "string")) {
      await prisma.user.update({
        where: { id: current.userId },
        data: {
          ...(employeeData.name ? { name: employeeData.name } : {}),
          ...(typeof image === "string" ? { image: image.trim() || null } : {}),
        },
      });
    }

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error: any) {
    console.error("[CRM_ACCOUNT_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
