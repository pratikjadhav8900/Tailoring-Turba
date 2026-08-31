"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import styles from "./HeroSection.module.css";

const CRAFT_STAGES = [
  {
    id: "studio",
    number: "01",
    label: "STUDIO",
    caption: "WORLD-CLASS MANUFACTURING STUDIO",
    image: "/hero_indian_studio.png",
    alt: "Tailoring Turba Manufacturing Studio",
  },
  {
    id: "embroidery",
    number: "02",
    label: "EMBROIDERY",
    caption: "PRECISION LOGO EMBROIDERY",
    image: "/hero_embroidery_machine.png",
    alt: "Precision Embroidery Machine",
  },
  {
    id: "sewing",
    number: "03",
    label: "SEWING",
    caption: "BESPOKE TAILORING & SEWING",
    image: "/hero_sewing.png",
    alt: "Precision Sewing Workshop",
  },
  {
    id: "knitting",
    number: "04",
    label: "TEXTILE",
    caption: "PREMIUM KNITTING & FABRIC",
    image: "/hero_knitting.png",
    alt: "Premium Textile Knitting",
  },
];

export default function HeroSection() {
  const [activeStage, setActiveStage] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHoveringMedia, setIsHoveringMedia] = useState(false);
  const [isDesktopHover, setIsDesktopHover] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 21st.dev Interaction Mechanics
  const textY = useTransform(scrollYProgress, [0, 0.45], ["0px", "-50px"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0.2]);
  
  // Scroll Media Expansion (Framed -> Full width)
  const mediaWidth = useTransform(scrollYProgress, [0, 0.6], ["90%", "100%"]);
  const mediaRadius = useTransform(scrollYProgress, [0, 0.6], ["24px", "4px"]);
  const mediaScale = useTransform(scrollYProgress, [0, 0.6], [0.95, 1.03]);
  const innerParallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0.2, 1]);

  useEffect(() => {
    // Detect desktop mouse hover capability
    if (typeof window !== "undefined") {
      setIsDesktopHover(window.matchMedia("(hover: hover)").matches);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopHover) return;
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const currentAsset = CRAFT_STAGES[activeStage];

  return (
    <section ref={containerRef} className={styles.heroOuter}>
      <div className={styles.stickyContainer}>
        {/* EDITORIAL HEADER BLOCK */}
        <motion.div 
          style={{ y: textY, opacity: textOpacity }}
          className={styles.headerBlock}
        >
          <div className={styles.topMetaRow}>
            <span className={styles.brandTag}>
              TAILORING TURBA / 01
            </span>
            <span className={styles.eyebrow}>
              PUNE'S PREMIER B2B APPAREL MANUFACTURER
            </span>
            <div className={styles.techSpecList}>
              <span>MOQ 10 PCS</span>
              <span className={styles.techDot} />
              <span>FACTORY DIRECT</span>
              <span className={styles.techDot} />
              <span>INDIA EXPORT</span>
            </div>
          </div>

          <div className={styles.headlineGrid}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={styles.headline}
            >
              <span className={styles.headlineLine}>APPAREL,</span>
              <span className={`${styles.headlineLine} ${styles.headlineItalic}`}>MADE YOURS.</span>
            </motion.h1>

            <div className={styles.subContent}>
              <p className={styles.description}>
                From fabric selection to precision stitching, we manufacture custom apparel built around your brand identity.
              </p>

              <div className={styles.ctaGroup}>
                <Link href="/customizer" className={styles.btnPrimary}>
                  <span>START DESIGNING</span>
                  <ArrowUpRight size={18} className={styles.btnPrimaryIcon} />
                </Link>
                <Link href="/products" className={styles.btnSecondary}>
                  <span>EXPLORE COLLECTION</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 21ST.DEV SCROLL MEDIA EXPANSION BLOCK */}
        <div className={styles.mediaWrapSection}>
          <motion.div
            style={{
              width: mediaWidth,
              borderRadius: mediaRadius,
              scale: mediaScale,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHoveringMedia(true)}
            onMouseLeave={() => setIsHoveringMedia(false)}
            className={styles.mediaFrame}
          >
            <motion.div 
              style={{ y: innerParallaxY }}
              className={styles.innerParallaxImage}
            >
              <Image
                src={currentAsset.image}
                alt={currentAsset.alt}
                fill
                priority
                className={styles.mediaImage}
                sizes="(max-width: 1200px) 100vw, 90vw"
              />
            </motion.div>
            <div className={styles.mediaOverlay} />

            {/* Media Meta & Interactive Craft Switcher */}
            <div className={styles.mediaMetaBar}>
              <span className={styles.mediaCaption}>
                {currentAsset.number} / {currentAsset.caption}
              </span>

              <div className={styles.craftTabs}>
                {CRAFT_STAGES.map((stage, idx) => (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(idx)}
                    className={`${styles.craftTab} ${idx === activeStage ? styles.craftTabActive : ""}`}
                  >
                    {stage.number} {stage.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* EDITORIAL STORY PROGRESS ROW */}
        <div className={styles.progressRow}>
          <span className={styles.progressLabel}>
            01 / 05 — MANUFACTURING STORY
          </span>

          <div className={styles.progressBarTrack}>
            <motion.div 
              style={{ scaleX: progressScaleX }}
              className={styles.progressBarFill}
            />
          </div>

          <div className={styles.scrollHint}>
            <span>SCROLL TO DISCOVER</span>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Desktop Contextual Morphing Cursor */}
      {isDesktopHover && isHoveringMedia && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
          }}
          className={styles.customCursor}
        >
          <span>EXPLORE CRAFT</span>
          <ArrowUpRight size={12} />
        </motion.div>
      )}
    </section>
  );
}
