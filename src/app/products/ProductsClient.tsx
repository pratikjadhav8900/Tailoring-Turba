"use client";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { useState, useEffect, useMemo } from "react";
import { getResizedCloudinaryUrl } from "@/lib/cloudinary-client";
import {
  Plus,
  Minus,
  ArrowRightLeft,
  Check,
  Heart,
  Search,
  SlidersHorizontal,
  PackageSearch,
  Star,
  X,
  Eye,
  Send,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getProductColors } from "@/lib/customizer-utils";
import {
  deriveProductType,
  deriveGender,
  deriveQualityTier,
  ALL_PRODUCT_TYPES,
  QUALITY_TIERS,
  FITS
} from "@/lib/catalog-config";

const faqs = [
  { q: "Who is the best custom apparel manufacturer?", a: "Tailoring Turba is one of the top manufacturers, offering premium quality bases and customizable options for businesses, brands, and bulk buyers." },
  { q: "Do you offer blank apparel for bulk orders?", a: "Yes, we provide high-quality blank apparel at competitive wholesale prices with no minimum order requirements on standard catalogue items." },
  { q: "Can I get bulk items at wholesale prices?", a: "Absolutely. Our entire catalogue is structured for B2B wholesale pricing, allowing significant margins for your private label." },
  { q: "Do you manufacture collar t-shirts and polos?", a: "Yes, we specialize in premium polos and collar t-shirts made from 100% combed cotton and moisture-wicking blends." },
  { q: "Can you help design custom company apparel?", a: "Yes, our in-house design team can help you map out your corporate identity across our entire product range." },
  { q: "Are your garments made from cotton?", a: "We offer 100% French Terry Cotton, 100% Premium Cotton, and Sustainable Cotton-Poly blends depending on the product line." },
];

const seoBlocks = [
  { title: "Best Custom, Blank, Plain and Printed Apparel Manufacturer", content: "Discover the best-rated manufacturer for custom, blank, plain, and printed apparel—where quality meets creativity. Whether you need vibrant prints, minimalist styles, or premium blanks, our products are crafted with precision for comfort, durability, and style. Ideal for fashion labels, events, or casual wear, our cutting-edge printing technology and fabric selection ensure a perfect fit every time." },
  { title: "Bulk or Private Label Apparel Supplier and Manufacturer", content: "Scale your brand effortlessly with the best bulk and private label apparel supplier. Specializing in custom cuts, labeling, and high-volume production, we provide everything you need to launch or grow your apparel line. Our streamlined process, high-grade fabrics, and quality control make us a trusted partner for fashion startups and established labels alike." },
  { title: "Corporate and Promotion Apparel Supplier and Manufacturer", content: "Elevate your brand visibility with the top-rated corporate and promotional apparel manufacturer. Designed for comfort and built for branding, our apparel makes every employee, event, or campaign stand out. From logo printing to custom color matching, we provide end-to-end solutions for businesses seeking premium promotional apparel with a professional edge." },
  { title: "Cotton and Polyester Apparel Supplier and Manufacturer", content: "Experience the perfect blend of comfort and performance with our premium cotton and polyester apparel. As a leading supplier and manufacturer, we offer versatile fabric options that suit every need—from breathable cotton classics to moisture-wicking poly blends. Ideal for casual wear, uniforms, or retail, each piece is crafted for long-lasting wear and exceptional comfort." },
];

// ─── Gender config ───────────────────────────────────────────
type Gender = "Men" | "Women" | "Kids";

const GENDER_CONFIG: Record<Gender, {
  label: string;
  hero: string;
  heroTitle: string;
  categories: string[];
}> = {
  Men: {
    label: "Men",
    hero: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1920&q=80",
    heroTitle: "Men's Catalogue",
    categories: ["All", "T-Shirts", "Shirts", "Trousers", "Polos", "Crewnecks", "Hoodies", "Jackets", "Oversized", "Uniforms"],
  },
  Women: {
    label: "Women",
    hero: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80",
    heroTitle: "Women's Catalogue",
    categories: ["All", "Tops", "Kurtis", "Dresses", "Leggings", "Crop Tops", "Hoodies", "Jackets", "Oversized", "Uniforms"],
  },
  Kids: {
    label: "Kids",
    hero: "https://images.unsplash.com/photo-1471286174890-9c112ac6823d?w=1920&q=80",
    heroTitle: "Kids' Catalogue",
    categories: ["All", "T-Shirts", "Shirts", "Shorts", "Polos", "Hoodies", "Uniforms", "Sets"],
  },
};

