"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./StatsStrip.module.css";

const STATS = [
  { numeric: 5000000, suffix: "M+", prefix: "", display: "5M+", label: "Garments Delivered", description: "pieces crafted with precision" },
  { numeric: 48, suffix: " hrs", prefix: "", display: "48 hrs", label: "Sample Dispatch", description: "fastest turnaround in the industry" },
  { numeric: 50, suffix: "+", prefix: "", display: "50+", label: "Colors Available", description: "across every fabric category" },
  { numeric: 10, suffix: " pcs", prefix: "", display: "10 pcs", label: "Minimum Order", description: "accessible bulk manufacturing" },
  { numeric: 25, suffix: "+", prefix: "", display: "25+", label: "Brand Partners", description: "India's leading corporates & names" },
];

function useCountUp(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatCard({ stat, index, isVisible }: {
  stat: typeof STATS[0];
  index: number;
  isVisible: boolean;
}) {
  const count = useCountUp(stat.numeric, 1800, isVisible);

  const formatCount = (n: number) => {
    if (stat.numeric >= 1000000) return (n / 1000000).toFixed(0);
    return n.toString();
  };

  return (
    <div
      className={`${styles.statCard} ${index === 0 ? styles.statCardLarge : ""}`}
      style={{ animationDelay: `${index * 120}ms` }}
      data-visible={isVisible}
    >
      <div className={styles.cardGlow} />
      <div className={styles.cardBadge} />
      <div className={styles.numberRow}>
        <span className={styles.number}>
          {isVisible ? formatCount(count) : "0"}
        </span>
        <span className={styles.suffix}>{stat.suffix}</span>
      </div>
      <div className={styles.label}>{stat.label}</div>
      <div className={styles.description}>{stat.description}</div>
    </div>
  );
}

export default function StatsStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Subtle noise texture overlay */}
      <div className={styles.noiseOverlay} aria-hidden="true" />
      
      {/* Top decorative line */}
      <div className={styles.topGoldLine} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          <span className={styles.eyebrowText}>Our Numbers Speak</span>
          <span className={styles.eyebrowLine} />
        </div>

        <div className={styles.grid}>
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
