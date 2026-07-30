export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Assuming only SUPER_ADMIN or ADMIN can add products
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const product = await prisma.product.create({
      data: {
        name,
        categoryId: categoryRecord.id,
        type: type || null,
        basePrice: parseFloat(price.replace(/[^0-9.]/g, '') || "0"),
        description: description || "",
        features: features ? features.split('\n').filter((f: string) => f.trim()) : [],
        colors: colors ? parseInt(colors) : null,
        badge: badge || null,
        images: imageUrls || (imageUrl ? [imageUrl] : []),
        minOrderQuantity: 1,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

