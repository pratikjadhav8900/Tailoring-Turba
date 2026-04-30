"use client";
import React from "react";
import styles from "./ClientLogos.module.css";

const CLIENTS = [
  "APEX CORP", "LUMINA TECH", "VANTAGE", "NEXA RETAIL", "ORION GLOBAL", "ZENITH GROUP"
];

export default function ClientLogos() {
  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.label}>Trusted by established brands across India</p>
        <div className={styles.wrapper}>
          <div className={styles.track}>
            {[...CLIENTS, ...CLIENTS].map((client, i) => (
              <div key={i} className={styles.logo}>
                {client}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
