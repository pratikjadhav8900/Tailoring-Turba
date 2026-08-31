"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CategoryCarousel.module.css";

const categories = [
  {
    id: "men",
    label: "For Men",
    items: [
      { name: "Crewnecks", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897586/turba_products/prod_3_MB01-Black_biowash.jpg", href: "/products?category=Essential Polo & T-Shirts" },
      { name: "Hoodies", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898117/turba_products/prod_17_BLACK_1.jpg", href: "/products?category=Winter Wear Collection" },
      { name: "Jackets", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898152/turba_products/prod_20_Black-Blue_HighNeck_Front.jpg", href: "/products?category=Winter Wear Collection" },
      { name: "Polos", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898049/turba_products/prod_16_BLACK-1.webp", href: "/products?category=Essential Polo & T-Shirts" },
    ]
  },
  {
    id: "women",
    label: "For Women",
    items: [
      { name: "Crop Tops", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897699/turba_products/prod_4_MBF01-Black_biowash.jpg", href: "/products?category=Essential Polo & T-Shirts" },
      { name: "Oversized", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897589/turba_products/prod_3_MB02-White_biowash.jpg", href: "/products?category=Essential Polo & T-Shirts" },
      { name: "Hoodies", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898130/turba_products/prod_17_GREY_1.jpg", href: "/products?category=Winter Wear Collection" },
    ]
  },
  {
    id: "kids",
    label: "For Kids",
    items: [
      { name: "T-Shirts", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897729/turba_products/prod_5_BIO_KIDS_ALL.jpg", href: "/products?category=Essential Polo & T-Shirts" },
      { name: "School Uniforms", image: "https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897486/turba_products/prod_2_MDP_All.jpg", href: "/products?category=Essential Polo & T-Shirts" },
    ]
  }
];

export default function CategoryCarousel() {
  const [activeTab, setActiveTab] = useState(categories[0].id);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className={styles.section}>
        <div className="container">
          <div className={styles.header}>
            <div className={styles.tabsContainer}>
              <div className={styles.tabs}>
                {categories.map((cat) => (
                  <button key={cat.id} className={styles.tab}>
                    <span className={styles.tabLabel}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeCategory = categories.find(c => c.id === activeTab);

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.tab} ${activeTab === cat.id ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  {activeTab === cat.id && (
                    <motion.div 
                      className={styles.activePill}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={styles.tabLabel}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={`${styles.controls} hide-mobile`}>
            <button className={styles.arrow} aria-label="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button className={styles.arrow} aria-label="Next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.carouselWrap}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className={styles.grid}
            >
              {activeCategory?.items.map((item) => (
                <Link key={item.name} href={item.href} className={styles.card}>
                  <div className={styles.imageWrap}>
                    <Image src={item.image} alt={item.name} fill className={styles.img} />
                    <div className={styles.overlay} />
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                  </div>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
