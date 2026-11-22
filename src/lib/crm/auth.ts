import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CrmEmployee } from "@/types/crm";
import { NextResponse } from "next/server";

export interface AuthenticatedCrmContext {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  employee: CrmEmployee;
}

/**
 * Resolves the authenticated sales rep from the current NextAuth session.
 * Reuses the same Employee record as Turba Ops; access to /crm additionally
 * requires `department === "SALES"` unless the account is ADMIN/SUPER_ADMIN,
 * who can see the whole pipeline.
 */
export async function getAuthenticatedCrmUser(): Promise<AuthenticatedCrmContext | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";
  const userRole = (session.user as { role?: string })?.role || "USER";

  const isStaffRole = userRole === "EMPLOYEE" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  if (!isStaffRole) return null;

  let employeeRecord = await prisma.employee.findUnique({ where: { userId } });

  if (!employeeRecord && userEmail) {
    employeeRecord = await prisma.employee.findUnique({ where: { email: userEmail } });
    if (employeeRecord && !employeeRecord.userId) {
      employeeRecord = await prisma.employee.update({
        where: { id: employeeRecord.id },
        data: { userId },
      });
    }
  }

  if (!employeeRecord || !employeeRecord.isActive) {
    return null;
  }

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isSales = (employeeRecord.department || "").toUpperCase() === "SALES";

  if (!isAdmin && !isSales) {
    return null;
  }

  return {
    userId,
    userEmail,
    userName: employeeRecord.name,
    userRole,
    employee: {
      id: employeeRecord.id,
      employeeCode: employeeRecord.employeeCode,
      name: employeeRecord.name,
      email: employeeRecord.email,
      phone: employeeRecord.phone,
      roleTitle: employeeRecord.roleTitle,
      department: employeeRecord.department,
      isActive: employeeRecord.isActive,
      userId: employeeRecord.userId,
      createdAt: employeeRecord.createdAt,
      updatedAt: employeeRecord.updatedAt,
    },
  };
}

export async function requireCrmAuth(): Promise<
  { context: AuthenticatedCrmContext; errorResponse?: never } | { context?: never; errorResponse: NextResponse }
> {
  const authContext = await getAuthenticatedCrmUser();

  if (!authContext) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Active sales account required" },
        { status: 401 }
      ),
    };
  }

  return { context: authContext };
}

export function isCrmAdmin(ctx: AuthenticatedCrmContext): boolean {
  return ctx.userRole === "ADMIN" || ctx.userRole === "SUPER_ADMIN";
}
