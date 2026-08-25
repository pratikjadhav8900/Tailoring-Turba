export const dynamic = "force-dynamic";
import { Metadata } from "next";
import { prisma, withRetry } from "@/lib/prisma";
import { allProducts } from "@/lib/products-data";
import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";

import { cleanCategoryName, cleanProductName } from "@/lib/cleaner";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const product = await withRetry(() => prisma.product.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id }
        ]
      },
      include: { category: true }
    }));

    if (!product || !product.isActive) {
      const staticProduct = allProducts.find(p => String(p.id) === params.id);
      if (staticProduct) {
        const title = `${cleanProductName(staticProduct.name)} | Bulk ${cleanCategoryName(staticProduct.category)} Manufacturer India | Tailoring Turba`;
        return {
          title,
          description: staticProduct.description || `Premium quality ${cleanProductName(staticProduct.name)}. Manufacturer and wholesaler in India.`,
          openGraph: {
            images: [staticProduct.image],
          }
        };
      }
      return { title: "Product Not Found | Tailoring Turba" };
    }

    const categoryName = cleanCategoryName(product.category?.name || "Custom Apparel");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tailoringturba.com";
    const productUrl = `${siteUrl}/products/${product.slug || product.id}`;
    
    // Prioritize SEO custom title, description, and keywords
    const title = product.seoTitle || `${cleanProductName(product.name)} | Premium ${categoryName} Bulk Manufacturer India | Tailoring Turba`;
    const description = product.seoDescription || (product.description 
      ? (product.description.length > 160 ? product.description.substring(0, 157) + "..." : product.description)
      : `High-end manufacturing of ${cleanProductName(product.name)} in India. Specialized in B2B bulk orders, uniform supplies, and bespoke ${categoryName} for corporate clients.`);

    let keywords = [`bulk ${categoryName}`, `${cleanProductName(product.name)} manufacturer`, "India textile export", "custom uniforms India", "corporate apparel wholesale"];
    if (product.seoKeywords) {
      keywords = product.seoKeywords.split(",").map((k: string) => k.trim()).filter(Boolean);
    }

    return {
      title,
      description,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title,
        description,
        url: productUrl,
        images: product.images?.[0] ? [{ url: product.images[0] }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
      keywords,
    };
  } catch (err) {
    return { title: "Product Details | Tailoring Turba" };
  }
}

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  let formattedProduct;
  let formattedRelated: any[] = [];

  try {
    const dbProduct = await withRetry(() => prisma.product.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id }
        ]
      },
      include: { category: true }
    }));

    if (!dbProduct || !dbProduct.isActive) {
      const staticProduct = allProducts.find(p => String(p.id) === params.id);
      if (!staticProduct) return notFound();

      formattedProduct = {
        ...staticProduct,
        id: String(staticProduct.id),
        name: cleanProductName(staticProduct.name),
        category: cleanCategoryName(staticProduct.category || "Uncategorized"),
        gallery: staticProduct.gallery || [staticProduct.image],
        minOrderQuantity: 10,
      };

      formattedRelated = allProducts
        .filter(p => p.category === staticProduct.category && p.id !== staticProduct.id)
        .slice(0, 4)
        .map(p => ({
          ...p,
          id: String(p.id),
          name: cleanProductName(p.name),
          category: cleanCategoryName(p.category || "Uncategorized")
        }));
    } else {
      formattedProduct = {
        id: dbProduct.id,
        name: cleanProductName(dbProduct.name),
        category: cleanCategoryName(dbProduct.category?.name || "Uncategorized"),
        type: dbProduct.type || "",
        image: dbProduct.images && dbProduct.images.length > 0 ? dbProduct.images[0] : "",
        gallery: dbProduct.images || [],
        price: dbProduct.basePrice,
        badge: dbProduct.badge || "",
        description: dbProduct.description,
        features: dbProduct.features,
        colors: dbProduct.colors,
        colorsJson: dbProduct.colorsJson,
        minOrderQuantity: Math.max(dbProduct.minOrderQuantity || 0, 10),
      };

      const relatedDbProducts = await withRetry(() => prisma.product.findMany({
        where: {
          categoryId: dbProduct.categoryId,
          id: { not: dbProduct.id },
          isActive: true,
          name: { not: "Custom Design" },
        },
        include: { category: true },
        take: 4
      }));

      formattedRelated = relatedDbProducts.map(p => ({
        id: p.id,
        name: cleanProductName(p.name),
        category: cleanCategoryName(p.category?.name || "Uncategorized"),
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
      name: cleanProductName(staticProduct.name),
      category: cleanCategoryName(staticProduct.category || "Uncategorized"),
      gallery: staticProduct.gallery || [staticProduct.image],
      minOrderQuantity: 10,
    };

    formattedRelated = allProducts
      .filter(p => p.category === staticProduct.category && p.id !== staticProduct.id)
      .slice(0, 4)
      .map(p => ({
        ...p,
        id: String(p.id),
        name: cleanProductName(p.name),
        category: cleanCategoryName(p.category || "Uncategorized")
      }));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: formattedProduct.name,
    image: formattedProduct.gallery || [formattedProduct.image],
    description: formattedProduct.description || `${formattedProduct.name} by Tailoring Turba`,
    brand: {
      "@type": "Brand",
      name: "Tailoring Turba",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: formattedProduct.price,
      availability: "https://schema.org/InStock",
      url: `https://tailoringturba.com/products/${params.id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailsClient product={formattedProduct} relatedProducts={formattedRelated} />
    </>
  );
}
