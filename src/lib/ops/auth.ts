import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OpsEmployee } from "@/types/ops";
import { NextResponse } from "next/server";

export interface AuthenticatedOpsContext {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  employee: OpsEmployee;
}

/**
 * Resolves the authenticated employee from the current NextAuth session.
 * Never trusts browser-supplied employee identifiers.
 *
 * For ADMIN / SUPER_ADMIN users without an explicit Employee row,
 * transparently provisions or links an Employee profile so management
 * has immediate Ops access without manual DB seeding.
 */
export async function getAuthenticatedEmployee(): Promise<AuthenticatedOpsContext | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";
  const userName = session.user.name || "Employee";
  const userRole = (session.user as { role?: string })?.role || "USER";

  // Check if role is authorized for Ops (EMPLOYEE, ADMIN, SUPER_ADMIN)
  const isAuthorizedRole =
    userRole === "EMPLOYEE" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  let employeeRecord = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!employeeRecord && userEmail) {
    // Check if employee exists by email and link to user
    employeeRecord = await prisma.employee.findUnique({
      where: { email: userEmail },
    });

    if (employeeRecord && !employeeRecord.userId) {
      employeeRecord = await prisma.employee.update({
        where: { id: employeeRecord.id },
        data: { userId },
      });
    }
  }

  // Auto-provision for ADMIN / SUPER_ADMIN if they don't have an Employee profile yet
  if (!employeeRecord && (userRole === "ADMIN" || userRole === "SUPER_ADMIN")) {
    const adminCount = await prisma.employee.count();
    const employeeCode = `EMP-${String(adminCount + 1).padStart(3, "0")}`;

    employeeRecord = await prisma.employee.create({
      data: {
        employeeCode,
        name: userName,
        email: userEmail,
        roleTitle: userRole === "SUPER_ADMIN" ? "Operations Lead / Founder" : "Operations Manager",
        isActive: true,
        userId,
      },
    });
  }

  // If user is not authorized or no active employee record found
  if (!employeeRecord || !employeeRecord.isActive || (!isAuthorizedRole && !employeeRecord.userId)) {
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
      isActive: employeeRecord.isActive,
      userId: employeeRecord.userId,
      createdAt: employeeRecord.createdAt,
      updatedAt: employeeRecord.updatedAt,
    },
  };
}

/**
 * Higher-order utility for Ops API route handlers.
 * Enforces employee authentication and provides the context.
 */
export async function requireOpsAuth(): Promise<
  { context: AuthenticatedOpsContext; errorResponse?: never } | { context?: never; errorResponse: NextResponse }
> {
  const authContext = await getAuthenticatedEmployee();

  if (!authContext) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Active employee authentication required" },
        { status: 401 }
      ),
    };
  }

  return { context: authContext };
}
