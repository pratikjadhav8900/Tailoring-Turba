import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";

export const revalidate = 60; // revalidate every 60 seconds

export default async function ProductsPage() {
  const dbProducts = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  // Map database products to the format expected by the frontend
  const formattedProducts = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category?.name || "Uncategorized",
    type: p.type || "",
    image: p.images && p.images.length > 0 ? p.images[0] : "",
    price: `₹${p.basePrice}`,
    colors: p.colors || 0,
    badge: p.badge || "",
    description: p.description,
    features: p.features,
  }));

  return (
    <Suspense fallback={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading catalog...</div>}>
      <ProductsClient products={formattedProducts} />
    </Suspense>
  );
}
