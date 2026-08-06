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
    image: "/TT%20Luxe/extracted/allen_solly_new_1_p3_11__X20.jpg",
    gsm: "190 GSM",
    fabric: "Combed Oxford Soft Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/ALLEN%20SOLLY_NEW_1.pdf",
    pdfName: "Allen Solly New Collection (PDF)",
    colors: ["#FFFFFF", "#FEF08A", "#BAE6FD", "#E9D5FF", "#E2E8F0"]
  },
  {
    id: "prod-2",
    brandId: "allen-solly",
    brandName: "Allen Solly",
    title: "Allen Solly Fine Knit Pique Polo",
    category: "Polos",
    image: "/TT%20Luxe/extracted/allen_solly_tshirts_catalogue_p4_9__Im0.jpg",
    gsm: "220 GSM",
    fabric: "100% Long-Staple Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/ALLEN-SOLLY_TSHIRTS_CATALOGUE.pdf",
    pdfName: "Allen Solly T-Shirts Catalogue (PDF)",
    colors: ["#FFFFFF", "#18181B", "#1E3A8A", "#D1D5DB"]
  },
  {
    id: "prod-3",
    brandId: "adidas",
    brandName: "Adidas",
    title: "Adidas Cotton Tipping Polo (210 GSM)",
    category: "Polos",
    image: "/TT%20Luxe/extracted/adidas_100___cotton_tipping_tshirt_(210_gsm)_p2_8__Im49.jpg",
    gsm: "210 GSM",
    fabric: "100% Premium Cotton Pique",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Adidas%20100-%20%20Cotton%20Tipping%20Tshirt%20(210%20gsm).pdf",
    pdfName: "Adidas Tipping Polo Specs (PDF)",
    colors: ["#94A3B8", "#FFFFFF", "#0F172A", "#16A34A", "#1D4ED8", "#DC2626"]
  },
  {
    id: "prod-4",
    brandId: "adidas",
    brandName: "Adidas",
    title: "Adidas Climalite Active Performance Tee",
    category: "Activewear",
    image: "/TT%20Luxe/extracted/adidas_100___cotton_tipping_tshirt_(210_gsm)_p1_1__Im11.jpg",
    gsm: "190 GSM",
    fabric: "Moisture-Wicking Climalite Poly",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Adidas%20100-%20%20Cotton%20Tipping%20Tshirt%20(210%20gsm).pdf",
    pdfName: "Adidas Activewear Catalogue (PDF)",
    colors: ["#94A3B8", "#FFFFFF", "#0F172A", "#16A34A", "#1D4ED8", "#DC2626"]
  },
  {
    id: "prod-5",
    brandId: "us-polo",
    brandName: "US Polo Assn.",
    title: "US Polo Assn. Signature Double Rider Polo",
    category: "Polos",
    image: "/TT%20Luxe/extracted/us_polo_premium_cotton_shirt_p1_1__Im37.jpg",
    gsm: "220 GSM",
    fabric: "Double-Knit Pique Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/US%20POLO%20PREMIUM%20COTTON%20SHIRT.pdf",
    pdfName: "US Polo Premium Shirt Specs (PDF)",
    colors: ["#3B82F6", "#0F172A", "#15803D"]
  },
  {
    id: "prod-6",
    brandId: "us-polo",
    brandName: "US Polo Assn.",
    title: "US Polo Assn. Classic Oxford Shirt",
    category: "Oxford Shirts",
    image: "/TT%20Luxe/extracted/us_polo_premium_cotton_shirt_p2_7__Im45.jpg",
    gsm: "200 GSM",
    fabric: "Fine Woven Oxford Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/US%20POLO%20PREMIUM%20COTTON%20SHIRT.pdf",
    pdfName: "US Polo Full Catalogue (PDF)",
    colors: ["#3B82F6", "#0F172A", "#15803D"]
  },
  {
    id: "prod-7",
    brandId: "monte-carlo",
    brandName: "Monte Carlo",
    title: "Monte Carlo Executive Soft Knit Jacket",
    category: "Jackets",
    image: "/TT%20Luxe/extracted/monte_carlo_jacket__p1_1__Im14.jpg",
    gsm: "320 GSM",
    fabric: "Heavyweight Fleece & Soft Knit Poly-Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Monte%20Carlo%20Jacket-.pdf",
    pdfName: "Monte Carlo Jacket Catalogue (PDF)",
    colors: ["#18181B", "#64748B", "#0F172A"]
  },
  {
    id: "prod-8",
    brandId: "monte-carlo",
    brandName: "Monte Carlo",
    title: "Monte Carlo DryFit Sport Tee",
    category: "Activewear",
    image: "/TT%20Luxe/extracted/monte_carlo_dryfit_tshirt_p3_11__X10.jpg",
    gsm: "180 GSM",
    fabric: "Breathable DryFit Micro-Mesh",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/MONTE%20CARLO%20DRYFIT%20TSHIRT.pdf",
    pdfName: "Monte Carlo DryFit Specs (PDF)",
    colors: ["#881337", "#374151", "#1D4ED8", "#0F172A", "#064E3B"]
  },
  {
    id: "prod-9",
    brandId: "allen-solly",
    brandName: "Allen Solly",
    title: "Allen Solly Premium Crewneck Tee",
    category: "T-Shirts",
    image: "/TT%20Luxe/extracted/allen_solly_tshirts_catalogue_p2_1__Im0.jpg",
    gsm: "220 GSM",
    fabric: "100% Combed Bio-Wash Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/ALLEN-SOLLY_TSHIRTS_CATALOGUE.pdf",
    pdfName: "Allen Solly T-Shirts Catalogue (PDF)",
    colors: ["#FFFFFF", "#18181B", "#1E3A8A", "#94A3B8"]
  },
  {
    id: "prod-10",
    brandId: "adidas",
    brandName: "Adidas",
    title: "Adidas Cotton Tipping Tee",
    category: "T-Shirts",
    image: "/TT%20Luxe/extracted/adidas_100___cotton_tipping_tshirt_(210_gsm)_p2_12__Im54.jpg",
    gsm: "210 GSM",
    fabric: "100% Premium Cotton Knit",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Adidas%20100-%20%20Cotton%20Tipping%20Tshirt%20(210%20gsm).pdf",
    pdfName: "Adidas Tipping Tee Specs (PDF)",
    colors: ["#94A3B8", "#FFFFFF", "#0F172A", "#16A34A", "#1D4ED8", "#DC2626"]
  },
  {
    id: "prod-11",
    brandId: "monte-carlo",
    brandName: "Monte Carlo",
    title: "Monte Carlo Classic Oxford Shirt",
    category: "Oxford Shirts",
    image: "/TT%20Luxe/extracted/monte_carlo_oxford_shirt_p2_4__Im44.jpg",
    gsm: "180 GSM",
    fabric: "Fine Cotton Oxford Weave",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/MONTE%20CARLO%20OXFORD%20SHIRT.pdf",
    pdfName: "Monte Carlo Oxford Shirt Catalogue (PDF)",
    colors: ["#FFFFFF", "#86EFAC"]
  },
  {
    id: "prod-12",
    brandId: "monte-carlo",
    brandName: "Monte Carlo",
    title: "Monte Carlo Poly-Cotton Custom Tee",
    category: "T-Shirts",
    image: "/TT%20Luxe/extracted/monte_carlo_poly_cotton_tshirt_p2_5__Im35.jpg",
    gsm: "200 GSM",
    fabric: "Poly-Cotton Comfort Blend (60:40)",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/MONTE%20CARLO%20POLY%20COTTON%20TSHIRT.pdf",
    pdfName: "Monte Carlo Poly-Cotton Catalogue (PDF)",
    colors: ["#FFFFFF", "#0F172A", "#1D4ED8", "#16A34A", "#18181B", "#BAE6FD"]
  },
  {
    id: "prod-13",
    brandId: "us-polo",
    brandName: "US Polo Assn.",
    title: "US Polo Assn. Premium Pique Polo",
    category: "Polos",
    image: "/TT%20Luxe/extracted/us_polo_premium_cotton_shirt_p3_13__Im53.jpg",
    gsm: "220 GSM",
    fabric: "100% Combed Pique Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/US%20POLO%20PREMIUM%20COTTON%20SHIRT.pdf",
    pdfName: "US Polo Premium Shirt Specs (PDF)",
    colors: ["#3B82F6", "#0F172A", "#15803D"]
  },
  {
    id: "prod-14",
    brandId: "jack-jones",
    brandName: "Jack & Jones",
    title: "Jack & Jones Premium Slim Fit Polo",
    category: "Polos",
    image: "/TT%20Luxe/extracted/jack&jones_veromoda___stock_report_06.03.2026_p31_28__X1.jpg",
    gsm: "220 GSM",
    fabric: "100% Pique Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Jack&Jones_VeroModa%20-%20Stock%20Report%2006.03.2026.pdf",
    pdfName: "Jack & Jones Stock Collection (PDF)",
    colors: ["#0F172A", "#FFFFFF", "#1E3A8A", "#64748B"]
  },
  {
    id: "prod-15",
    brandId: "jack-jones",
    brandName: "Jack & Jones",
    title: "Jack & Jones Comfort Crewneck Tee",
    category: "T-Shirts",
    image: "/TT%20Luxe/extracted/jack&jones_veromoda___stock_report_06.03.2026_p33_30__X1.jpg",
    gsm: "190 GSM",
    fabric: "100% Combed Premium Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Jack&Jones_VeroModa%20-%20Stock%20Report%2006.03.2026.pdf",
    pdfName: "Jack & Jones Classic Catalog (PDF)",
    colors: ["#FFFFFF", "#18181B", "#64748B", "#E5E7EB"]
  },
  {
    id: "prod-16",
    brandId: "being-human",
    brandName: "Being Human",
    title: "Being Human Classic Graphic Tee",
    category: "T-Shirts",
    image: "/TT%20Luxe/extracted/being_human_t_shirt__p11_10__Image61.jpg",
    gsm: "180 GSM",
    fabric: "100% Combed Bio-Wash Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/being%20human%20t%20shirt%20.pdf",
    pdfName: "Being Human Tees Catalogue (PDF)",
    colors: ["#FFFFFF", "#0F172A", "#B91C1C", "#1D4ED8"]
  },
  {
    id: "prod-17",
    brandId: "being-human",
    brandName: "Being Human",
    title: "Being Human Signature Polo",
    category: "Polos",
    image: "/TT%20Luxe/extracted/being_human_t_shirt__p12_11__Image66.jpg",
    gsm: "210 GSM",
    fabric: "Soft Combed Cotton Blend",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/being%20human%20t%20shirt%20.pdf",
    pdfName: "Being Human Signature Catalogue (PDF)",
    colors: ["#1E3A8A", "#FFFFFF", "#15803D", "#475569"]
  },
  {
    id: "prod-18",
    brandId: "benetton",
    brandName: "Benetton",
    title: "Benetton United Colors Crewneck Tee",
    category: "T-Shirts",
    image: "/TT%20Luxe/extracted/benetton_p10_11__Im0.jpg",
    gsm: "190 GSM",
    fabric: "100% Premium Combed Cotton",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Benetton.pdf",
    pdfName: "Benetton Classic Collection (PDF)",
    colors: ["#FFFFFF", "#111827", "#15803D", "#DC2626"]
  },
  {
    id: "prod-19",
    brandId: "benetton",
    brandName: "Benetton",
    title: "Benetton Pique Cotton Polo",
    category: "Polos",
    image: "/TT%20Luxe/extracted/benetton_p12_13__Im0.jpg",
    gsm: "220 GSM",
    fabric: "100% Cotton Pique Knit",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Benetton.pdf",
    pdfName: "Benetton Polo Collection (PDF)",
    colors: ["#FFFFFF", "#1E3A8A", "#064E3B", "#475569"]
  },
  {
    id: "prod-20",
    brandId: "puma",
    brandName: "Puma",
    title: "Puma DryCell Athletic Tee",
    category: "Activewear",
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800",
    gsm: "180 GSM",
    fabric: "Moisture-Wicking DryCell Polyester",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Puma%20MRP%20New%2025%20.pdf",
    pdfName: "Puma Sports Activewear Specs (PDF)",
    colors: ["#18181B", "#FFFFFF", "#E5E7EB", "#1D4ED8"]
  },
  {
    id: "prod-21",
    brandId: "puma",
    brandName: "Puma",
    title: "Puma Training Active Sweatshirt",
    category: "Jackets",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800",
    gsm: "290 GSM",
    fabric: "Poly-Cotton Sports Fleece",
    moq: "10 Pieces",
    pdfPath: "/TT%20Luxe/Puma%20MRP%20New%2025%20.pdf",
    pdfName: "Puma Outerwear Catalogue (PDF)",
    colors: ["#18181B", "#64748B", "#1E3A8A"]
  }
];

