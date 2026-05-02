export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCataloguePageUrl } from "@/lib/cloudinary";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const category = await prisma.catalogueCategory.findUnique({
      where: { slug: params.slug },
      include: {
        products: true
      }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const categoryWithImages = {
      ...category,
      pageImages: category.pages.map(page => ({
        pageNumber: page,
        url: getCataloguePageUrl(page)
      }))
    };

    return NextResponse.json(categoryWithImages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}
