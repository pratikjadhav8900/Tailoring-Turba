export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCataloguePageUrl } from "@/lib/cloudinary";

import { CATALOGUE_CATEGORIES } from "@/lib/catalogue-data";

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

    // Fallback to static data for prices if database is missing them
    const staticCategory = CATALOGUE_CATEGORIES.find(c => c.slug === params.slug);
    
    const productsWithPrices = category.products.map(dbProd => {
      const staticProd = staticCategory?.products?.find(p => p.code === dbProd.code);
      return {
        ...dbProd,
        price: (dbProd as any).price || staticProd?.price || null
      };
    });

    const categoryWithImages = {
      ...category,
      products: productsWithPrices,
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
