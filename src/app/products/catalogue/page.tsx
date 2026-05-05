"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import Skeleton from "@/components/Skeleton";

type CatalogueCategory = {
  id: string;
  name: string;
  slug: string;
  coverImage: string | null;
  pages: number[];
};

export default function CataloguePage() {
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/catalogue")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setError(data?.error || "Failed to load catalogue data.");
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError("Network error. Please try again.");
        setIsLoading(false);
      });
  }, []);

  const filtered = activeTab === "All"
    ? categories
    : categories.filter(c => c.slug === activeTab);

  return (
    <>
      <main className={styles.main} suppressHydrationWarning>

        {/* Premium Hero Header */}
        <div className={styles.heroHeader}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <div>
              <p className={styles.eyebrow}>Tailoring Turba</p>
              <h1 className={styles.title}>Corporate Catalogue 2026</h1>
              <p className={styles.sub}>
                Explore our comprehensive lookbook of premium corporate gifts, custom apparel, and personalized accessories.
              </p>
            </div>
          </div>
        </div>

        {/* Main Body */}
        {error ? (
          <div className={styles.stateBox}>
            <p className={styles.errorText}>⚠️ {error}</p>
            <p className={styles.errorSub}>The catalogue database may still be setting up. Please try again in a moment.</p>
          </div>
        ) : isLoading ? (
          <div className={styles.mainContent}>
            <div className={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={styles.card} style={{ pointerEvents: 'none' }}>
                  <div className={styles.imageWrapper}>
                    <Skeleton height="100%" borderRadius="0" />
                  </div>
                  <div className={styles.content}>
                    <Skeleton width="40%" height="0.7rem" style={{ marginBottom: "12px" }} />
                    <Skeleton width="80%" height="1.5rem" style={{ marginBottom: "12px" }} />
                    <Skeleton width="50%" height="0.9rem" style={{ marginBottom: "20px" }} />
                    <div className={styles.btnGroup}>
                      <Skeleton width="100%" height="2.5rem" borderRadius="8px" />
                      <Skeleton width="100%" height="2.5rem" borderRadius="8px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.mainContent}>

            {/* Category Tabs */}
            <div className={styles.tabsWrapper}>
              <div className={styles.tabsContainer}>
                <button
                  className={`${styles.tab} ${activeTab === "All" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("All")}
                >
                  All Collections
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`${styles.tab} ${activeTab === cat.slug ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab(cat.slug)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              {filtered.map(cat => (
                <div key={cat.id} className={styles.card}>
                  <div className={styles.imageWrapper}>
                    {cat.coverImage ? (
                      <Image
                        src={cat.coverImage}
                        alt={cat.name}
                        fill
                        style={{ objectFit: "cover", objectPosition: "top" }}
                      />
                    ) : (
                      <div className={styles.placeholderImage}>
                        No Image
                      </div>
                    )}
                    <div className={styles.imageOverlay}></div>
                  </div>
                  <div className={styles.content}>
                    <div className={styles.catTag}>Collection</div>
                    <h2 className={styles.catName}>{cat.name}</h2>
                    <div className={styles.pageInfo}>
                      {cat.pages.length} Pages &bull; Starts pg {cat.pages[0]}
                    </div>
                    <div className={styles.btnGroup}>
                      <Link href={`/products/catalogue/${cat.slug}`} className={styles.viewBtn}>
                        View Collection
                      </Link>
                      <Link href={`/contact?category=${cat.slug}`} className={styles.quoteBtn}>
                        Request Quote
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>
    </>
  );
}
