"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./MaterialSection.module.css";

const MATERIALS = [
  {
    id: "super-cotton-bio",
    name: "Super Cotton Bio",
    gsm: "180 GSM",
    category: "PURE COTTON",
    specs: "100% Combed Cotton • Biowash Softness • Pre-Shrunk",
    image: "/hero_knitting.png",
  },
  {
    id: "nirmal-knit-micro",
    name: "Nirmal Knit Micro",
    gsm: "180 GSM",
    category: "DRYFIT KNIT",
    specs: "Moisture-Wicking Knit • Reflector Tape • Anti-Sweat",
    image: "/hero_indian_studio.png",
  },
  {
    id: "inside-cotton-io",
    name: "Inside Cotton IO",
    gsm: "220 GSM",
    category: "DUAL COMFORT",
    specs: "Cotton Interior • Poly Exterior • Premium Drape",
    image: "/images/manufacturing_editorial.png",
  },
  {
    id: "pure-cotton-interlock",
    name: "Cotton Interlock",
    gsm: "280 GSM",
    category: "HEAVYWEIGHT",
    specs: "Double Knitted Interlock • Jacquard Neck Taping • Luxury Fit",
    image: "/hero_sewing.png",
  },
];

export default function MaterialSection() {
  return (
    <section className={styles.materialOuter}>
      <div className={styles.headerContainer}>
        <span className={styles.sectionTag}>/ 02 TACTILE TEXTILE ARCHIVE</span>
        <h2 className={styles.headline}>FEEL THE DIFFERENCE.</h2>
        <p className={styles.subhead}>
          Every custom garment begins with mill-tested fabrics. From 180 GSM biowashed cotton to 280 GSM luxury interlocks.
        </p>
      </div>

      <div className={styles.materialGrid}>
        {MATERIALS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.12 }}
            className={styles.materialCard}
          >
            <div className={styles.imageFrame}>
              <motion.div
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full relative"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className={styles.fabricImage}
                  sizes="(max-width: 1200px) 50vw, 25vw"
                />
              </motion.div>
            </div>

            <div className={styles.cardOverlay} />

            <div className={styles.cardTop}>
              <span className={styles.gsmBadge}>{item.gsm}</span>
              <span className={styles.categoryLabel}>{item.category}</span>
            </div>

            <div className={styles.cardBottom}>
              <h3 className={styles.materialTitle}>{item.name}</h3>
              <p className={styles.materialSpecs}>{item.specs}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
