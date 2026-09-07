"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "./GarmentJourney.module.css";

const STAGES = [
  {
    id: "thread",
    number: "01",
    label: "THREAD",
    title: "The Single Origin Thread.",
    description: "The journey begins with high-tenacity, long-staple combed cotton yarns engineered for structural strength and soft hand-feel.",
    specs: ["100% COMBED COTTON", "ZERO LINT YARN", "HIGH-TENACITY TPI"],
    image: "/images/manufacturing_editorial.png",
    alt: "Single origin cotton thread",
  },
  {
    id: "fabric",
    number: "02",
    label: "FABRIC",
    title: "Knitted & Woven in Studio.",
    description: "Threads multiply into dense textile structures. From 120 GSM Salina Dryfit to 340 GSM Heavyweight French Terry.",
    specs: ["120 TO 340 GSM", "BIOWASH FINISH", "PRE-SHRUNK FABRIC"],
    image: "/hero_knitting.png",
    alt: "Knitting and textile weaving process",
  },
  {
    id: "cut",
    number: "03",
    label: "CUT",
    title: "CAD Precision Pattern Cutting.",
    description: "Digital pattern grading and high-precision laser/blade cutting ensure uniform fit, zero distortion, and zero material waste.",
    specs: ["CAD PATTERN DRAFTING", "LASER CUT MARGINS", "S–5XL SIZE ACCURACY"],
    image: "/images/manufacturing_editorial.png",
    alt: "Pattern cutting and fabric grading",
  },
  {
    id: "stitch",
    number: "04",
    label: "STITCH",
    title: "Master Tailoring & Seams.",
    description: "Ergonomic assembly with double-needle hems, reinforced neck tapes, and stress-point bar-tacking for maximum durability.",
    specs: ["DOUBLE NEEDLE HEMS", "REINFORCED TAPING", "BAR-TACKED STRESS POINTS"],
    image: "/hero_sewing.png",
    alt: "Precision apparel sewing and stitching",
  },
  {
    id: "embroider",
    number: "05",
    label: "EMBROIDER",
    title: "High-Density Branding.",
    description: "Intricate logo embroidery with Tajima multi-head machines and ultra-vibrant DTF screen printing for custom brand logos.",
    specs: ["TAJIMA MULTI-HEAD", "HIGH-DENSITY EMBROIDERY", "VIBRANT DTF PRINTING"],
    image: "/hero_embroidery_machine.png",
    alt: "Precision embroidery machine",
  },
  {
    id: "finish",
    number: "06",
    label: "FINISH",
    title: "Completed Custom Garment.",
    description: "Steam pressed, biowash inspected, custom neck-tagged, and individually poly-bagged for factory-direct dispatch.",
    specs: ["100% QUALITY CHECK", "CUSTOM NECK TAGGING", "FACTORY DIRECT DISPATCH"],
    image: "/hero_custom_tshirt.png",
    alt: "Finished custom t-shirt and apparel",
  },
];

function StageEditorialCard({ stage, opacity }: { stage: (typeof STAGES)[0]; opacity: any }) {
  const display = useTransform(opacity, (o: number) => (o > 0.05 ? "flex" : "none"));
  return (
    <motion.div
      style={{
        opacity,
        display,
      }}
      className="flex-col gap-6"
    >
      <div className={styles.stageHeader}>
        <span className={styles.stageNumber}>{stage.number}</span>
        <span className={styles.stageCategory}>/ {stage.label}</span>
      </div>

      <h2 className={styles.stageTitle}>{stage.title}</h2>

      <p className={styles.stageDescription}>{stage.description}</p>

      <div className={styles.specChips}>
        {stage.specs.map((spec, sIdx) => (
          <span key={sIdx} className={styles.specChip}>
            {spec}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function GarmentJourney() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate current active stage based on scroll progress (0 to 1 split into 6 stages)
  const activeIndex = useTransform(scrollYProgress, [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1], [0, 0, 1, 2, 3, 4, 5]);

  // Transform opacity and scale for individual stages
  const stage0Opacity = useTransform(scrollYProgress, [0, 0.16], [1, 0]);
  const stage1Opacity = useTransform(scrollYProgress, [0.16, 0.22, 0.33], [0, 1, 0]);
  const stage2Opacity = useTransform(scrollYProgress, [0.33, 0.38, 0.5], [0, 1, 0]);
  const stage3Opacity = useTransform(scrollYProgress, [0.5, 0.55, 0.66], [0, 1, 0]);
  const stage4Opacity = useTransform(scrollYProgress, [0.66, 0.72, 0.83], [0, 1, 0]);
  const stage5Opacity = useTransform(scrollYProgress, [0.83, 0.88, 1], [0, 1, 1]);

  const opacities = [stage0Opacity, stage1Opacity, stage2Opacity, stage3Opacity, stage4Opacity, stage5Opacity];

  // SVG Sewing Thread Progress Path length
  const threadLength = useTransform(scrollYProgress, [0, 1], [100, 1200]);

  return (
    <section ref={containerRef} className={styles.journeyOuter}>
      {/* CONTINUOUS SVG SEWING THREAD */}
      <svg className={styles.svgThreadCanvas} viewBox="0 0 1440 3200" preserveAspectRatio="none">
        <motion.path
          d="M 80, 100 Q 120, 600 90, 1100 T 140, 1800 T 80, 2500 T 120, 3100"
          className={styles.threadPath}
          style={{
            pathLength: scrollYProgress,
          }}
        />
      </svg>

      <div className={styles.stickyViewport}>
        <div className={styles.storyGrid}>
          {/* LEFT: STICKY VISUAL OBJECT */}
          <div className={styles.visualColumn}>
            <div className={styles.stageFrame}>
              {STAGES.map((stage, idx) => (
                <motion.div
                  key={stage.id}
                  style={{ opacity: opacities[idx] }}
                  className={styles.stageImageWrap}
                >
                  <Image
                    src={stage.image}
                    alt={stage.alt}
                    fill
                    priority={idx === 0}
                    className={styles.stageImage}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />

                  {/* Cut Stage Overlay Guides */}
                  {stage.id === "cut" && (
                    <div className={styles.cutMaskOverlay}>
                      <span className={styles.cutGuideLabel}>PATTERN GUIDE #03 · SEAM MARGIN 1.5CM</span>
                    </div>
                  )}

                  {/* Stitch Stage Seam Overlay */}
                  {stage.id === "stitch" && (
                    <svg className={styles.stitchLineOverlay} viewBox="0 0 600 640">
                      <line x1="100" y1="50" x2="500" y2="590" stroke="#D5C49A" strokeWidth="2" strokeDasharray="8 6" />
                    </svg>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT: EDITORIAL STAGE DESCRIPTION */}
          <div className={styles.contentColumn}>
            {STAGES.map((stage, idx) => (
              <StageEditorialCard key={stage.id} stage={stage} opacity={opacities[idx]} />
            ))}

            {/* STAGE PROGRESS TRACKER */}
            <div className={styles.stageNavTracker}>
              {STAGES.map((s, idx) => (
                <div
                  key={s.id}
                  className={`${styles.trackerNode} ${idx === activeIndex.get() ? styles.trackerNodeActive : ""}`}
                >
                  <span className={styles.trackerDot} />
                  <span>{s.number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
