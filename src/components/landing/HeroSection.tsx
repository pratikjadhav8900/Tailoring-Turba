"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./HeroSection.module.css";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600&q=85",
    tag: "Hoodies & Fleece",
    headline: "Design & Order\nCustom Teamwear",
    accent: "Online.",
  },
  {
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1600&q=85",
    tag: "Premium Crewnecks",
    headline: "Bulk B2B Orders\nDirect from Factory",
    accent: "Pune.",
  },
  {
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1600&q=85",
    tag: "Corporate Polos",
    headline: "Your Brand.\nYour Uniform.",
    accent: "Delivered.",
  },
  {
    image: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=1600&q=85",
    tag: "Premium Jackets",
    headline: "From Fabric\nto Finished Garment",
    accent: "In-House.",
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [current]);

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 600);
  };

  const slide = slides[current];

  return (
    <section className={styles.hero}>
      {/* Background slides */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={styles.slide}
          style={{
            backgroundImage: `url(${s.image})`,
            opacity: i === current ? 1 : 0,
            transition: "opacity 0.8s ease",
            zIndex: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* Dark overlay */}
      <div className={styles.overlay} />

      {/* Content */}
      <div className={`container ${styles.content}`} style={{ zIndex: 2, position: "relative" }}>
        <div className={styles.inner}>
          <div className={styles.tag} key={`tag-${current}`}>{slide.tag}</div>
          <h1 className={styles.title} key={`h1-${current}`}>
            {slide.headline.split("\n").map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
            <span className={styles.accent}>{slide.accent}</span>
          </h1>
          <p className={styles.subtitle}>
            From raw fabrics to custom sublimated jerseys — a complete B2B solution for teams, events and bulk orders, straight from our Pune facility.
          </p>
          <div className={styles.actions}>
            <Link href="/customizer" className={styles.btnPrimary}>START CUSTOMIZING</Link>
            <Link href="/products" className={styles.btnSecondary}>EXPLORE CATALOGUE</Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>10k+</strong><span>Garments Delivered</span></div>
            <div className={styles.stat}><strong>48hr</strong><span>Sample Dispatch</span></div>
            <div className={styles.stat}><strong>100%</strong><span>In-House Printing</span></div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className={styles.counter}>
          <span className={styles.counterCurrent}>{String(current + 1).padStart(2, "0")}</span>
          <span className={styles.counterSep}>/</span>
          <span className={styles.counterTotal}>{String(slides.length).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
}
