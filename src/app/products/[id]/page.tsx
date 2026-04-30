import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";

export const revalidate = 60;

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const dbProduct = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true }
  });

  if (!dbProduct) {
    return notFound();
  }

  const relatedDbProducts = await prisma.product.findMany({
    where: {
      categoryId: dbProduct.categoryId,
      id: { not: dbProduct.id }
    },
    include: { category: true },
    take: 4
  });

  const formattedProduct = {
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

  const formattedRelated = relatedDbProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category?.name || "Uncategorized",
    type: p.type || "",
    image: p.images && p.images.length > 0 ? p.images[0] : "",
    price: `₹${p.basePrice}`,
    badge: p.badge || "",
  }));

  return <ProductDetailsClient product={formattedProduct} relatedProducts={formattedRelated} />;
}
