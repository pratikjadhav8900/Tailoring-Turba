"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./CategoryHoverTrail.module.css";

const CATEGORIES = [
  {
    id: "polos",
    name: "POLOS",
    count: "40+ STYLES",
    href: "/products?category=Essential Polo & T-Shirts",
    image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "tshirts",
    name: "T-SHIRTS",
    count: "28+ STYLES",
    href: "/products?category=Essential Polo & T-Shirts",
    image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897586/turba_products/prod_3_MB01-Black_biowash.jpg",
  },
  {
    id: "hoodies",
    name: "HOODIES",
    count: "12+ STYLES",
    href: "/products?category=Winter Wear Collection",
    image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898117/turba_products/prod_17_BLACK_1.jpg",
  },
  {
    id: "crewnecks",
    name: "CREWNECKS",
    count: "16+ STYLES",
    href: "/products?category=Winter Wear Collection",
    image: "/images/categories/men_crewneck.png",
  },
  {
    id: "shirts",
    name: "SHIRTS",
    count: "10+ STYLES",
    href: "/products?category=Dazzle Edition",
    image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "trousers",
    name: "TROUSERS",
    count: "08+ STYLES",
    href: "/products",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "jackets",
    name: "JACKETS",
    count: "06+ STYLES",
    href: "/products?category=Winter Wear Collection",
    image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898149/turba_products/prod_20__Ruffty_Jacket_ShadeCard.png",
  },
];

export default function CategoryHoverTrail() {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX - 140);
    mouseY.set(e.clientY - 180);
  };

  return (
    <section className={styles.categoryOuter} onMouseMove={handleMouseMove}>
      <div className={styles.headerContainer}>
        <span className={styles.sectionTag}>/ 03 CATEGORY INDEX</span>
        <h2 className={styles.headline}>WHAT ARE YOU MAKING?</h2>
      </div>

      <div className={styles.categoryList}>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className={styles.categoryItem}
            onMouseEnter={() => setActiveImage(cat.image)}
            onMouseLeave={() => setActiveImage(null)}
          >
            <h3 className={styles.categoryTitle}>{cat.name}</h3>

            <div className={styles.categoryMeta}>
              <span className={styles.itemCount}>{cat.count}</span>
              <span className={styles.arrowIcon}>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* CURSOR IMAGE TRAIL PREVIEW */}
      {activeImage && (
        <motion.div
          className={styles.floatingPreview}
          style={{
            x: cursorX,
            y: cursorY,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={activeImage}
            alt="Category preview"
            fill
            className={styles.previewImage}
            sizes="280px"
          />
        </motion.div>
      )}
    </section>
  );
}
