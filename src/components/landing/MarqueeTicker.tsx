"use client";
import React from "react";
import styles from "./MarqueeTicker.module.css";

export default function MarqueeTicker() {
  const items = [
    "✦ 100% QUALITY GUARANTEED",
    "✦ MAGIC - FOLKSWEAR - TAILORING TURBA — ALL UNDER ONE ROOF",
    "✦ FREE SAMPLE DISPATCH WITHIN 48 HOURS",
    "✦ CORPORATE BULK ORDERS WELCOME",
    "✦ PUNE-BASED PREMIUM B2B APPAREL MANUFACTURER",
    "✦ SHIPS PAN INDIA - DISPATCH IN 3-10 DAYS",
    "✦ MINIMUM ORDER: JUST 5 PIECES",
    "✦ CUSTOMISE. PRINT. WEAR."
  ];

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.marqueeContent}>
        {items.map((item, i) => (
          <span key={`original-${i}`} className={styles.marqueeItem}>{item}</span>
        ))}
        {items.map((item, i) => (
          <span key={`clone-${i}`} className={styles.marqueeItem}>{item}</span>
        ))}
      </div>
    </div>
  );
}
