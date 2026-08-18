export const dynamic = 'force-dynamic';
import { Metadata } from "next";
import { prisma, withRetry } from "@/lib/prisma";
import { allProducts } from "@/lib/products-data";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Premium Corporate Apparel Catalogue | Bulk Manufacturing India",
  description: "Browse our catalogue of high-quality corporate apparel, including polo shirts, t-shirts, and custom uniforms. B2B bulk manufacturing with global export from India.",
  keywords: ["corporate apparel catalogue", "bulk t-shirts manufacturer", "wholesale polo shirts India", "custom uniforms catalogue"],
};

import { cleanCategoryName, cleanProductName } from "@/lib/cleaner";

export const revalidate = 60;

export default async function ProductsPage() {
  let formattedProducts;

  try {
    const dbProducts = await withRetry(() => prisma.product.findMany({
      where: {
        isActive: true,
        name: { not: "Custom Design" },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }));

    formattedProducts = dbProducts.map(p => ({
      id: p.id,
      name: cleanProductName(p.name),
      category: cleanCategoryName(p.category?.name || "Uncategorized"),
      type: p.type || "",
      brand: p.brand || "",
      image: p.images && p.images.length > 0 ? p.images[0] : "",
      gallery: p.images || [],
      price: p.basePrice,
      colors: p.colors || 0,
      badge: p.badge || "",
      description: p.description,
      features: p.features,
    }));
  } catch (err) {
    console.error("[ProductsPage] DB unreachable, falling back to static data:", err);
    // Fallback to hardcoded products so the page never crashes
    formattedProducts = allProducts.map(p => ({
      ...p,
      id: String(p.id),
      name: cleanProductName(p.name),
      category: cleanCategoryName(p.category || "Uncategorized"),
      gallery: p.gallery || [p.image],
    }));
  }

  return <ProductsClient products={formattedProducts} />;
}

