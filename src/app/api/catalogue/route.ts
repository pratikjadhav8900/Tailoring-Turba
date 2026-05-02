export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCataloguePageUrl } from "@/lib/cloudinary";

export async function GET() {
  try {
    const categories = await prisma.catalogueCategory.findMany({
      orderBy: { createdAt: "asc" },
    });

    const categoriesWithImages = categories.map(cat => ({
      ...cat,
      // Pick the first page as the thumbnail/cover
      coverImage: cat.pages.length > 0 ? getCataloguePageUrl(cat.pages[0]) : null,
      pageImages: cat.pages.map(page => getCataloguePageUrl(page))
    }));

    return NextResponse.json(categoriesWithImages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch catalogue." }, { status: 500 });
  }
}

