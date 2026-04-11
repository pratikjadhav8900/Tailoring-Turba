"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

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
      .catch(err => {
        setError("Network error. Please try again.");
        setIsLoading(false);
      });
  }, []);

  const filtered = activeTab === "All" 
    ? categories 
    : categories.filter(c => c.slug === activeTab);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className="container">
            <h1 className={styles.title}>Corporate Gifts Catalogue 2026–2027</h1>
            <p className={styles.sub}>
              Explore our comprehensive range of premium corporate gifts, custom apparel, and personalized accessories.
            </p>
          </div>
        </div>

        {error ? (
          <div className="container" style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: 12 }}>⚠️ {error}</p>
            <p style={{ fontSize: "0.9rem" }}>The catalogue database may still be setting up. Please try again in a moment.</p>
          </div>
        ) : isLoading ? (
          <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
            Loading catalogue...
          </div>
        ) : (
          <div className="container" style={{ maxWidth: 1200 }}>
            <div className={styles.tabsContainer}>
              <button 
                className={`${styles.tab} ${activeTab === "All" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("All")}
              >
                All Categories
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
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        No Image
                      </div>
                    )}
                  </div>
                  <div className={styles.content}>
                    <div className={styles.catTag}>Category</div>
                    <h2 className={styles.catName}>{cat.name}</h2>
                    <div className={styles.pageInfo}>
                      {cat.pages.length} Pages • Starting Page {cat.pages[0]}
                    </div>
                    
                    <div className={styles.btnGroup}>
                      <Link href={`/products/catalogue/${cat.slug}`} className={styles.viewBtn}>
                        View Details
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
