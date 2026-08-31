"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "./FinalResolution.module.css";

export default function FinalResolution() {
  return (
    <section className={styles.finalOuter}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={styles.contentContainer}
      >
        <span className={styles.sectionTag}>/ 05 THE CONCLUSION</span>

        <h2 className={styles.headline}>{"YOUR GARMENT,\nMANUFACTURED."}</h2>

        <p className={styles.description}>
          From single-origin thread to finished factory dispatch. Partner with Pune’s premier B2B apparel manufacturer for your next custom program.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/customizer" className={styles.primaryCta}>
            START DESIGNING YOUR GARMENT →
          </Link>
          <Link href="/products" className={styles.secondaryCta}>
            EXPLORE FULL CATALOG
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
