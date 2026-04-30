import { prisma, withRetry } from "@/lib/prisma";
import { allProducts } from "@/lib/products-data";
import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";

export const revalidate = 60;

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  let formattedProduct;
  let formattedRelated: any[] = [];

  try {
    const dbProduct = await withRetry(() => prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true }
    }));

    if (!dbProduct) return notFound();

    const relatedDbProducts = await withRetry(() => prisma.product.findMany({
      where: { categoryId: dbProduct.categoryId, id: { not: dbProduct.id } },
      include: { category: true },
      take: 4
    }));

    formattedProduct = {
      id: dbProduct.id,
      name: dbProduct.name,
      category: dbProduct.category?.name || "Uncategorized",
      type: dbProduct.type || "",
      image: dbProduct.images && dbProduct.images.length > 0 ? dbProduct.images[0] : "",
      gallery: dbProduct.images || [],
      price: `₹${dbProduct.basePrice}`,
      badge: dbProduct.badge || "",
      description: dbProduct.description,
      features: dbProduct.features,
    };

    formattedRelated = relatedDbProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || "Uncategorized",
      type: p.type || "",
      image: p.images && p.images.length > 0 ? p.images[0] : "",
      price: `₹${p.basePrice}`,
      badge: p.badge || "",
    }));

  } catch (err) {
    console.error("[ProductDetailsPage] DB unreachable, falling back to static data:", err);

    // Try to match by numeric id from static data
    const staticProduct = allProducts.find(p => String(p.id) === params.id);
    if (!staticProduct) return notFound();

    formattedProduct = {
      ...staticProduct,
      id: String(staticProduct.id),
      gallery: staticProduct.gallery || [staticProduct.image],
    };

    formattedRelated = allProducts
      .filter(p => p.category === staticProduct.category && p.id !== staticProduct.id)
      .slice(0, 4)
      .map(p => ({ ...p, id: String(p.id) }));
  }

  return <ProductDetailsClient product={formattedProduct} relatedProducts={formattedRelated} />;
}
