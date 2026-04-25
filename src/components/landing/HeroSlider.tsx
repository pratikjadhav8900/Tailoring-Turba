"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./HeroSlider.module.css";

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1618354691438-25bc04584c23?auto=format&fit=crop&q=80&w=2000",
    subtitle: "SUSTAINABLE AND LONG LASTING",
    title: "science meets fabric innovation",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2000",
    subtitle: "RETAIL APPAREL STORES",
    title: "curated premium collections",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=2000",
    subtitle: "PRECISION TAILORING",
    title: "built from the ground up",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=2000",
    subtitle: "PREMIUM BLANKS",
    title: "elevate your brand identity",
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.heroSection}>
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`${styles.slide} ${index === currentSlide ? styles.active : ""}`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            className={styles.backgroundImage}
          />
          <div className={styles.overlay}></div>
          
          <div className={styles.contentContainer}>
            <div className={styles.textContent}>
              <h3 className={styles.subtitle}>{slide.subtitle}</h3>
              <h1 className={styles.title}>{slide.title}</h1>
            </div>
            
            <div className={styles.ctaGroup}>
              <Link href="/customizer" className={styles.primaryBtn}>
                START CUSTOMIZING
              </Link>
              <Link href="/products" className={styles.secondaryBtn}>
                EXPLORE CATALOG
              </Link>
            </div>
          </div>
        </div>
      ))}

      <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={prevSlide}>
        <ChevronLeft size={32} />
      </button>
      <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={nextSlide}>
        <ChevronRight size={32} />
      </button>
      
      <div className={styles.dots}>
        {SLIDES.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}