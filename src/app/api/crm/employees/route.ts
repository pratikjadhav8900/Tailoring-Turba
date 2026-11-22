import { NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        OR: [
          { department: { equals: "SALES", mode: "insensitive" } },
          { roleTitle: { contains: "sales", mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, employeeCode: true, roleTitle: true, department: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("[CRM_GET_EMPLOYEES_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch sales reps" }, { status: 500 });
  }
}