const SORT_OPTIONS = [
  { value: "default", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

const PRICE_RANGES = [
  { id: "all", label: "All Prices" },
  { id: "under200", label: "Under ₹200" },
  { id: "200-350", label: "₹200 – ₹350" },
  { id: "350-500", label: "₹350 – ₹500" },
  { id: "above500", label: "Above ₹500" },
];

const COLOR_OPTIONS = [
  { label: "All Colors", hex: "all" },
  { label: "Black", hex: "#111111" },
  { label: "White", hex: "#FFFFFF" },
  { label: "Navy Blue", hex: "#1E3A5F" },
  { label: "Olive Green", hex: "#4D7C0F" },
  { label: "Red / Maroon", hex: "#7F1D1D" },
  { label: "Grey", hex: "#9CA3AF" },
  { label: "Royal Blue", hex: "#2563EB" },
  { label: "Yellow / Gold", hex: "#D97706" },
];

const COLOR_MAP: Record<string, string[]> = {
  "#111111": ["#111111", "#272228", "#13191E"], // Black
  "#FFFFFF": ["#FFFFFF", "#F8FAFC"], // White
  "#1E3A5F": ["#1E3A5F", "#222433", "#194057", "#3756AE"], // Navy Blue / Ocean Blue
  "#4D7C0F": ["#4D7C0F", "#16A34A", "#3E5552"], // Olive Green / Forest Green / Sea Green
  "#7F1D1D": ["#7F1D1D", "#DC2626", "#662028", "#6C1820", "#F73D30"], // Red / Maroon / Orange
  "#9CA3AF": ["#9CA3AF", "#64748B"], // Grey
  "#2563EB": ["#2563EB", "#004b6b", "#38BDF8", "#3756AE"], // Royal / Turba / Sky Blue
  "#D97706": ["#D97706", "#FFEC6F"], // Yellow / Gold
};

const GSM_RANGES = [
  { id: "all", label: "All Fabric Weights" },
  { id: "light", label: "Light (< 180 GSM)" },
  { id: "standard", label: "Standard (180 – 220 GSM)" },
  { id: "heavy", label: "Heavy (220 – 280 GSM)" },
  { id: "fleece", label: "Fleece / Winter (280+ GSM)" },
];

function getGsmValue(p: any): number | null {
  if (p.gsm) return Number(p.gsm);
  const text = `${p.type || ""} ${p.description || ""} ${(p.features || []).join(" ")}`;
  const match = text.match(/(\d{3})\s*gsm/i);
  return match ? parseInt(match[1], 10) : null;
}

const BRAND_BANNERS: Record<string, { title: string; subtitle: string; logoText: string; bgGradient: string }> = {
  adidas: {
    title: "Official Adidas Sourcing Collection",
    subtitle: "High-performance tipping polos, cotton t-shirts, and activewear engineered for excellence.",
    logoText: "ADIDAS",
    bgGradient: "linear-gradient(135deg, #111111 0%, #222222 100%)"
  },
  "allen-solly": {
    title: "Official Allen Solly Sourcing Collection",
    subtitle: "Sophisticated corporate apparel, casual collared shirts, and Friday dressing options.",
    logoText: "ALLEN SOLLY",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
  },
  "monte-carlo": {
    title: "Official Monte Carlo Sourcing Collection",
    subtitle: "Premium winter jackets, fleece hoodies, and luxury knitwear tailored for peak comfort.",
    logoText: "MONTE CARLO",
    bgGradient: "linear-gradient(135deg, #1c1917 0%, #292524 100%)"
  },
  "us-polo": {
    title: "Official US Polo Assn. Sourcing Collection",
    subtitle: "Timeless heritage sportswear, pique polos, and premium woven cotton button-down shirts.",
    logoText: "US POLO ASSN.",
    bgGradient: "linear-gradient(135deg, #1a1610 0%, #2a2215 100%)"
  }
};

export default function ProductsClient({ products }: { products: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919022553346";

  const urlCategory = searchParams.get("category");
  const urlGender = searchParams.get("gender") as Gender | null;
  const urlProductType = searchParams.get("productType") || searchParams.get("type");
  const activeBrand = searchParams.get("brand");

  const [activeGender, setActiveGender] = useState<Gender>(
    urlGender && GENDER_CONFIG[urlGender] ? urlGender : "Men"
  );
  const [activeCategories, setActiveCategories] = useState<string[]>(["All"]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(
    urlProductType ? [urlProductType] : ["All"]
  );
  const [selectedQualityTier, setSelectedQualityTier] = useState<string>("all");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [gsmRange, setGsmRange] = useState("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showSort, setShowSort] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync URL params on mount
  useEffect(() => {
    if (urlCategory) setActiveCategories([urlCategory]);
    if (urlGender && GENDER_CONFIG[urlGender]) setActiveGender(urlGender);
    if (urlProductType) setSelectedProductTypes([urlProductType]);
  }, [urlCategory, urlGender, urlProductType]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // When gender changes, reset category
  const handleGenderSwitch = (gender: Gender) => {
    setActiveGender(gender);
    setActiveCategories(["All"]);
    setSelectedProductTypes(["All"]);
    setSelectedQualityTier("all");
    setSearchTerm("");
    setPriceRange("all");
    setSelectedColor("all");
    setGsmRange("all");
  };

  const handleClearFilters = () => {
    setActiveCategories(["All"]);
    setSelectedProductTypes(["All"]);
    setSelectedQualityTier("all");
    setPriceRange("all");
    setSelectedColor("all");
    setGsmRange("all");
    setSearchTerm("");
    if (activeBrand) {
      router.push("/products");
    }
  };

  const handleCategoryClick = (c: string) => {
    if (c === "All") {
      setActiveCategories(["All"]);
    } else {
      setActiveCategories((prev) => {
        const filteredPrev = prev.filter((item) => item !== "All");
        if (filteredPrev.includes(c)) {
          const updated = filteredPrev.filter((item) => item !== c);
          return updated.length === 0 ? ["All"] : updated;
        } else {
          return [...filteredPrev, c];
        }
      });
    }
  };

  const handleProductTypeClick = (pt: string) => {
    if (pt === "All") {
      setSelectedProductTypes(["All"]);
    } else {
      setSelectedProductTypes((prev) => {
        const filteredPrev = prev.filter((item) => item !== "All");
        if (filteredPrev.includes(pt)) {
          const updated = filteredPrev.filter((item) => item !== pt);
          return updated.length === 0 ? ["All"] : updated;
        } else {
          return [...filteredPrev, pt];
        }
      });
    }
  };

  const hasActiveFilters = 
    !activeCategories.includes("All") || 
    !selectedProductTypes.includes("All") ||
    selectedQualityTier !== "all" ||
    priceRange !== "all" || 
    selectedColor !== "all" || 
    gsmRange !== "all" || 
    debouncedSearch !== "" || 
    !!activeBrand;

  const genderConfig = GENDER_CONFIG[activeGender];
  const categories = genderConfig.categories;

  // Filter + sort with strict AND matching
  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      // 1. Gender Match
      const productGender: string = p.gender || deriveGender(p);
      const matchesGender =
        activeGender === "Men"
          ? productGender === "Men" || productGender === "Unisex" || !p.gender
          : productGender === activeGender || productGender === "Unisex";

      // 2. Product Type Match
      const productType = (p.productType || deriveProductType(p)).toLowerCase();
      let matchesProductType = selectedProductTypes.includes("All") || selectedProductTypes.length === 0;
      if (!matchesProductType) {
        matchesProductType = selectedProductTypes.some(pt => {
          const normPt = pt.toLowerCase().trim();
          return productType.includes(normPt) || 
            (p.name && p.name.toLowerCase().includes(normPt)) ||
            (p.type && p.type.toLowerCase().includes(normPt));
        });
      }

      // 3. Quality Tier Match
      const quality = (p.qualityTier || deriveQualityTier(p)).toLowerCase();
      let matchesQuality = selectedQualityTier === "all";
      if (!matchesQuality) {
        matchesQuality = quality === selectedQualityTier.toLowerCase();
      }

      // 4. Category Match
      const matchesCategory =
        activeCategories.includes("All") ||
        activeCategories.length === 0 ||
        activeCategories.some((cat) => {
          const normalized = cat.toLowerCase().replace(/s$/, "");
          return (
            p.category === cat ||
            (p.category && p.category.toLowerCase().includes(normalized)) ||
            (p.type && p.type.toLowerCase().includes(normalized)) ||
            (p.name && p.name.toLowerCase().includes(normalized))
          );
        });

      // 5. Price Match
      const price = Number(p.price || p.basePrice || 0);
      let matchesPrice = true;
      if (priceRange === "under200") matchesPrice = price < 200;
      else if (priceRange === "200-350") matchesPrice = price >= 200 && price <= 350;
      else if (priceRange === "350-500") matchesPrice = price >= 350 && price <= 500;
      else if (priceRange === "above500") matchesPrice = price > 500;

      // 6. Color Match
      let matchesColor = true;
      if (selectedColor !== "all") {
        const productColors = getProductColors(p.name, p.description, p.features, p.colors);
        const allowedColors = COLOR_MAP[selectedColor] || [selectedColor];
        
        // Also check colorsJson hex codes if present
        let jsonHexes: string[] = [];
        if (p.colorsJson) {
          const cArray = Array.isArray(p.colorsJson) ? p.colorsJson : (typeof p.colorsJson === 'string' ? JSON.parse(p.colorsJson) : []);
          jsonHexes = cArray.map((cj: any) => cj.hex || cj.value).filter(Boolean);
        }

        matchesColor = productColors.some((prodColor) =>
          allowedColors.some((allowed) => allowed.toLowerCase() === prodColor.toLowerCase())
        ) || jsonHexes.some(h => allowedColors.some(a => a.toLowerCase() === h.toLowerCase()));
      }

      // 7. GSM Match
      let matchesGsm = true;
      if (gsmRange !== "all") {
        const gsm = getGsmValue(p);
        if (gsm !== null) {
          if (gsmRange === "light") matchesGsm = gsm < 180;
          else if (gsmRange === "standard") matchesGsm = gsm >= 180 && gsm <= 220;
          else if (gsmRange === "heavy") matchesGsm = gsm > 220 && gsm <= 280;
          else if (gsmRange === "fleece") matchesGsm = gsm > 280;
        } else {
          matchesGsm = false;
        }
      }

      // 8. Search Match
      const searchLower = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        searchLower === "" ||
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.productType && p.productType.toLowerCase().includes(searchLower)) ||
        (p.type && p.type.toLowerCase().includes(searchLower)) ||
        (p.fabric && p.fabric.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.toLowerCase().includes(searchLower)) ||
        (p.sku && p.sku.toLowerCase().includes(searchLower)) ||
        (p.slug && p.slug.toLowerCase().includes(searchLower));

      // 9. Brand Match
      let matchesBrand = true;
      if (activeBrand) {
        matchesBrand = p.brand?.toLowerCase() === activeBrand.toLowerCase();
      }

      return (
        matchesGender &&
        matchesProductType &&
        matchesQuality &&
        matchesCategory &&
        matchesPrice &&
        matchesColor &&
        matchesGsm &&
        matchesSearch &&
        matchesBrand
      );
    });

    // Sort
    if (sortBy === "price_asc") result = [...result].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortBy === "price_desc") result = [...result].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sortBy === "newest") result = [...result].reverse();

    return result;
  }, [
    products,
    activeGender,
    selectedProductTypes,
    selectedQualityTier,
    activeCategories,
    priceRange,
    selectedColor,
    gsmRange,
    debouncedSearch,
    sortBy,
    activeBrand
  ]);

  return (
    <>
      <main className={styles.main}>

        {/* ── Hero ── */}
        <section
          className={styles.hero}
          style={{ backgroundImage: `url('${genderConfig.hero}')` }}
        >
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{genderConfig.heroTitle}</h1>
          </div>

          {/* ── Gender Tab Switcher (inside hero, bottom) ── */}
          <div className={styles.genderTabs}>
            {(Object.keys(GENDER_CONFIG) as Gender[]).map((g) => (
              <button
                key={g}
                className={`${styles.genderTab} ${activeGender === g ? styles.genderTabActive : ""}`}
                onClick={() => handleGenderSwitch(g)}
              >
                <span className={styles.genderLabel}>{GENDER_CONFIG[g].label}</span>
                {activeGender === g && <span className={styles.genderUnderline} />}
              </button>
            ))}
          </div>
        </section>

        {/* ── Main Layout ── */}
        <section className={`container ${styles.layout}`}>

          {isFilterOpen && <div className={styles.drawerBackdrop} onClick={() => setIsFilterOpen(false)} />}

          {/* ── Sidebar ── */}
          <aside className={`${styles.sidebar} ${isFilterOpen ? styles.sidebarOpen : ""}`}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarHeading}>FILTERS</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {hasActiveFilters && (
                  <button className={styles.clearFiltersBtn} onClick={handleClearFilters}>
                    <RotateCcw size={12} /> CLEAR ALL
                  </button>
                )}
                <button className={styles.closeDrawerBtn} onClick={() => setIsFilterOpen(false)} type="button">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={15} />
              <input
                type="text"
                placeholder="Search styles, fabrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button className={styles.clearSearchIcon} onClick={() => setSearchTerm("")}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Product Type Filter */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionTitle}>PRODUCT TYPE</div>
              <div className={`${styles.categoryList} ${styles.categoryListScrollable}`}>
                {["All", "Polo", "Crewneck", "Hoodie", "T-Shirt", "Shirt", "Trouser", "Jacket", "Sweatshirt", "Lab Coat"].map((pt) => {
                  const isChecked = selectedProductTypes.includes(pt);
                  const count = pt === "All"
                    ? products.filter(p => activeGender === "Men" ? (!p.gender || p.gender === "Men" || p.gender === "Unisex") : (p.gender === activeGender || p.gender === "Unisex")).length
                    : products.filter(p => {
                        const productType = (p.productType || deriveProductType(p)).toLowerCase();
                        const normPt = pt.toLowerCase().trim();
                        const pGender = p.gender || deriveGender(p);
                        const matchGen = activeGender === "Men" ? (!p.gender || pGender === "Men" || pGender === "Unisex") : (pGender === activeGender || pGender === "Unisex");
                        return matchGen && (productType.includes(normPt) || (p.name && p.name.toLowerCase().includes(normPt)));
                      }).length;

                  return (
                    <button
                      key={pt}
                      className={`${styles.filterBtn} ${isChecked ? styles.filterActive : ""}`}
                      onClick={() => handleProductTypeClick(pt)}
                    >
                      <div className={styles.checkboxLabel}>
                        <span className={`${styles.customCheckbox} ${isChecked ? styles.checkboxChecked : ""}`}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span>{pt}</span>
                      </div>
                      <span className={styles.filterCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality Tier Filter */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionTitle}>QUALITY TIER</div>
              <div className={styles.priceList}>
                {[
                  { id: "all", label: "All Tiers" },
                  { id: "Basic", label: "Basic / Value" },
                  { id: "Standard", label: "Standard Commercial" },
                  { id: "Premium", label: "Premium (PIMA / Combed)" },
                  { id: "Luxury", label: "Luxury / TT Luxe" }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    className={`${styles.priceFilterBtn} ${selectedQualityTier === tier.id ? styles.priceFilterActive : ""}`}
                    onClick={() => setSelectedQualityTier(tier.id)}
                  >
                    <span className={`${styles.customRadio} ${selectedQualityTier === tier.id ? styles.radioChecked : ""}`} />
                    <span>{tier.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categories Accordion */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionTitle}>CATEGORIES</div>
              <div className={`${styles.categoryList} ${categories.length >= 10 ? styles.categoryListScrollable : ""}`}>
                {categories.map((c) => {
                  const count = c === "All"
                    ? products.filter(p => activeGender === "Men" ? (!p.gender || p.gender === "Men") : p.gender === activeGender).length
                    : products.filter(p => {
                        const norm = c.toLowerCase().replace(/s$/, "");
                        const pGender = p.gender || "Men";
                        const matchGen = activeGender === "Men" ? (!p.gender || pGender === "Men") : pGender === activeGender;
                        return matchGen && (
                          p.category === c ||
                          (p.category && p.category.toLowerCase().includes(norm)) ||
                          (p.type && p.type.toLowerCase().includes(norm)) ||
                          (p.name && p.name.toLowerCase().includes(norm))
                        );
                      }).length;

                  const isChecked = activeCategories.includes(c);

                  return (
                    <button
                      key={c}
                      className={`${styles.filterBtn} ${isChecked ? styles.filterActive : ""}`}
                      onClick={() => handleCategoryClick(c)}
                    >
                      <div className={styles.checkboxLabel}>
                        <span className={`${styles.customCheckbox} ${isChecked ? styles.checkboxChecked : ""}`}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span>{c}</span>
                      </div>
                      <span className={styles.filterCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionTitle}>PRICE RANGE</div>
              <div className={styles.priceList}>
                {PRICE_RANGES.map((pr) => (
                  <button
                    key={pr.id}
                    className={`${styles.priceFilterBtn} ${priceRange === pr.id ? styles.priceFilterActive : ""}`}
                    onClick={() => setPriceRange(pr.id)}
                  >
                    <span className={`${styles.customRadio} ${priceRange === pr.id ? styles.radioChecked : ""}`} />
                    <span>{pr.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fabric Weight (GSM) Filter */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionTitle}>FABRIC WEIGHT (GSM)</div>
              <div className={styles.priceList}>
                {GSM_RANGES.map((gr) => (
                  <button
                    key={gr.id}
                    className={`${styles.priceFilterBtn} ${gsmRange === gr.id ? styles.priceFilterActive : ""}`}
                    onClick={() => setGsmRange(gr.id)}
                  >
                    <span className={`${styles.customRadio} ${gsmRange === gr.id ? styles.radioChecked : ""}`} />
                    <span>{gr.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette Filter */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionTitle}>COLOR PALETTE</div>
              <div className={styles.colorGrid}>
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col.label}
                    className={`${styles.colorDotBtn} ${selectedColor === col.hex ? styles.colorDotActive : ""}`}
                    onClick={() => setSelectedColor(col.hex)}
                    title={col.label}
                  >
                    {col.hex === "all" ? (
                      <span className={styles.colorAllPill}>ALL</span>
                    ) : (
                      <span
                        className={styles.colorSwatchDot}
                        style={{ backgroundColor: col.hex, border: col.hex === "#FFFFFF" ? "1px solid #cbd5e1" : "none" }}
                      >
                        {selectedColor === col.hex && (
                          <Check size={12} color={col.hex === "#FFFFFF" ? "#000" : "#fff"} strokeWidth={3} />
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sidebarSpacer} />

            {/* Mobile Done Button */}
            <div className={styles.mobileDoneWrapper}>
              <button
                className={styles.mobileDoneBtn}
                onClick={() => setIsFilterOpen(false)}
                type="button"
              >
                Done ✓
              </button>
            </div>
          </aside>

          {/* ── Product Area ── */}
          <div className={styles.productContentArea}>

            {/* Luxe Brand Banner */}
            {activeBrand && BRAND_BANNERS[activeBrand.toLowerCase()] && (
              <div 
                style={{ 
                  background: BRAND_BANNERS[activeBrand.toLowerCase()].bgGradient,
                  border: "1px solid rgba(212, 175, 55, 0.35)",
                  borderRadius: "12px",
                  padding: "32px",
                  marginBottom: "24px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                }}
              >
                <div style={{ position: "absolute", top: "-10px", right: "-10px", opacity: 0.05, fontSize: "8rem", fontWeight: 900, color: "#fff", pointerEvents: "none", fontFamily: "var(--font-ui)" }}>
                  LUXE
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <Star size={12} fill="#D4AF37" color="#D4AF37" />
                  TT LUXE COLLECTION
                </span>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", marginBottom: "8px", letterSpacing: "-0.025em", fontFamily: "var(--font-ui)" }}>
                  {BRAND_BANNERS[activeBrand.toLowerCase()].title}
                </h1>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem", maxWidth: "700px", lineHeight: 1.5 }}>
                  {BRAND_BANNERS[activeBrand.toLowerCase()].subtitle}
                </p>
              </div>
            )}

            {/* Breadcrumb & Toolbar Header */}
            <div className={styles.toolbarHeader}>
              <div className={styles.breadcrumbPath}>
                <span className={styles.breadcrumbHomePath}>Home / Products / </span>
                <strong className={styles.breadcrumbCurrent}>{activeGender}'s Catalogue</strong>
                <span className={styles.breadcrumbCounter}>({filtered.length} Items)</span>
              </div>

              <div className={styles.toolbarRight} style={{ display: "flex", gap: "10px" }}>
                <button
                  className={styles.mobileFilterBtn}
                  onClick={() => setIsFilterOpen(true)}
                  type="button"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <span className={styles.activeFiltersIndicator} />
                  )}
                </button>

                <div className={styles.sortWrapper}>
                  <button
                    className={styles.sortBtn}
                    onClick={() => setShowSort((v) => !v)}
                  >
                    <span className={styles.sortLabelText}>Sort by : <strong>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Recommended"}</strong></span>
                    <ChevronDown size={14} className={`${styles.sortChevron} ${showSort ? styles.sortChevronRotate : ""}`} />
                  </button>
                  {showSort && (
                    <div className={styles.sortDropdown}>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          className={`${styles.sortOption} ${sortBy === opt.value ? styles.sortOptionActive : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSortBy(opt.value);
                            // Delay hiding the dropdown slightly on mobile to prevent click-through (ghost click)
                            // to underlying elements.
                            setTimeout(() => {
                              setShowSort(false);
                            }, 100);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {hasActiveFilters && (
              <div className={styles.activePillsBar}>
                <span className={styles.activePillLabel}>Active Filters:</span>
                {activeBrand && (
                  <span className={styles.filterPill} style={{ background: "rgba(212, 175, 55, 0.12)", border: "1px solid rgba(212, 175, 55, 0.3)", color: "#b8941f" }}>
                    Brand: {activeBrand}
                    <X size={12} className={styles.removePillIcon} onClick={() => router.push("/products")} />
                  </span>
                )}
                {!activeCategories.includes("All") && activeCategories.map((cat) => (
                  <span key={cat} className={styles.filterPill}>
                    Category: {cat}
                    <X
                      size={12}
                      className={styles.removePillIcon}
                      onClick={() => {
                        setActiveCategories((prev) => {
                          const updated = prev.filter((item) => item !== cat);
                          return updated.length === 0 ? ["All"] : updated;
                        });
                      }}
                    />
                  </span>
                ))}
                {priceRange !== "all" && (
                  <span className={styles.filterPill}>
                    Price: {PRICE_RANGES.find(p => p.id === priceRange)?.label}
                    <X size={12} className={styles.removePillIcon} onClick={() => setPriceRange("all")} />
                  </span>
                )}
                {gsmRange !== "all" && (
                  <span className={styles.filterPill}>
                    GSM: {GSM_RANGES.find(g => g.id === gsmRange)?.label}
                    <X size={12} className={styles.removePillIcon} onClick={() => setGsmRange("all")} />
                  </span>
                )}
                {selectedColor !== "all" && (
                  <span className={styles.filterPill}>
                    Color: {COLOR_OPTIONS.find(c => c.hex === selectedColor)?.label || "Selected"}
                    <X size={12} className={styles.removePillIcon} onClick={() => setSelectedColor("all")} />
                  </span>
                )}
                {debouncedSearch && (
                  <span className={styles.filterPill}>
                    "{debouncedSearch}"
                    <X size={12} className={styles.removePillIcon} onClick={() => setSearchTerm("")} />
                  </span>
                )}
                <button className={styles.clearAllPillBtn} onClick={handleClearFilters}>
                  Clear All
                </button>
              </div>
            )}

            {/* Product Grid */}
            <div className={styles.myntraGrid}>
              {filtered.map((p) => {
                const price = Number(p.price || 199);
                const mrp = Math.round(price * 1.55);
                const discount = Math.round(((mrp - price) / mrp) * 100);
                
                // Get stable number from ID (handles both numeric and CUID/string IDs)
                const getStableIdNumber = (id: string) => {
                  const num = Number(id);
                  if (!isNaN(num)) return num;
                  let hash = 0;
                  for (let i = 0; i < id.length; i++) {
                    hash = (hash << 5) - hash + id.charCodeAt(i);
                    hash |= 0;
                  }
                  return Math.abs(hash);
                };
                const idNum = getStableIdNumber(p.id);
                const rating = (4.1 + ((idNum * 7) % 8) / 10).toFixed(1);
                const ratingCount = 15 + ((idNum * 13) % 70);

                const hasGallerySecond = Array.isArray(p.gallery) && p.gallery.length > 1;
                const isHovered = hoveredCardId === p.id;
                const imageSrc = isHovered && hasGallerySecond ? p.gallery[1] : (p.image || p.gallery?.[0] || "");

                const gsmVal = getGsmValue(p);

                return (
                  <div
                    key={p.id}
                    className={styles.productCard}
                    onMouseEnter={() => setHoveredCardId(p.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    onClick={() => router.push(`/products/${p.slug || p.id}`)}
                  >
                    {/* Aspect Ratio 3:4 Image Container */}
                    <div className={styles.imageWrapper}>
                      {imageSrc ? (
                        <Image
                          src={getResizedCloudinaryUrl(imageSrc, 600, 800)}
                          alt={p.name}
                          fill
                          className={styles.cardImage}
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <div className={styles.noImage}>No Image</div>
                      )}

                      {/* Top-Left B2B Badge / MOQ */}
                      <span className={styles.b2bBadge}>
                        {p.badge || "MOQ 10 Pcs"}
                      </span>

                      {/* Top-Right Wishlist Heart Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(p);
                        }}
                        className={`${styles.wishlistBtn} ${isInWishlist(p.id) ? styles.wishlistActive : ""}`}
                        title={isInWishlist(p.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart size={16} fill={isInWishlist(p.id) ? "#ef4444" : "none"} color={isInWishlist(p.id) ? "#ef4444" : "#475569"} />
                      </button>

                      {/* Bottom-Left Rating Pill */}
                      <div className={styles.ratingBadge}>
                        <span>{rating}</span>
                        <Star size={10} fill="#10b981" color="#10b981" />
                        <span className={styles.ratingDivider}>|</span>
                        <span className={styles.ratingCount}>{ratingCount}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className={styles.cardContent}>
                      <div className={styles.brandName}>TAILORING TURBA</div>
                      <h3 className={styles.productName}>{p.name}</h3>
                      <div className={styles.productTypeRow}>
                        <p className={styles.productType}>{p.type || p.category}</p>
                        {gsmVal && <span className={styles.gsmTag}>{gsmVal} GSM</span>}
                      </div>

                      {/* Price Row */}
                      <div className={styles.priceRow}>
                        <span className={styles.currentPrice}>₹{price.toLocaleString("en-IN")}</span>
                        <del className={styles.originalPrice}>₹{mrp.toLocaleString("en-IN")}</del>
                        <span className={styles.discountTag}>({discount}% OFF)</span>
                      </div>
                    </div>
                  </div>

                );
              })}

              {filtered.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <PackageSearch size={48} strokeWidth={1.5} />
                  </div>
                  <h3 className={styles.emptyTitle}>
                    No {activeGender}'s products found
                  </h3>
                  <p className={styles.emptyDesc}>
                    {debouncedSearch
                      ? `Nothing matching "${debouncedSearch}" in ${activeGender}'s catalogue.`
                      : `No products match the selected filters — try resetting your selection!`}
                  </p>
                  <button
                    className={styles.emptyReset}
                    onClick={handleClearFilters}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faqSection}>
          {faqs.map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <div className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>Q{i + 1}: {faq.q}</span>
                {openFaq === i ? <Minus size={20} className={styles.faqIcon} /> : <Plus size={20} className={styles.faqIcon} />}
              </div>
              {openFaq === i && <div className={styles.faqAnswer}>A: {faq.a}</div>}
            </div>
          ))}
        </section>

        {/* SEO blocks */}
        <section className={styles.seoSection}>
          <div className={`container ${styles.seoGrid}`}>
            {seoBlocks.map((block, i) => (
              <div key={i} className={styles.seoBlock}>
                <h3>{block.title}</h3>
                <p>{block.content}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
