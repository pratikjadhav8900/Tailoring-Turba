export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Design IDOR Remediation (CRITICAL C-3)
 * Enforces authenticated identity and strict design ownership checks for GET and DELETE.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const design = await prisma.design.findUnique({
      where: { id: params.id },
      include: { product: true }
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const userRole = (session.user as any)?.role;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    if (design.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to access this design." }, { status: 403 });
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error("[DESIGN_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch design" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const design = await prisma.design.findUnique({
      where: { id: params.id }
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const userRole = (session.user as any)?.role;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    if (design.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete this design." }, { status: 403 });
    }

    await prisma.design.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DESIGN_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete design" }, { status: 500 });
  }
}
