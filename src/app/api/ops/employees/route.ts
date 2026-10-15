import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { employeeCode: "asc" },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        phone: true,
        roleTitle: true,
      },
    });

    const workers = employees.filter(
      (e) =>
        e.employeeCode === "TT004" ||
        e.employeeCode === "TT005" ||
        e.roleTitle.toLowerCase().includes("worker") ||
        e.roleTitle.toLowerCase().includes("craftsman")
    );

    const managers = employees.filter(
      (e) => !workers.some((w) => w.id === e.id)
    );

    return NextResponse.json({
      success: true,
      employees,
      workers,
      managers,
    });
  } catch (error: any) {
    console.error("[OPS_GET_EMPLOYEES_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch employees." },
      { status: 500 }
    );
  }
}
