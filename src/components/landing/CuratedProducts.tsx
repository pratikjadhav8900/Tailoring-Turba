"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { allProducts } from "@/lib/products-data";
import styles from "./CuratedProducts.module.css";

export default function CuratedProducts() {
  // Select 4 curated authentic products from allProducts array
  const featuredProduct = allProducts.find((p) => p.id === 16) || allProducts[0]; // Premium Interlock Polo
  const secondaryProducts = [
    allProducts.find((p) => p.id === 3) || allProducts[1], // Turba Bio
    allProducts.find((p) => p.id === 6) || allProducts[2], // Turba Tuck Polo
    allProducts.find((p) => p.id === 17) || allProducts[3], // Turba Hood Hoodie
  ];

  return (
    <section className={styles.curatedOuter}>
      <div className={styles.headerContainer}>
        <div>
          <span className={styles.sectionTag}>/ 04 EDITORIAL ARCHIVE</span>
          <h2 className={styles.headline}>OBJECTS FOR YOUR NEXT PROGRAM.</h2>
        </div>

        <Link href="/products" className={styles.allProductsLink}>
          EXPLORE CATALOG →
        </Link>
      </div>

      <div className={styles.asymmetricGrid}>
        {/* LEFT: FEATURED HERO PRODUCT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link href={`/products/${featuredProduct.id}`} className={styles.featuredCard}>
            <div className={styles.featuredImageFrame}>
              <Image
                src={featuredProduct.image}
                alt={featuredProduct.name}
                fill
                className={styles.productImage}
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </div>

            <div className={styles.cardTop}>
              <span className={styles.badge}>{featuredProduct.badge || "LUXURY"}</span>
              <span className={styles.priceTag}>FROM ₹{featuredProduct.price}/PC</span>
            </div>

            <div className={styles.cardBottom}>
              <span className={styles.productType}>{featuredProduct.type}</span>
              <h3 className={styles.productTitle}>{featuredProduct.name}</h3>
            </div>
          </Link>
        </motion.div>

        {/* RIGHT: SECONDARY PRODUCT COLUMN */}
        <div className={styles.secondaryColumn}>
          {secondaryProducts.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <Link href={`/products/${p.id}`} className={styles.secondaryCard}>
                <div className={styles.secondaryImageFrame}>
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className={styles.productImage}
                    sizes="200px"
                  />
                </div>

                <div className={styles.secondaryInfo}>
                  <div>
                    <span className={styles.productType}>{p.type}</span>
                    <h4 className={styles.secondaryTitle}>{p.name}</h4>
                  </div>

                  <span className={styles.priceTag}>₹{p.price}/PC</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
