"use client";
import React, { useState, useEffect } from "react";
import styles from "./ClientLogos.module.css";

const CLIENTS = [
  "ADIDAS", "MONTE CARLO", "US POLO", "SKECHERS", "PUMA", "REEBOK", "LEVIS", "JACK & JONES"
];

export default function ClientLogos() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className={styles.section}>
        <div className="container">
          <p className={styles.label}>Trusted by established brands across India</p>
          <div className={styles.wrapper}>
            <div className={styles.track}>
              {CLIENTS.map((client, i) => (
                <div key={`logo-${i}`} className={styles.logo}>
                  {client}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.label}>Trusted by established brands across India</p>
        <div className={styles.wrapper}>
          <div className={styles.track}>
            {/* Desktop: Animated track, Mobile: Static Grid */}
            {CLIENTS.map((client, i) => (
              <div key={`logo-${i}`} className={styles.logo}>
                {client}
              </div>
            ))}
            {/* Clone for desktop infinite loop */}
            {CLIENTS.map((client, i) => (
              <div key={`clone-${i}`} className={`${styles.logo} ${styles.desktopOnly}`}>
                {client}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
