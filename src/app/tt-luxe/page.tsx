"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  FileDown, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Layers, 
  Scissors, 
  ChevronRight,
  Download,
  Filter,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from "lucide-react";
import styles from "./page.module.css";

interface ProductItem {
  id: string;
  brandId: string;
  brandName: string;
  title: string;
  category: "Polos" | "Jackets" | "T-Shirts" | "Oxford Shirts" | "Activewear";
  image: string;
  gsm: string;
  fabric: string;
  moq: string;
  pdfPath: string;
  pdfName: string;
  colors: string[];
}

const productCatalogData: ProductItem[] = [
  {
    id: "prod-1",
    brandId: "allen-solly",
    brandName: "Allen Solly",
    title: "Allen Solly Executive Oxford Shirt",
    category: "Oxford Shirts",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800",
    gsm: "190 GSM",
    fabric: "Combed Oxford Soft Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/ALLEN SOLLY_NEW_1.pdf",
    pdfName: "Allen Solly New Collection (PDF)",
    colors: ["#FFFFFF", "#FEF08A", "#BAE6FD", "#E9D5FF", "#E2E8F0"]
  },
  {
    id: "prod-2",
    brandId: "allen-solly",
    brandName: "Allen Solly",
    title: "Allen Solly Fine Knit Pique Polo",
    category: "Polos",
    image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=800",
    gsm: "220 GSM",
    fabric: "100% Long-Staple Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/ALLEN-SOLLY_TSHIRTS_CATALOGUE.pdf",
    pdfName: "Allen Solly T-Shirts Catalogue (PDF)",
    colors: ["#FFFFFF", "#18181B", "#1E3A8A", "#D1D5DB"]
  },
  {
    id: "prod-3",
    brandId: "adidas",
    brandName: "Adidas",
    title: "Adidas Cotton Tipping Polo (210 GSM)",
    category: "Polos",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800",
    gsm: "210 GSM",
    fabric: "100% Premium Cotton Pique",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/Adidas 100-  Cotton Tipping Tshirt (210 gsm).pdf",
    pdfName: "Adidas Tipping Polo Specs (PDF)",
    colors: ["#94A3B8", "#FFFFFF", "#0F172A", "#16A34A", "#1D4ED8", "#DC2626"]
  },
  {
    id: "prod-4",
    brandId: "adidas",
    brandName: "Adidas",
    title: "Adidas Climalite Active Performance Tee",
    category: "Activewear",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800",
    gsm: "190 GSM",
    fabric: "Moisture-Wicking Climalite Poly",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/Adidas 100-  Cotton Tipping Tshirt (210 gsm).pdf",
    pdfName: "Adidas Activewear Catalogue (PDF)",
    colors: ["#94A3B8", "#FFFFFF", "#0F172A", "#16A34A", "#1D4ED8", "#DC2626"]
  },
  {
    id: "prod-5",
    brandId: "us-polo",
    brandName: "US Polo Assn.",
    title: "US Polo Assn. Signature Double Rider Polo",
    category: "Polos",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=800",
    gsm: "220 GSM",
    fabric: "Double-Knit Pique Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/US POLO PREMIUM COTTON SHIRT.pdf",
    pdfName: "US Polo Premium Shirt Specs (PDF)",
    colors: ["#3B82F6", "#0F172A", "#15803D"]
  },
  {
    id: "prod-6",
    brandId: "us-polo",
    brandName: "US Polo Assn.",
    title: "US Polo Assn. Classic Oxford Shirt",
    category: "Oxford Shirts",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800",
    gsm: "200 GSM",
    fabric: "Fine Woven Oxford Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/US POLO PREMIUM COTTON SHIRT.pdf",
    pdfName: "US Polo Full Catalogue (PDF)",
    colors: ["#3B82F6", "#0F172A", "#15803D"]
  },
  {
    id: "prod-7",
    brandId: "monte-carlo",
    brandName: "Monte Carlo",
    title: "Monte Carlo Executive Soft Knit Jacket",
    category: "Jackets",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800",
    gsm: "320 GSM",
    fabric: "Heavyweight Fleece & Soft Knit Poly-Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/Monte Carlo Jacket-.pdf",
    pdfName: "Monte Carlo Jacket Catalogue (PDF)",
    colors: ["#18181B", "#64748B", "#0F172A"]
  },
  {
    id: "prod-8",
    brandId: "monte-carlo",
    brandName: "Monte Carlo",
    title: "Monte Carlo DryFit Sport Tee",
    category: "Activewear",
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800",
    gsm: "180 GSM",
    fabric: "Breathable DryFit Micro-Mesh",
    moq: "10 Pieces",
    pdfPath: "/TT Luxe/MONTE CARLO DRYFIT TSHIRT.pdf",
    pdfName: "Monte Carlo DryFit Specs (PDF)",
    colors: ["#881337", "#374151", "#1D4ED8", "#0F172A", "#064E3B"]
  }
];

