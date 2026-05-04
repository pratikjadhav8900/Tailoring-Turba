"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./EditorialWelcome.module.css";
import { ArrowRight, Star, Layers, Scissors } from "lucide-react";

export default function EditorialWelcome() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className={styles.editorial}>
        <div className="container">
          <div className={styles.layout}>
            <div className={styles.imageColumn}>
              <div className={styles.imageWrapper}>
                <Image 
                  src="/images/manufacturing_editorial.png" 
                  alt="Premium Manufacturing" 
                  fill 
                  className={styles.mainImage}
                  sizes="(max-width: 960px) 100vw, 50vw"
                />
                <div className={styles.imageOverlay} />
                <div className={styles.badge}>Est. 2024</div>
              </div>
            </div>
            <div className={styles.narrativeColumn}>
              <span className={styles.eyebrow}>Pune&apos;s Premier B2B Manufacturer</span>
              <h2 className={styles.headline}>
                Built for innovators like you. We create blank apparel on which you express your individuality.
              </h2>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.editorial}>
      <div className="container">
        <div className={styles.layout}>
          {/* Visual Column */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className={styles.imageColumn}
          >
            <div className={styles.imageWrapper}>
              <Image 
                src="/images/manufacturing_editorial.png" 
                alt="Premium Manufacturing" 
                fill 
                className={styles.mainImage}
                sizes="(max-width: 960px) 100vw, 50vw"
              />
              <div className={styles.imageOverlay} />
              <div className={styles.badge}>Est. 2024</div>
            </div>
          </motion.div>

          {/* Narrative Column */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className={styles.narrativeColumn}
          >
            <motion.span variants={itemVariants} className={styles.eyebrow}>
              Pune&apos;s Premier B2B Manufacturer
            </motion.span>
            
            <motion.h2 variants={itemVariants} className={styles.headline}>
              Built for <i>innovators like you</i>. We create blank
              apparel on which you express your individuality.
            </motion.h2>

            <motion.div variants={itemVariants} className={styles.pillars}>
              <div className={styles.pillar}>
                <div className={styles.pillarIcon}><Star size={18} strokeWidth={1.5} /></div>
                <div className={styles.pillarText}>
                  <strong>Customise</strong>
                  <span>Bespoke designs</span>
                </div>
              </div>
              <div className={styles.pillar}>
                <div className={styles.pillarIcon}><Layers size={18} strokeWidth={1.5} /></div>
                <div className={styles.pillarText}>
                  <strong>Print</strong>
                  <span>Branding ready</span>
                </div>
              </div>
              <div className={styles.pillar}>
                <div className={styles.pillarIcon}><Scissors size={18} strokeWidth={1.5} /></div>
                <div className={styles.pillarText}>
                  <strong>Wear</strong>
                  <span>Premium fit</span>
                </div>
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className={styles.body}>
              From a 10-piece sample run to a 50,000-piece corporate rollout —
              Tailoring Turba covers every fabric weight, silhouette, and price point across our in-house brands.
            </motion.p>

            <motion.div variants={itemVariants}>
              <Link href="/products" className={styles.btn}>
                Explore Our Range <ArrowRight size={18} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
