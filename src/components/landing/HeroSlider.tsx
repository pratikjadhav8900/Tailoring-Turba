"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./HeroSlider.module.css";

const SLIDES = [
  {
    id: 1,
    image: "/hero_embroidery_machine.png",
    subtitle: "PRECISION LOGO EMBROIDERY",
    title: "custom embroidery on t-shirts & polos",
  },
  {
    id: 2,
    image: "/hero_dtf_printing.png",
    subtitle: "DTF & SCREEN PRINTING",
    title: "vibrant custom logo & graphic printing",
  },
  {
    id: 3,
    image: "/hero_sewing.png",
    subtitle: "PRECISION TAILORING",
    title: "built from the ground up",
  },
  {
    id: 4,
    image: "/hero_knitting.png",
    subtitle: "TEXTILE INNOVATION",
    title: "the art of premium knitting",
  },
  {
    id: 5,
    image: "/hero_indian_studio.png",
    subtitle: "STUDIO STANDARDS",
    title: "world-class manufacturing",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?auto=format&fit=crop&q=100&w=2560",
    subtitle: "UNCOMPROMISED QUALITY",
    title: "threads that tell a story",
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

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className={styles.heroSection}>
        <div className={styles.slide} style={{ opacity: 1, visibility: 'visible' }}>
          <Image
            src={SLIDES[0].image}
            alt={SLIDES[0].title}
            fill
            priority
            className={styles.backgroundImage}
          />
          <div className={styles.overlay}></div>
          <div className={styles.contentContainer}>
            <div className={styles.textContent}>
              <h3 className={styles.subtitle}>{SLIDES[0].subtitle}</h3>
              <h1 className={styles.title}>{SLIDES[0].title}</h1>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={styles.heroSection}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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