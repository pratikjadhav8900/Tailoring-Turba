export const dynamic = "force-dynamic";
import { Metadata } from "next";
import { prisma, withRetry } from "@/lib/prisma";
import { allProducts } from "@/lib/products-data";
import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const product = await withRetry(() => prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true }
    }));

    if (!product || !product.isActive) {
      const staticProduct = allProducts.find(p => String(p.id) === params.id);
      if (staticProduct) {
        const title = `${staticProduct.name} | Bulk ${staticProduct.category} Manufacturer India | Tailoring Turba`;
        return {
          title,
          description: staticProduct.description || `Premium quality ${staticProduct.name}. Manufacturer and wholesaler in India.`,
          openGraph: {
            images: [staticProduct.image],
          }
        };
      }
      return { title: "Product Not Found | Tailoring Turba" };
    }

    const categoryName = product.category?.name || "Custom Apparel";
    const title = `${product.name} | Premium ${categoryName} Bulk Manufacturer India | Tailoring Turba`;
    const description = product.description 
      ? (product.description.length > 160 ? product.description.substring(0, 157) + "..." : product.description)
      : `High-end manufacturing of ${product.name} in India. Specialized in B2B bulk orders, uniform supplies, and bespoke ${categoryName} for corporate clients.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: product.images?.[0] ? [{ url: product.images[0] }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
      keywords: [`bulk ${categoryName}`, `${product.name} manufacturer`, "India textile export", "custom uniforms India", "corporate apparel wholesale"],
    };
  } catch (err) {
    return { title: "Product Details | Tailoring Turba" };
  }
}

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  let formattedProduct;
  let formattedRelated: any[] = [];

  try {
    const dbProduct = await withRetry(() => prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true }
    }));

    if (!dbProduct || !dbProduct.isActive) {
      const staticProduct = allProducts.find(p => String(p.id) === params.id);
      if (!staticProduct) return notFound();

      formattedProduct = {
        ...staticProduct,
        id: String(staticProduct.id),
        gallery: staticProduct.gallery || [staticProduct.image],
        minOrderQuantity: 10,
      };

      formattedRelated = allProducts
        .filter(p => p.category === staticProduct.category && p.id !== staticProduct.id)
        .slice(0, 4)
        .map(p => ({ ...p, id: String(p.id) }));
    } else {
      formattedProduct = {
        id: dbProduct.id,
        name: dbProduct.name,
        category: dbProduct.category?.name || "Uncategorized",
        type: dbProduct.type || "",
        image: dbProduct.images && dbProduct.images.length > 0 ? dbProduct.images[0] : "",
        gallery: dbProduct.images || [],
        price: dbProduct.basePrice,
        badge: dbProduct.badge || "",
        description: dbProduct.description,
        features: dbProduct.features,
        minOrderQuantity: Math.max(dbProduct.minOrderQuantity || 0, 10),
      };

      const relatedDbProducts = await withRetry(() => prisma.product.findMany({
        where: { categoryId: dbProduct.categoryId, id: { not: dbProduct.id }, isActive: true },
        include: { category: true },
        take: 4
      }));

      formattedRelated = relatedDbProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || "Uncategorized",
        type: p.type || "",
        image: p.images && p.images.length > 0 ? p.images[0] : "",
        price: p.basePrice,
        badge: p.badge || "",
      }));
    }
  } catch (err) {
    console.error("[ProductDetailsPage] DB error, falling back to static data:", err);

    // Try to match by numeric id from static data
    const staticProduct = allProducts.find(p => String(p.id) === params.id);
    if (!staticProduct) return notFound();

    formattedProduct = {
      ...staticProduct,
      id: String(staticProduct.id),
      gallery: staticProduct.gallery || [staticProduct.image],
      minOrderQuantity: 10,
    };

    formattedRelated = allProducts
      .filter(p => p.category === staticProduct.category && p.id !== staticProduct.id)
      .slice(0, 4)
      .map(p => ({ ...p, id: String(p.id) }));
  }

  return <ProductDetailsClient product={formattedProduct} relatedProducts={formattedRelated} />;
}
