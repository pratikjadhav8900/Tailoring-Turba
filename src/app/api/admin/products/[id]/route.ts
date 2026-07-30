export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // Assuming only SUPER_ADMIN or ADMIN can delete products
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // Assuming only SUPER_ADMIN or ADMIN can update products
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { name, category, type, price, description, features, colors, badge, imageUrl, imageUrls } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure category exists
    let categoryRecord = await prisma.category.findUnique({
      where: { name: category }
    });

    if (!categoryRecord) {
      const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      categoryRecord = await prisma.category.create({
        data: { name: category, slug }
      });
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        categoryId: categoryRecord.id,
        type: type || null,
        basePrice: typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '') || "0"),
        description: description || "",
        features: features ? features.split('\n').filter((f: string) => f.trim()) : [],
        colors: colors ? parseInt(String(colors)) : null,
        badge: badge || null,
        images: imageUrls || (imageUrl ? [imageUrl] : []),
      }
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
