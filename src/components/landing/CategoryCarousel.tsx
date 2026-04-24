"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CategoryCarousel.module.css";

const categories = [
  {
    id: "men",
    label: "For Men",
    items: [
      { name: "Crewnecks", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80", href: "/products?category=Round+Neck" },
      { name: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80", href: "/products?category=Hoodie" },
      { name: "Jackets", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80", href: "/products?category=Jacket" },
      { name: "Polos", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80", href: "/products?category=Polo" },
    ]
  },
  {
    id: "women",
    label: "For Women",
    items: [
      { name: "Crop Tops", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80", href: "/products?category=Crop" },
      { name: "Oversized", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80", href: "/products?category=Oversized" },
      { name: "Hoodies", image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&q=80", href: "/products?category=Hoodie" },
    ]
  },
  {
    id: "kids",
    label: "For Kids",
    items: [
      { name: "T-Shirts", image: "https://images.unsplash.com/photo-1519238263530-99abad672f69?w=800&q=80", href: "/products?category=Kids" },
      { name: "School Uniforms", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&q=80", href: "/products?category=Uniform" },
    ]
  }
];

export default function CategoryCarousel() {
  const [activeTab, setActiveTab] = useState(categories[0].id);

  const activeCategory = categories.find(c => c.id === activeTab);

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tabs}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.tab} ${activeTab === cat.id ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className={styles.controls}>
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
