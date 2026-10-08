import { NextResponse } from "next/server";
import { getAuthenticatedEmployee } from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authContext = await getAuthenticatedEmployee();

    if (!authContext) {
      return NextResponse.json({ authenticated: false, employee: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authContext.userId,
        email: authContext.userEmail,
        name: authContext.userName,
        role: authContext.userRole,
      },
      employee: authContext.employee,
    });
  } catch (error: any) {
    console.error("[OPS_AUTH_SESSION_ERROR]", error);
    return NextResponse.json({ error: "Failed to resolve employee session" }, { status: 500 });
  }
}
