"use client";
import React, { useRef, useEffect, useState } from "react";
import styles from "./ClientLogos.module.css";

// Real brands from Tailoring Turba LLP Portfolio
const ROW_ONE = [
  { name: "Google", tier: "enterprise" },
  { name: "SBI", tier: "enterprise" },
  { name: "AWS", tier: "enterprise" },
  { name: "IRCTC", tier: "enterprise" },
  { name: "Škoda", tier: "enterprise" },
  { name: "Kirloskar", tier: "premium" },
  { name: "Sela", tier: "premium" },
  { name: "Trovian Group", tier: "premium" },
  { name: "Asma Groups", tier: "premium" },
  { name: "LogicMo", tier: "standard" },
  { name: "Greensol Tech", tier: "standard" },
  { name: "Qianyi Rail", tier: "standard" },
];

const ROW_TWO = [
  { name: "Advika Aircon", tier: "standard" },
  { name: "Hira Automation", tier: "standard" },
  { name: "MB Automation", tier: "standard" },
  { name: "Just In Gadgets", tier: "standard" },
  { name: "Komal Systems", tier: "standard" },
  { name: "Snuggles Preschool", tier: "standard" },
  { name: "Rajwadi Samosa", tier: "standard" },
  { name: "Ved Brahma", tier: "standard" },
  { name: "DES", tier: "standard" },
  { name: "Suroj", tier: "standard" },
  { name: "Rama Agrotech", tier: "standard" },
];

function MarqueeRow({
  items,
  direction = "left",
  speed = 35,
}: {
  items: typeof ROW_ONE;
  direction?: "left" | "right";
  speed?: number;
}) {
  // Duplicate items 3x for seamless infinite loop
  const tripled = [...items, ...items, ...items];

  return (
    <div className={styles.rowWrapper}>
      <div
        className={`${styles.rowTrack} ${direction === "right" ? styles.rowReverse : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {tripled.map((brand, i) => (
          <div
            key={`${brand.name}-${i}`}
            className={`${styles.brandPill} ${styles[`tier_${brand.tier}`]}`}
          >
            <span className={styles.brandDot} aria-hidden="true" />
            <span className={styles.brandName}>{brand.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientLogos() {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setMounted(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Header */}
      <div className={`${styles.header} ${inView ? styles.headerVisible : ""}`}>
        <p className={styles.eyebrow}>Trusted Across Industries</p>
        <h2 className={styles.heading}>
          Worn by India's Most Recognised Names
        </h2>
        <p className={styles.subheading}>
          From Fortune-500 corporations to fast-growing startups — our garments represent their brand every day.
        </p>
      </div>

      {/* Marquee rows */}
      {mounted ? (
        <div className={styles.marqueeContainer}>
          <MarqueeRow items={ROW_ONE} direction="left" speed={40} />
          <MarqueeRow items={ROW_TWO} direction="right" speed={32} />
        </div>
      ) : (
        /* SSR fallback — static first row */
        <div className={styles.marqueeContainer}>
          <div className={styles.rowWrapper}>
            <div className={styles.rowTrack}>
              {ROW_ONE.map((brand) => (
                <div key={brand.name} className={styles.brandPill}>
                  <span className={styles.brandDot} aria-hidden="true" />
                  <span className={styles.brandName}>{brand.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats caption */}
      <div className={`${styles.footer} ${inView ? styles.footerVisible : ""}`}>
        <span className={styles.footerStat}>25+ Brands</span>
        <span className={styles.footerDivider} aria-hidden="true" />
        <span className={styles.footerText}>across IT, Automotive, FMCG, Education & more</span>
      </div>
    </section>
  );
}
