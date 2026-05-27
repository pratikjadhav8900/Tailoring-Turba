"use client";
import React, { useRef, useEffect, useState } from "react";
import styles from "./ClientLogos.module.css";

// Premium vector logos mapping for the brand showcase
const BRAND_LOGOS: Record<string, React.ReactNode> = {
  Google: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.134C18.155 2.185 15.46 1 12.24 1 5.92 1 1 5.92 1 12s4.92 11 11.24 11c6.6 0 11-4.65 11-11.2 0-.75-.08-1.32-.18-1.815H12.24z"/>
    </svg>
  ),
  SBI: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 7c-1.66 0-3 1.34-3 3a3 3 0 0 0 1.5 2.6V22h3v-7.4a3 3 0 0 0 1.5-2.6c0-1.66-1.34-3-3-3z"/>
    </svg>
  ),
  AWS: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21a16.8 16.8 0 0 1-8.5-2.2 1 1 0 0 1-.2-1.4 1 1 0 0 1 1.4-.2 14.8 14.8 0 0 0 14.6 0 1 1 0 0 1 1.4.2 1 1 0 0 1-.2 1.4A16.8 16.8 0 0 1 12 21zm7.4-4c-.3 0-.6-.2-.7-.4l-1.5-2.8a.7.7 0 0 1 .6-1c.4 0 .7.3.8.6l1.2 2.3c.3.5.7.7 1.1.7s.8-.2.9-.6l.3-1.6c0-.5.4-.8.9-.7s.8.4.7.9l-.5 3a1 1 0 0 1-1 1l-2.1-.4zm-14.7-6h1.2v3.7c0 1 .4 1.5 1.3 1.5s1.3-.5 1.3-1.5v-3.7h1.2v3.8c0 1.6-1 2.5-2.5 2.5s-2.5-.9-2.5-2.5V11zm7.2.9c0-.6.4-.9 1-.9s1 .3 1 .9V14c0 .6-.4.9-1 .9s-1-.3-1-.9v-2.1zM18.8 11c0-.6.4-.9 1-.9s1 .3 1 .9V14c0 .6-.4.9-1 .9s-1-.3-1-.9v-2.1z"/>
    </svg>
  ),
  IRCTC: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v3.93zm5.79-3.48c-.09-.13-.23-.21-.38-.21H17v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.84-.62 3.51-1.66 4.88l.45.6z"/>
    </svg>
  ),
  Škoda: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L10 14v1c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-1l3.3-2.8c.45.83.7 1.79.7 2.8 0 3.31-2.69 6-6 6zm4.8-10.2l-3.3 2.8H10.5v-1l-3.3-2.8C8.5 7.43 10.15 7 12 7c1.85 0 3.5.43 4.8 1.2z"/>
    </svg>
  ),
  Kirloskar: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6H8V9h6v8zm4-3h-2v-3h2v3z"/>
    </svg>
  ),
  Sela: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 13.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5h3zm2.5-4c0 1.66-1.34 3-3 3H11c-1.66 0-3-1.34-3-3v-1h8v1z"/>
    </svg>
  ),
  "Trovian Group": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L2 21h20L12 3zm0 4.5l6.5 11.5H5.5L12 7.5zM11 11h2v5h-2v-5z"/>
    </svg>
  ),
  "Asma Groups": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  LogicMo: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6H9V9h4v8z"/>
    </svg>
  ),
  "Greensol Tech": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-3H8v-2h3V8h2v3h3v2h-3v3z"/>
    </svg>
  ),
  "Qianyi Rail": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zM8.5 12h7v2h-7z"/>
    </svg>
  ),
  "Advika Aircon": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/>
    </svg>
  ),
  "Hira Automation": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.9c.04-.3.06-.61.06-.9s-.02-.6-.06-.9l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  ),
  "MB Automation": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H9V9h4v7z"/>
    </svg>
  ),
  "Just In Gadgets": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 10V7h-2v5H9V9h4v3z"/>
    </svg>
  ),
  "Komal Systems": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
    </svg>
  ),
  "Snuggles Preschool": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3 9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm-6 4c1.5 2.5 4.5 2.5 6 0H9z"/>
    </svg>
  ),
  "Rajwadi Samosa": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L1 21h22L12 2zm0 4.88L19.8 19H4.2L12 6.88z"/>
    </svg>
  ),
  "Ved Brahma": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21a9 9 0 0 1-9-9c0-4.97 4.03-9 9-9s9 4.03 9 9a9 9 0 0 1-9 9zm0-15c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
    </svg>
  ),
  DES: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM4.5 10.5l7.5 3.75 7.5-3.75V17c0 3-3 5-7.5 5S4.5 20 4.5 17v-6.5z"/>
    </svg>
  ),
  Suroj: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" fill="currentColor"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  "Rama Agrotech": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 3.58 8 8 8s8-3.58 8-8c0-5.52-4.48-10-10-10zm-1 14.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/>
    </svg>
  ),
};

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

// Helper to retrieve brand logo with a beautiful fallback
function getBrandLogo(name: string) {
  return BRAND_LOGOS[name] || (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  );
}

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
        {tripled.map((brand, i) => {
          const logo = getBrandLogo(brand.name);
          return (
            <div
              key={`${brand.name}-${i}`}
              className={`${styles.brandPill} ${styles[`tier_${brand.tier}`]}`}
            >
              <span className={styles.brandLogo} aria-hidden="true">
                {logo}
              </span>
              <span className={styles.brandName}>{brand.name}</span>
            </div>
          );
        })}
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
              {ROW_ONE.map((brand) => {
                const logo = getBrandLogo(brand.name);
                return (
                  <div key={brand.name} className={styles.brandPill}>
                    <span className={styles.brandLogo} aria-hidden="true">
                      {logo}
                    </span>
                    <span className={styles.brandName}>{brand.name}</span>
                  </div>
                );
              })}
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
