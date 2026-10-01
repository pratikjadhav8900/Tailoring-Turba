import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Active session required." }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const data = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        ...(typeof data.name === "string" ? { name: data.name.trim() } : {}),
        ...(typeof data.phone === "string" ? { phone: data.phone.trim() } : {}),
        ...(typeof data.companyName === "string" ? { companyName: data.companyName.trim() || null } : {}),
        ...(typeof data.gstNumber === "string" ? { gstNumber: data.gstNumber.trim().toUpperCase() || null } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        gstNumber: true,
        image: true,
        isB2BApproved: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[PROFILE] Update failed:", error);
    return NextResponse.json({ error: "Failed to update profile. Please try again." }, { status: 500 });
  }
}
