"use client";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { useState, useEffect, useMemo } from "react";
import { Plus, Minus, ArrowRightLeft, Check, Heart, Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { useWishlist } from "@/context/WishlistContext";

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
  { value: "default", label: "Featured" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest First" },
];

export default function ProductsClient({ products }: { products: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();

  const urlCategory = searchParams.get("category");
  const urlGender = searchParams.get("gender") as Gender | null;

  const [activeGender, setActiveGender] = useState<Gender>(
    urlGender && GENDER_CONFIG[urlGender] ? urlGender : "Men"
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showSort, setShowSort] = useState(false);

  // Sync URL params on mount
  useEffect(() => {
    if (urlCategory) setActiveCategory(urlCategory);
    if (urlGender && GENDER_CONFIG[urlGender]) setActiveGender(urlGender);
  }, [urlCategory, urlGender]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // When gender changes, reset category
  const handleGenderSwitch = (gender: Gender) => {
    setActiveGender(gender);
    setActiveCategory("All");
    setSearchTerm("");
  };

  const genderConfig = GENDER_CONFIG[activeGender];
  const categories = genderConfig.categories;

  // Filter + sort
  const filtered = useMemo(() => {
    const normalizedCategory = activeCategory.toLowerCase().replace(/s$/, "");

    let result = products.filter((p) => {
      // Gender match — if product has a gender field use it, else show in Men (default)
      const productGender: string = p.gender || "Men";
      const matchesGender =
        activeGender === "Men"
          ? productGender === "Men" || !p.gender
          : productGender === activeGender;

      // Category match
      const isTshirtUmbrella =
        activeCategory === "T-Shirts" &&
        (p.type?.toLowerCase().includes("polo") ||
          p.type?.toLowerCase().includes("crewneck") ||
          p.type?.toLowerCase().includes("v-neck") ||
          p.name?.toLowerCase().includes("polo") ||
          p.name?.toLowerCase().includes("crewneck"));

      const matchesCategory =
        activeCategory === "All" ||
        p.category === activeCategory ||
        isTshirtUmbrella ||
        (p.category && p.category.toLowerCase().includes(normalizedCategory)) ||
        (p.type && p.type.toLowerCase().includes(normalizedCategory)) ||
        (p.name && p.name.toLowerCase().includes(normalizedCategory)) ||
        (p.category && p.category.toLowerCase().includes(activeCategory.toLowerCase())) ||
        (p.type && p.type.toLowerCase().includes(activeCategory.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(activeCategory.toLowerCase()));

      // Search match
      const searchLower = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        searchLower === "" ||
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.type && p.type.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.toLowerCase().includes(searchLower));

      return matchesGender && matchesCategory && matchesSearch;
    });

    // Sort
    if (sortBy === "price_asc") result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === "price_desc") result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sortBy === "newest") result = [...result].reverse();

    return result;
  }, [products, activeGender, activeCategory, debouncedSearch, sortBy]);

  const mockColors = ["#1a1a1a", "#ffffff", "#1e3a8a", "#6b7d60", "#7f1d1d"];

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

          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder="Search catalogue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <p className={styles.sidebarHeading}>Categories</p>

            {categories.map((c) => {
              const count = c === "All"
                ? products.filter(p => activeGender === "Men" ? (!p.gender || p.gender === "Men") : p.gender === activeGender).length
                : filtered.filter(p => {
                    if (c === "All") return true;
                    const norm = c.toLowerCase().replace(/s$/, "");
                    return (
                      p.category === c ||
                      (p.category && p.category.toLowerCase().includes(norm)) ||
                      (p.type && p.type.toLowerCase().includes(norm)) ||
                      (p.name && p.name.toLowerCase().includes(norm))
                    );
                  }).length;

              return (
                <button
                  key={c}
                  className={`${styles.filterBtn} ${activeCategory === c ? styles.filterActive : ""}`}
                  onClick={() => setActiveCategory(c)}
                >
                  <span>{c}</span>
                  <span className={styles.filterCount}>{count}</span>
                </button>
              );
            })}
          </aside>

          {/* ── Product Area ── */}
          <div>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <p className={styles.toolbarCount}>
                <strong>{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""} found
                {activeCategory !== "All" && <span className={styles.toolbarCategory}> in {activeCategory}</span>}
              </p>
              <div className={styles.sortWrapper}>
                <button
                  className={styles.sortBtn}
                  onClick={() => setShowSort((v) => !v)}
                >
                  <SlidersHorizontal size={15} />
                  <span>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Featured"}</span>
                </button>
                {showSort && (
                  <div className={styles.sortDropdown}>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.sortOption} ${sortBy === opt.value ? styles.sortOptionActive : ""}`}
                        onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              {filtered.map((p) => {
                const sizes =
                  p.features?.find((f: string) =>
                    f.match(/^[XSML\d]+[–-][XSML\d]+$/i) ||
                    f.toLowerCase().includes("size") ||
                    f.toLowerCase().includes("xs") ||
                    f.toLowerCase().includes("xl")
                  ) || "S – 3XL";

                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/products/${p.id}`)}
                    className={styles.productCard}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.imageWrapper}>
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e5e7eb", color: "#9ca3af" }}>
                          No Image
                        </div>
                      )}

                      {/* Badge */}
                      {p.badge && (
                        <span className={styles.badge}>{p.badge}</span>
                      )}

                      {/* Compare */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(p.id) ? removeFromCompare(p.id) : addToCompare(p); }}
                        className={`${styles.cardBtn} ${isInCompare(p.id) ? styles.cardBtnActive : ""}`}
                        style={{ top: "12px", right: "12px" }}
                        title={isInCompare(p.id) ? "Remove from Compare" : "Add to Compare"}
                      >
                        {isInCompare(p.id) ? <Check size={15} /> : <ArrowRightLeft size={15} />}
                      </button>

                      {/* Wishlist */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p); }}
                        className={styles.cardBtn}
                        style={{ top: "12px", left: "12px", color: isInWishlist(p.id) ? "#ef4444" : "#64748b" }}
                        title={isInWishlist(p.id) ? "Remove from Shortlist" : "Add to Shortlist"}
                      >
                        <Heart size={15} fill={isInWishlist(p.id) ? "#ef4444" : "none"} />
                      </button>
                    </div>

                    {/* Swatches */}
                    <div className={styles.swatches}>
                      {mockColors.slice(0, Math.min(p.colors || 0, 5)).map((color: string, i: number) => (
                        <div key={i} className={styles.swatch} style={{ backgroundColor: color }} />
                      ))}
                      {(p.colors || 0) > 5 && (
                        <span className={styles.swatchMore}>+{(p.colors || 0) - 5}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className={styles.productInfo}>
                      <div className={styles.productTitleRow}>
                        <h3 className={styles.productTitle}>{p.name}</h3>
                        {p.price && (
                          <span className={styles.productPrice}>
                            ₹{typeof p.price === "number" ? p.price.toLocaleString("en-IN") : p.price}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={styles.productSub}>{p.type}</p>
                    <div className={styles.productMeta}>
                      <span className={styles.sizeTag}>Sizes: {sizes}</span>
                      <span className={styles.colorCount}>{p.colors || 1} Colors</span>
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
                      ? `Nothing matching "${debouncedSearch}" in ${activeGender}'s ${activeCategory}.`
                      : `We're adding more ${activeGender.toLowerCase()}'s styles soon — check back!`}
                  </p>
                  <button
                    className={styles.emptyReset}
                    onClick={() => { setSearchTerm(""); setActiveCategory("All"); }}
                  >
                    Clear Filters
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
