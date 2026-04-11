"use client";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { allProducts } from "@/lib/products-data";


function ProductContent() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(urlCategory);
    }
  }, [urlCategory]);

  // Dynamically extract unique categories from products, plus "All"
  const categories = ["All", ...Array.from(new Set(allProducts.map(p => p.category)))];

  const filtered = activeCategory === "All" 
    ? allProducts 
    : allProducts.filter(p => p.category === activeCategory);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Banner */}
        <div className={styles.banner}>
          <div className="container" style={{ textAlign: "center" }}>
            <h1 className={styles.title}>Explore the Manufacturing Catalog</h1>
            <p className={styles.sub}>High-quality bases ready for your custom bulk printing or teamwear roster.</p>
          </div>
        </div>

        <div className={`container ${styles.layout}`}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <h3 className={styles.filterTitle}>Categories</h3>
            <div className={styles.filterList}>
              {categories.map(c => (
                <button 
                  key={c} 
                  className={`${styles.filterBtn} ${activeCategory === c ? styles.filterActive : ""}`}
                  onClick={() => setActiveCategory(c)}
                >
                  {c} <span className={styles.count}>
                    ({c === "All" ? allProducts.length : allProducts.filter(p => p.category === c).length})
                  </span>
                </button>
              ))}
            </div>

          </aside>

          {/* Grid */}
          <div className={styles.grid}>
            {filtered.map(p => (
              <div key={p.id} className="glass-card" style={{ padding: 20, transition: "transform 0.2s" }}>
                <div style={{ background: "#F3F4F6", borderRadius: 8, height: 320, position: "relative", overflow: "hidden", marginBottom: 20 }}>
                  <Image src={p.image} alt={p.name} fill style={{ objectFit: "cover" }} />
                  {p.badge && (
                    <span style={{ position: "absolute", top: 12, right: 12, background: "var(--accent)", color: "white", fontSize: "0.7rem", padding: "4px 8px", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {p.type}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </h3>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)" }}>{p.price}</div>
                  <Link href={`/products/${p.id}`} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                    View & Customize
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductContent />
    </Suspense>
  );
}
