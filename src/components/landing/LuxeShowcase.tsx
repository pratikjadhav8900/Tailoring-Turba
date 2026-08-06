"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import styles from "./LuxeShowcase.module.css";

const luxeBrands = [
  {
    name: "Adidas",
    tagline: "High-Performance Activewear",
    image: "https://images.unsplash.com/photo-1518002171953-a080ee81be44?auto=format&fit=crop&w=800&q=80",
    slug: "adidas"
  },
  {
    name: "Allen Solly",
    tagline: "Refined Friday Dressing",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80",
    slug: "allen-solly"
  },
  {
    name: "Monte Carlo",
    tagline: "Heritage Knitwear & Outerwear",
    image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80",
    slug: "monte-carlo"
  },
  {
    name: "US Polo Assn.",
    tagline: "Classic Smart Sportswear",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    slug: "us-polo"
  }
];

export default function LuxeShowcase() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className={styles.luxeSection}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={styles.badge}
          >
            <Sparkles size={14} className="text-[#D4AF37]" />
            New Segment
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={styles.title}
          >
            Discover <span>TT Luxe</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={styles.subtitle}
          >
            Authentic corporate merchandise from world-class fashion labels. Customize with premium embroidery and prints.
          </motion.p>
        </div>

        {/* Brand Showcase Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className={styles.grid}
        >
          {luxeBrands.map((brand) => (
            <motion.div
              key={brand.name}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className={styles.card}
            >
              <Link href={`/tt-luxe`} className="block w-full h-full">
                <div className={styles.imageWrapper}>
                  <Image
                    src={brand.image}
                    alt={brand.name}
                    fill
                    className={styles.cardImage}
                    sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 25vw"
                  />
                </div>
                <div className={styles.overlay}>
                  <h3 className={styles.brandLogo}>{brand.name}</h3>
                  <p className={styles.tagline}>{brand.tagline}</p>
                  <span className={styles.viewBtn}>
                    View Catalogues <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Explore Button */}
        <div className={styles.footerActions}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/tt-luxe" className={styles.exploreAllBtn}>
              Explore TT Luxe Collections
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
