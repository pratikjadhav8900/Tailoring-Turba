"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowRightLeft, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

export default function WishlistPage() {
  const { wishlistItems, toggleWishlist, clearWishlist } = useWishlist();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();

  return (
    <div className={styles.pageWrapper}>
      {/* Soft Overlay for Readability */}
      <div className={styles.overlay} />

      <main className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className={styles.headerRow}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>My Shortlist</h1>
            <p className={styles.subtitle}>
              Your curated collection of premium apparel. Ready for bulk procurement.
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <button 
              onClick={clearWishlist}
              className={styles.clearBtn}
            >
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className={styles.emptyCard}>
            <div style={{ fontSize: "4rem", marginBottom: "32px", opacity: 0.8 }}>✨</div>
            <h3 style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Your Shortlist Awaits</h3>
            <p style={{ color: "#64748b", marginBottom: "48px", fontSize: "1.1rem" }}>Tap the heart on any product to begin curating your collection.</p>
            <Link href="/products" className={styles.btnPrimary} style={{ display: 'inline-flex', width: 'auto', padding: '16px 48px' }}>Explore Collections</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {wishlistItems.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.imageWrap}>
                  <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} />
                  <button 
                    onClick={() => toggleWishlist(item)}
                    className={styles.removeBtn}
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </button>
                  <div className={styles.cardPriceOverlay}>
                    <div className={styles.cardPrice}>{item.price}</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardCategory}>{item.category}</div>
                  <h3 className={styles.cardTitle}>{item.name}</h3>
                  
                  <div className={styles.cardActions}>
                    <Link href={`/products/${item.id}`} className={styles.btnPrimary}>
                      <ShoppingCart size={18} /> View
                    </Link>
                    <button 
                      onClick={() => isInCompare(item.id) ? removeFromCompare(item.id) : addToCompare(item as any)}
                      className={styles.btnSecondary}
                    >
                      {isInCompare(item.id) ? <Check size={18} color="#10b981" /> : <ArrowRightLeft size={18} />}
                      Compare
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
