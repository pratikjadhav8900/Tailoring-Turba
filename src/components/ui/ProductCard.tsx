"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { getResizedCloudinaryUrl } from "@/lib/cloudinary-client";
import styles from "./ProductCard.module.css";

interface ProductData {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  minOrderQuantity: number;
  images: string[];
  badge?: string | null;
  colors?: number | null;
  features: string[];
  type?: string | null;
  brand?: string | null;
}

interface ProductCardProps {
  product: ProductData;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.id);
  const imageSrc = product.images?.[0] || "";
  const price = product.basePrice;

  return (
    <div className={styles.card}>
      <Link href={`/products/${product.id}`} className={styles.link}>
        <div className={styles.imageWrapper}>
          {imageSrc ? (
            <Image
              src={getResizedCloudinaryUrl(imageSrc, 600, 800)}
              alt={product.name}
              fill
              className={styles.image}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            />
          ) : (
            <div className={styles.noImage}>No Image</div>
          )}

          {/* MOQ / B2B Badge */}
          <span className={styles.badge}>
            {product.badge || `MOQ ${product.minOrderQuantity || 10} Pcs`}
          </span>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.basePrice,
                minOrderQuantity: product.minOrderQuantity,
                image: imageSrc,
                gallery: product.images,
                badge: product.badge || "",
                colors: product.colors || 1,
                features: product.features,
                type: product.type || "",
                brand: product.brand || "TAILORING TURBA",
                categoryId: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
              } as any);
            }}
            className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistActive : ""}`}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart 
              size={15} 
              fill={isWishlisted ? "#ef4444" : "none"} 
              color={isWishlisted ? "#ef4444" : "#111111"} 
            />
          </button>
        </div>

        <div className={styles.info}>
          <div className={styles.brand}>{product.brand || "TAILORING TURBA"}</div>
          <h4 className={styles.name}>{product.name}</h4>
          <div className={styles.metaRow}>
            <span className={styles.price}>₹{price.toLocaleString("en-IN")}</span>
            {product.type && <span className={styles.type}>{product.type}</span>}
          </div>
        </div>
      </Link>
      
      <div className={styles.actions}>
        <Link href={`/products/${product.id}`} className={styles.ctaButton}>
          Customize
        </Link>
      </div>
    </div>
  );
}
