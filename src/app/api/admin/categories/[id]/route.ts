export const dynamic = "force-dynamic";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Explicitly trigger dynamic behavior for build stability
  cookies();
  headers();
  
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: params.id }
    });

    if (productCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete category with ${productCount} products. Move or delete them first.` 
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category delete error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
