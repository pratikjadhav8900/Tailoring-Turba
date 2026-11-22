import { NextResponse } from "next/server";
import { getAuthenticatedCrmUser } from "@/lib/crm/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authContext = await getAuthenticatedCrmUser();

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
    console.error("[CRM_AUTH_SESSION_ERROR]", error);
    return NextResponse.json({ error: "Failed to resolve sales session" }, { status: 500 });
  }
}
