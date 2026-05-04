"use client";
import React, { useState, useEffect } from "react";
import styles from "./MarqueeTicker.module.css";

export default function MarqueeTicker() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = [
    "✦ 100% QUALITY GUARANTEED",
    "✦ MAGIC - FOLKSWEAR - TAILORING TURBA — ALL UNDER ONE ROOF",
    "✦ FREE SAMPLE DISPATCH WITHIN 48 HOURS",
    "✦ CORPORATE BULK ORDERS WELCOME",
    "✦ PUNE-BASED PREMIUM B2B APPAREL MANUFACTURER",
    "✦ SHIPS PAN INDIA - DISPATCH IN 3-10 DAYS",
    "✦ MINIMUM ORDER: JUST 10 PIECES",
    "✦ CUSTOMISE. PRINT. WEAR."
  ];

  if (!mounted) {
    return <div className={styles.marqueeContainer} style={{ height: '38px' }} />;
  }

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.marqueeContent}>
        {items.map((item, i) => (
          <span 
            key={`original-${i}`} 
            className={styles.marqueeItem}
          >
            {item}
          </span>
        ))}
        {items.map((item, i) => (
          <span 
            key={`clone-${i}`} 
            className={styles.marqueeItem}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
