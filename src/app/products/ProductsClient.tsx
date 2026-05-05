"use client";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { Plus, Minus, ArrowRightLeft, Check, Heart, Search } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { useWishlist } from "@/context/WishlistContext";

const faqs = [
  { q: "Who is the best custom apparel manufacturer?", a: "Tailoring Turba is one of the top manufacturers, offering premium quality bases and customizable options for businesses, brands, and bulk buyers." },
  { q: "Do you offer blank apparel for bulk orders?", a: "Yes, we provide high-quality blank apparel at competitive wholesale prices with no minimum order requirements on standard catalog items." },
  { q: "Can I get bulk items at wholesale prices?", a: "Absolutely. Our entire catalog is structured for B2B wholesale pricing, allowing significant margins for your private label." },
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

export default function ProductsClient({ products }: { products: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { wishlistItems, toggleWishlist, isInWishlist } = useWishlist();
  const urlCategory = searchParams.get("category");
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(urlCategory);
    }
  }, [urlCategory]);

  const categories = [
    "All",
    "T-Shirts",
    "Shirts",
    "Trousers",
    "Polos",
    "Crewnecks",
    "Hoodies",
    "Jackets",
    "Crop Tops",
    "Oversized",
    "Uniforms"
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const normalizedCategory = activeCategory.toLowerCase().replace(/s$/, '');

  const filtered = products.filter(p => {
    const isTshirtUmbrella = activeCategory === "T-Shirts" && 
      (p.type?.toLowerCase().includes("polo") || 
       p.type?.toLowerCase().includes("crewneck") || 
       p.type?.toLowerCase().includes("v-neck") ||
       p.name?.toLowerCase().includes("polo") ||
       p.name?.toLowerCase().includes("crewneck"));

    const matchesCategory = activeCategory === "All" || 
      p.category === activeCategory ||
      isTshirtUmbrella ||
      (p.category && p.category.toLowerCase().includes(normalizedCategory)) ||
      (p.type && p.type.toLowerCase().includes(normalizedCategory)) ||
      (p.name && p.name.toLowerCase().includes(normalizedCategory)) ||
      (p.category && p.category.toLowerCase().includes(activeCategory.toLowerCase())) ||
      (p.type && p.type.toLowerCase().includes(activeCategory.toLowerCase())) ||
      (p.name && p.name.toLowerCase().includes(activeCategory.toLowerCase()));
      
    const searchLower = debouncedSearch.toLowerCase().trim();
    const matchesSearch = searchLower === "" || 
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.type && p.type.toLowerCase().includes(searchLower)) ||
      (p.description && p.description.toLowerCase().includes(searchLower)) ||
      (p.category && p.category.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  const mockColors = ["#1a1a1a", "#ffffff", "#1e3a8a", "#6b7d60", "#7f1d1d"];

  return (
    <>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{activeCategory === "All" ? "Catalogue" : activeCategory}</h1>
          </div>
        </section>

        <section className={`container ${styles.layout}`}>
          <aside className={styles.sidebar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            {categories.map(c => (
              <button 
                key={c} 
                className={`${styles.filterBtn} ${activeCategory === c ? styles.filterActive : ""}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </aside>

          <div className={styles.grid}>
            {filtered.map(p => {
              const sizes = p.features?.find((f: string) => 
                f.match(/^[XSML\d]+[–-][XSML\d]+$/i) || 
                f.toLowerCase().includes('size') || 
                f.toLowerCase().includes('xs') || 
                f.toLowerCase().includes('xl')
              ) || "S – 3XL";

              return (
                <div key={p.id} onClick={() => router.push(`/products/${p.id}`)} className={styles.productCard} style={{ cursor: "pointer" }}>
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
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', color: '#9ca3af' }}>
                      No Image
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isInCompare(p.id)) {
                        removeFromCompare(p.id);
                      } else {
                        addToCompare(p);
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      zIndex: 10,
                      background: isInCompare(p.id) ? "var(--tth-olive-dark, #435b43)" : "white",
                      color: isInCompare(p.id) ? "white" : "var(--tth-olive-dark, #435b43)",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    title={isInCompare(p.id) ? "Remove from Compare" : "Add to Compare"}
                  >
                    {isInCompare(p.id) ? <Check size={16} /> : <ArrowRightLeft size={16} />}
                  </button>

                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(p);
                    }}
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      zIndex: 10,
                      background: "white",
                      color: isInWishlist(p.id) ? "#ef4444" : "#64748b",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    title={isInWishlist(p.id) ? "Remove from Shortlist" : "Add to Shortlist"}
                  >
                    <Heart size={16} fill={isInWishlist(p.id) ? "#ef4444" : "none"} />
                  </button>
                </div>
                
                {/* Mock Swatches based on exact color count from spreadsheet */}
                <div className={styles.swatches}>
                  {mockColors.slice(0, Math.min(p.colors || 0, 5)).map((color, i) => (
                    <div key={i} className={styles.swatch} style={{ backgroundColor: color }} />
                  ))}
                  {(p.colors || 0) > 5 && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--tth-text-muted)', 
                      marginLeft: '4px', 
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      +{(p.colors || 0) - 5}
                    </span>
                  )}
                </div>

                  <div className={styles.productInfo}>
                    <div className={styles.productTitleRow}>
                      <h3 className={styles.productTitle}>{p.name}</h3>
                      {p.price && (
                        <span className={styles.productPrice}>
                          ₹{typeof p.price === 'number' ? p.price.toLocaleString('en-IN') : p.price}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={styles.productSub}>
                    {p.type}
                  </p>
                  <div className={styles.productMeta}>
                    <span className={styles.sizeTag}>Sizes: {sizes}</span>
                    <span className={styles.colorCount}>{p.colors || 1} Colors</span>
                  </div>
                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "60px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "16px", opacity: 0.8 }}>🔍</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>No products found</h3>
                <p style={{ color: "#64748b" }}>We couldn't find anything matching "{debouncedSearch}" in {activeCategory}.</p>
                <button 
                  onClick={() => {setSearchTerm(""); setActiveCategory("All");}}
                  style={{ marginTop: "20px", padding: "10px 24px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className={styles.faqSection}>
          {faqs.map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <div 
                className={styles.faqQuestion} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>Q{i + 1}: {faq.q}</span>
                {openFaq === i ? <Minus size={20} className={styles.faqIcon} /> : <Plus size={20} className={styles.faqIcon} />}
              </div>
              {openFaq === i && (
                <div className={styles.faqAnswer}>
                  A: {faq.a}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* SEO Text Blocks */}
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
