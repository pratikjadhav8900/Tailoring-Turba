"use client";
import React from "react";
import Image from "next/image";
import { RecommendedProduct } from "@/types/turba-ai";
import { getResizedCloudinaryUrl } from "@/lib/cloudinary-client";
import { ArrowRight, ExternalLink } from "lucide-react";
import styles from "./TurbaAi.module.css";

interface TurbaAiProductCardProps {
  product: RecommendedProduct;
  onViewProduct: (product: RecommendedProduct) => void;
  onCustomize: (product: RecommendedProduct) => void;
}

export default function TurbaAiProductCard({
  product,
  onViewProduct,
  onCustomize,
}: TurbaAiProductCardProps) {
  const imageSrc = product.image || "";
  const price = product.price;

  return (
    <div className={styles.productCard}>
      <div className={styles.productImageWrapper}>
        {imageSrc ? (
          <Image
            src={getResizedCloudinaryUrl(imageSrc, 400, 400)}
            alt={product.name}
            fill
            className={styles.productImage}
            sizes="160px"
          />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}
        <span className={styles.productBadge}>
          {product.badge || `MOQ ${product.minOrderQuantity || 10}`}
        </span>
      </div>

      <div className={styles.productDetails}>
        <div className={styles.productMeta}>
          {product.category && (
            <span className={styles.productCategory}>{product.category}</span>
          )}
          <h4 className={styles.productTitle} title={product.name}>
            {product.name}
          </h4>
          {product.type && <p className={styles.productType}>{product.type}</p>}
        </div>

        <div className={styles.productPriceRow}>
          <div className={styles.priceContainer}>
            <span className={styles.productPrice}>₹{price.toLocaleString("en-IN")}</span>
            <span className={styles.productMoqLabel}>/ unit</span>
          </div>

          <div className={styles.productActions}>
            <button
              type="button"
              onClick={() => onViewProduct(product)}
              className={styles.viewBtn}
              title="View product specifications"
            >
              <span>Details</span>
              <ExternalLink size={11} />
            </button>
            <button
              type="button"
              onClick={() => onCustomize(product)}
              className={styles.customizeBtn}
              title="Open in Atelier Customizer Studio"
            >
              <span>Customize</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
