import { Metadata } from "next";
import { prisma, withRetry } from "@/lib/prisma";
import { allProducts } from "@/lib/products-data";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Premium Corporate Apparel Catalog | Bulk Manufacturing India",
  description: "Browse our catalog of high-quality corporate apparel, including polo shirts, t-shirts, and custom uniforms. B2B bulk manufacturing with global export from India.",
  keywords: ["corporate apparel catalog", "bulk t-shirts manufacturer", "wholesale polo shirts India", "custom uniforms catalog"],
};

export const revalidate = 60;

export default async function ProductsPage() {
  let formattedProducts;

  try {
    const dbProducts = await withRetry(() => prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }));

    formattedProducts = dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || "Uncategorized",
      type: p.type || "",
      image: p.images && p.images.length > 0 ? p.images[0] : "",
      gallery: p.images || [],
      price: `₹${p.basePrice}`,
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
      gallery: p.gallery || [p.image],
    }));
  }

  return <ProductsClient products={formattedProducts} />;
}
