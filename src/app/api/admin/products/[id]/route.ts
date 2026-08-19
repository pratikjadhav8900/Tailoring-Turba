export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

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
    const { 
      name, 
      category, 
      type, 
      price, 
      description, 
      features, 
      colors, 
      badge, 
      imageUrl, 
      imageUrls, 
      isActive,
      seoTitle,
      seoDescription,
      seoKeywords,
      slug
    } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate SEO fields
    const trimmedSeoTitle = seoTitle?.trim() || null;
    const trimmedSeoDescription = seoDescription?.trim() || null;
    let trimmedSeoKeywords = seoKeywords?.trim() || null;
    if (trimmedSeoKeywords) {
      trimmedSeoKeywords = trimmedSeoKeywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean)
        .join(", ");
    }

    if (trimmedSeoTitle && trimmedSeoTitle.length > 1000) {
      return NextResponse.json({ error: "SEO Title cannot exceed 1000 characters." }, { status: 400 });
    }
    if (trimmedSeoDescription && trimmedSeoDescription.length > 2000) {
      return NextResponse.json({ error: "SEO Description cannot exceed 2000 characters." }, { status: 400 });
    }

    let finalSlug = slug?.trim() || null;
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(name.trim(), id);
    } else {
      finalSlug = generateSlug(finalSlug);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
        return NextResponse.json({ error: "Invalid URL handle format." }, { status: 400 });
      }
      const existingSlug = await prisma.product.findFirst({
        where: {
          slug: finalSlug,
          id: { not: id }
        }
      });
      if (existingSlug) {
        return NextResponse.json({ error: "URL handle is already in use." }, { status: 400 });
      }
    }

    // Ensure category exists
    let categoryRecord = await prisma.category.findUnique({
      where: { name: category }
    });

    if (!categoryRecord) {
      const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      categoryRecord = await prisma.category.create({
        data: { name: category, slug: catSlug }
      });
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        categoryId: categoryRecord.id,
        type: type || null,
        basePrice: typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '') || "0"),
        description: description || "",
        features: features ? features.split('\n').filter((f: string) => f.trim()) : [],
        colors: colors ? parseInt(String(colors)) : null,
        badge: badge || null,
        images: imageUrls || (imageUrl ? [imageUrl] : []),
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        seoTitle: trimmedSeoTitle,
        seoDescription: trimmedSeoDescription,
        seoKeywords: trimmedSeoKeywords,
        slug: finalSlug,
      }
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
