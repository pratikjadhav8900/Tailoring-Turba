"use client";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Minus } from "lucide-react";
import { allProducts } from "@/lib/products-data";

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

function ProductContent() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(urlCategory);
    }
  }, [urlCategory]);

  const categories = ["All", ...Array.from(new Set(allProducts.map(p => p.category)))];

  const filtered = activeCategory === "All" 
    ? allProducts 
    : allProducts.filter(p => p.category === activeCategory);

  // Mock colors for swatches
  const mockColors = ["#1a1a1a", "#ffffff", "#1e3a8a", "#6b7d60", "#7f1d1d"];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Editorial Hero Banner */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{activeCategory === "All" ? "The Catalog" : activeCategory}</h1>
          </div>
        </section>

        {/* Layout */}
        <section className={`container ${styles.layout}`}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
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

          {/* Product Grid */}
          <div className={styles.grid}>
            {filtered.map(p => (
              <Link href={`/products/${p.id}`} key={p.id} className={styles.productCard}>
                <div className={styles.imageWrapper}>
                  <Image 
                    src={p.image} 
                    alt={p.name} 
                    fill 
                    style={{ objectFit: "cover" }} 
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                
                {/* Mock Swatches based on exact color count from spreadsheet */}
                <div className={styles.swatches} style={{ alignItems: 'center' }}>
                  {mockColors.slice(0, Math.min(p.colors || 0, 5)).map((color, i) => (
                    <div key={i} className={styles.swatch} style={{ backgroundColor: color }} />
                  ))}
                  {(p.colors || 0) > 5 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--tth-text-muted)', marginLeft: '4px', fontWeight: 600 }}>
                      +{(p.colors || 0) - 5}
                    </span>
                  )}
                </div>

                <div className={styles.productInfo}>
                  <h3 className={styles.productTitle}>{p.name}</h3>
                  <p className={styles.productSub}>
                    {p.type}
                  </p>
                </div>
              </Link>
            ))}
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

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading catalog...</div>}>
      <ProductContent />
    </Suspense>
  );
}
