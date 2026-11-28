import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Default: Sales reps only — used for the Lead "owner" picker, which should
 * stay Sales-only. `?scope=all` returns every active employee, for pickers
 * that hand work to other departments (e.g. assigning a "Send Quotation"
 * task to Accounts).
 */
export async function GET(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  const scope = new URL(req.url).searchParams.get("scope");

  try {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(scope === "all"
          ? {}
          : {
              OR: [
                { department: { equals: "SALES", mode: "insensitive" } },
                { roleTitle: { contains: "sales", mode: "insensitive" } },
              ],
            }),
      },
      select: { id: true, name: true, employeeCode: true, roleTitle: true, department: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("[CRM_GET_EMPLOYEES_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