const brandFilterList = [
  { id: "all", label: "ALL BRANDS" },
  { id: "allen-solly", label: "ALLEN SOLLY" },
  { id: "adidas", label: "ADIDAS" },
  { id: "us-polo", label: "US POLO ASSN." },
  { id: "monte-carlo", label: "MONTE CARLO" },
  { id: "jack-jones", label: "JACK & JONES" },
  { id: "being-human", label: "BEING HUMAN" },
  { id: "benetton", label: "BENETTON" },
  { id: "puma", label: "PUMA" }
];

const categoryFilterList = ["All Categories", "Polos", "Jackets", "Activewear", "Oxford Shirts", "T-Shirts"];

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
          {/* Branded Catalogue Interactive Filters */}
          <div className={styles.catalogueFilterCard}>
            {/* 1. Brands Row */}
            <div className={styles.filterRow}>
              <span className={styles.filterRowLabel}>Brands:</span>
              <div className={styles.filterPillsGroup}>
                {brandFilterList.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBrand(b.id)}
                    className={`${styles.filterPillCompact} ${selectedBrand === b.id ? styles.filterPillCompactActive : ""}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Categories Row */}
            <div className={styles.filterRow} style={{ marginTop: "16px", borderTop: "1px dashed #e5e7eb", paddingTop: "16px" }}>
              <span className={styles.filterRowLabel}>Categories:</span>
              <div className={styles.filterPillsGroup}>
                {categoryFilterList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`${styles.catTabCompact} ${selectedCategory === cat ? styles.catTabCompactActive : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Counter */}
          <div className={styles.resultsHeader}>
            <div className={styles.resultsCount} style={{ fontSize: "0.9rem", color: "#4b5563" }}>
              Showing <strong>{filteredProducts.length}</strong> Official Products {selectedBrand !== "all" && `for ${brandFilterList.find(b => b.id === selectedBrand)?.label}`} {selectedCategory !== "All Categories" && `in ${selectedCategory}`}
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