const brandFilterList = [
  { id: "all", label: "ALL BRANDS" },
  { id: "allen-solly", label: "ALLEN SOLLY" },
  { id: "adidas", label: "ADIDAS" },
  { id: "us-polo", label: "US POLO ASSN." },
  { id: "monte-carlo", label: "MONTE CARLO" }
];

const categoryFilterList = ["All Categories", "Polos", "Jackets", "Activewear", "Oxford Shirts"];

export default function TTLuxeBrandedPage() {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");

  const filteredProducts = useMemo(() => {
    return productCatalogData.filter((item) => {
      const matchBrand = selectedBrand === "all" || item.brandId === selectedBrand;
      const matchCategory = selectedCategory === "All Categories" || item.category === selectedCategory;
      return matchBrand && matchCategory;
    });
  }, [selectedBrand, selectedCategory]);

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId);
    const elem = document.getElementById("catalog-grid-anchor");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Puma-Style High-Impact Hero Banner */}
      <section className={styles.pumaHero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroTextContent}>
            <span className={styles.pumaEyebrow}>
              OFFICIAL BRANDED CATEGORY PORTAL
            </span>
            <h1 className={styles.pumaTitle}>
              FOREVER ELEVATED.
            </h1>
            <p className={styles.pumaSubtitle}>
              Official enterprise sourcing and precision customization for global retail labels. Explore authentic corporate apparel from Allen Solly, Adidas, US Polo Assn. & Monte Carlo.
            </p>

            {/* Quick Action Filter Bar */}
            <div className={styles.heroFilterRow}>
              {brandFilterList.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b.id)}
                  className={`${styles.filterPill} ${selectedBrand === b.id ? styles.filterPillActive : ""}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PUMA-STYLE INTER-SECTION HERO BANNER 1: ALLEN SOLLY SPOTLIGHT (ON TOP) */}
      <section className={styles.pumaInterSectionBanner}>
        <Image
          src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=2560"
          alt="Allen Solly Executive Shirting"
          fill
          priority
          quality={95}
          className={styles.interBannerBg}
          sizes="100vw"
        />
        <div className={styles.interBannerOverlay} />

        <div className={styles.interBannerContent}>
          <div className={styles.interBannerBadge}>ALLEN SOLLY EXECUTIVE</div>
          <span className={styles.interBannerSub}>190 - 220 GSM LUXURY COMBED COTTON</span>
          <h2 className={styles.interBannerTitle}>ALLEN SOLLY EXECUTIVE SHIRTS</h2>
          <p className={styles.interBannerDesc}>
            Sharp business formal shirting and fine knit pique polos engineered for modern enterprise leadership.
          </p>
          <button 
            onClick={() => handleBrandSelect("allen-solly")}
            className={styles.interBannerBtn}
          >
            SHOP ALLEN SOLLY COLLECTION
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 2. Interactive Filter & Product Catalogue Grid */}
      <section id="catalog-grid-anchor" className={styles.catalogSection}>
        <div className={styles.container}>
          {/* Category Filter Pills & Result Counter */}
          <div className={styles.filterBarHeader}>
            <div className={styles.categoryPills}>
              {categoryFilterList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`${styles.catTab} ${selectedCategory === cat ? styles.catTabActive : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.resultsCount}>
              Showing <strong>{filteredProducts.length}</strong> Official Products
            </div>
          </div>

          {/* Puma-Style E-Commerce Product Card Grid */}
          <div className={styles.productGrid}>
            <AnimatePresence mode="sync">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className={styles.productCard}
                >
                  <div className={styles.cardImgWrap}>
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className={styles.cardImg}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className={styles.brandBadge}>{product.brandName}</div>
                    <div className={styles.gsmBadge}>{product.gsm}</div>
                  </div>

                  <div className={styles.cardDetails}>
                    <span className={styles.categoryLabel}>{product.category}</span>
                    <h3 className={styles.productTitle}>{product.title}</h3>
                    <p className={styles.fabricText}>{product.fabric}</p>

                    {/* Color Swatches */}
                    <div className={styles.cardSwatches}>
                      {product.colors.map((hex, i) => (
                        <span key={i} className={styles.swatchDot} style={{ backgroundColor: hex }} />
                      ))}
                      <span className={styles.moqText}>MOQ: {product.moq}</span>
                    </div>

                    {/* Quote Trigger */}
                    <div className={styles.cardActions}>
                      <Link
                        href={`/contact?product=${encodeURIComponent(product.title)}`}
                        className={styles.cardQuoteBtn}
                      >
                        Request Bulk Quote
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* PUMA-STYLE INTER-SECTION HERO BANNER 2: MONTE CARLO WINTERWEAR */}
      <section className={styles.pumaInterSectionBanner}>
        <Image
          src="https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?q=80&w=1600"
          alt="Monte Carlo Winterwear"
          fill
          className={styles.interBannerBg}
          sizes="100vw"
        />
        <div className={styles.interBannerOverlay} />

        <div className={styles.interBannerContent}>
          <div className={styles.interBannerBadge}>MONTE CARLO LUXURY</div>
          <span className={styles.interBannerSub}>300+ GSM EXECUTIVE KNITWEAR & FLEECE</span>
          <h2 className={styles.interBannerTitle}>MONTE CARLO WINTERWEAR</h2>
          <p className={styles.interBannerDesc}>
            Heritage warmth, soft poly-cotton fleece, and premium wool-blend sweaters for executive corporate gifting.
          </p>
          <button 
            onClick={() => handleBrandSelect("monte-carlo")}
            className={styles.interBannerBtn}
          >
            EXPLORE MONTE CARLO
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 3. Puma-Style Split Category Banners */}
      <section className={styles.featureBannersSection}>
        <div className={styles.container}>
          <div className={styles.sectionTitleHeader}>
            <span className={styles.pumaEyebrow}>ENTERPRISE COLLECTIONS</span>
            <h2 className={styles.sectionHeadline}>Browse By Category</h2>
          </div>

          <div className={styles.bannerGrid}>
            <div className={styles.bannerCard}>
              <Image
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000"
                alt="Executive Polos"
                fill
                className={styles.bannerImg}
                sizes="50vw"
              />
              <div className={styles.bannerOverlay} />
              <div className={styles.bannerContent}>
                <span className={styles.bannerTag}>210 - 240 GSM</span>
                <h3 className={styles.bannerTitle}>Executive Polos</h3>
                <p className={styles.bannerDesc}>High-thread-count pique polos for leadership and executive teams.</p>
                <button onClick={() => setSelectedCategory("Polos")} className={styles.bannerBtn}>
                  Explore Polos <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <div className={styles.bannerCard}>
              <Image
                src="https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?q=80&w=1000"
                alt="Corporate Outerwear"
                fill
                className={styles.bannerImg}
                sizes="50vw"
              />
              <div className={styles.bannerOverlay} />
              <div className={styles.bannerContent}>
                <span className={styles.bannerTag}>300+ GSM WINTERWEAR</span>
                <h3 className={styles.bannerTitle}>Corporate Jackets</h3>
                <p className={styles.bannerDesc}>Soft-knit fleece jackets and weather-ready executive vests.</p>
                <button onClick={() => setSelectedCategory("Jackets")} className={styles.bannerBtn}>
                  Explore Jackets <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PUMA-STYLE INTER-SECTION HERO BANNER 3: US POLO HERITAGE */}
      <section className={styles.pumaInterSectionBanner}>
        <Image
          src="https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1600"
          alt="US Polo Assn. Heritage"
          fill
          className={styles.interBannerBg}
          sizes="100vw"
        />
        <div className={styles.interBannerOverlay} />

        <div className={styles.interBannerContent}>
          <div className={styles.interBannerBadge}>US POLO ASSN.</div>
          <span className={styles.interBannerSub}>DOUBLE RIDER PIQUE COTTON</span>
          <h2 className={styles.interBannerTitle}>US POLO ASSN. HERITAGE</h2>
          <p className={styles.interBannerDesc}>
            Timeless Ivy League athletic style for modern enterprise teams. Double-stitched contrast knit collars.
          </p>
          <button 
            onClick={() => handleBrandSelect("us-polo")}
            className={styles.interBannerBtn}
          >
            EXPLORE US POLO
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 4. Complete Brand Catalogue Hub */}
      <section className={styles.pdfHubSection}>
        <div className={styles.container}>
          <div className={styles.sectionTitleHeader}>
            <span className={styles.pumaEyebrow}>DOWNLOAD CENTER</span>
            <h2 className={styles.sectionHeadline}>Official Brand Catalogue Hub</h2>
          </div>

          <div className={styles.hubCompactGrid}>
            {productCatalogData.map((prod) => (
              <a
                key={prod.id}
                href={prod.pdfPath}
                download
                className={styles.hubDownloadRow}
              >
                <div className={styles.hubIconBox}>
                  <FileDown size={16} className="text-[#1B3B2B]" />
                </div>
                <div className={styles.hubTextGroup}>
                  <span className={styles.hubTitle}>{prod.title}</span>
                  <span className={styles.hubSub}>{prod.brandName} • {prod.gsm}</span>
                </div>
                <Download size={15} className={styles.hubArrow} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Consultation & Sourcing Desk CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Need Custom Brand Mockups or Bulk Rates?</h2>
              <p className={styles.ctaText}>
                Connect directly with our master tailors and brand representatives to receive custom digital mockups and tailored wholesale pricing.
              </p>
              <Link href="/contact?subject=TT Luxe Branded Inquiry" className={styles.ctaBtn}>
                Consult TT Luxe Sourcing Desk
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
