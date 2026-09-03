"use client";

import styles from "./InventorySnapshot.module.css";
import Link from "next/link";
import AnimatedNumber from "./AnimatedNumber";
import { ArrowRight, ChevronRight, Layers, Tag, Box, Shirt } from "lucide-react";

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  gsm: number | null;
  minOrderQuantity: number;
  basePrice: number;
  isActive: boolean;
  category: {
    name: string;
  } | null;
}

interface InventorySnapshotProps {
  products: ProductItem[];
  totalCount: number;
  categories?: CategorySummary[];
}

export default function InventorySnapshot({
  products,
  totalCount,
  categories = [],
}: InventorySnapshotProps) {
  return (
    <div className={styles.inventoryConsole}>
      {/* Console Header */}
      <div className={styles.consoleHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.tagRow}>
            <span className={styles.tagMono}>CATALOGUE & FABRIC // TELEMETRY</span>
            <span className={styles.activeTag}>
              <AnimatedNumber value={totalCount} /> ACTIVE STYLES
            </span>
          </div>
          <h3 className={styles.panelTitle}>Inventory Snapshot</h3>
        </div>

        <Link href="/admin/products" className={styles.headerLink}>
          <span>Product Catalogue</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className={styles.consoleBody}>
        {/* Category Allocation Distribution */}
        {categories.length > 0 && (
          <div className={styles.categoryBlock}>
            <div className={styles.categoryBlockHeader}>
              <span className={styles.subBlockTitle}>LINE ALLOCATION BY CATEGORY</span>
              <Link href="/admin/categories" className={styles.categoryManageLink}>
                Manage Categories →
              </Link>
            </div>

            <div className={styles.categoryPillGrid}>
              {categories.slice(0, 6).map((cat) => {
                const count = cat._count.products;
                const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                return (
                  <div key={cat.id} className={styles.categoryPill}>
                    <div className={styles.catTop}>
                      <span className={styles.catName}>{cat.name}</span>
                      <span className={styles.catCountMono}>{count}</span>
                    </div>
                    <div className={styles.catTrack}>
                      <div 
                        className={styles.catFill} 
                        style={{ width: `${Math.max(pct, 8)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Product Specs */}
        <div className={styles.productsBlock}>
          <div className={styles.productsBlockHeader}>
            <span className={styles.subBlockTitle}>RECENT ACTIVE SPECIFICATIONS</span>
            <span className={styles.specMeta}>B2B MOQs &amp; Fabric Weights</span>
          </div>

          {products.length === 0 ? (
            <div className={styles.emptyState}>
              <Box size={20} className={styles.emptyIcon} />
              <p>No products found in catalogue.</p>
            </div>
          ) : (
            <div className={styles.productList}>
              {products.slice(0, 5).map((p) => (
                <div key={p.id} className={styles.productRow}>
                  <div className={styles.productLeft}>
                    <div className={styles.metaRow}>
                      <span className={styles.skuMono}>
                        {p.sku || `#SKU-${p.id.slice(-4).toUpperCase()}`}
                      </span>
                      {p.category && (
                        <span className={styles.categoryBadge}>{p.category.name}</span>
                      )}
                      {p.gsm && (
                        <span className={styles.gsmBadge}>{p.gsm} GSM</span>
                      )}
                    </div>
                    <div className={styles.productName}>{p.name}</div>
                  </div>

                  <div className={styles.productRight}>
                    <div className={styles.priceMono}>
                      ₹{p.basePrice.toLocaleString("en-IN")}
                    </div>
                    <div className={styles.moqText}>MOQ: {p.minOrderQuantity} pcs</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
