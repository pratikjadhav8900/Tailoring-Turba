"use client";
import { useState } from "react";
import Link from "next/link";
import { Shirt, Sparkles, Layers, Flame, Coins, CheckCircle, ArrowRight, Activity } from "lucide-react";
import styles from "./CustomizationEducation.module.css";

type PrintMethod = {
  id: string;
  name: string;
  icon: any;
  title: string;
  description: string;
  bestFor: string;
  fabrics: string;
  durability: string;
  costProfile: string;
  proTip: string;
  details: string[];
};

const printMethods: PrintMethod[] = [
  {
    id: "embroidery",
    name: "Embroidery",
    icon: Sparkles,
    title: "Computerized Embroidery",
    description: "Premium stitched branding using high-speed industrial computerized sewing lines. Threads are tightly woven directly into the fabric to create a raised, luxury embossed logo that conveys institutional quality.",
    bestFor: "Corporate Polo Shirts, Oxford Shirts, Blazers, Uniform Jackets, and Structured Caps.",
    fabrics: "Heavy cotton, Pique Knits, Poly-Cotton blends, Fleece, and heavy canvas.",
    durability: "Excellent. Outlasts the garment itself. Will not fade, peel, or crack under repetitive commercial laundering.",
    costProfile: "Embroidery card/digitization fee applies for new setups. Highly cost-effective for recurring corporate orders.",
    proTip: "Perfect for chest logos. Avoid embroidery for very large designs (e.g. full back prints) as it makes the garment heavy and stiff against the skin.",
    details: [
      "Rich 3D embossed look and texture",
      "Up to 15 thread colors per design",
      "Excellent color fastness",
      "Resistant to high-temp ironing"
    ]
  },
  {
    id: "screen",
    name: "Screen Printing",
    icon: Layers,
    title: "Precision Screen Printing",
    description: "The classic industry standard for bulk apparel customization. Uses stencils (screens) to apply layers of durable ink onto the garment surface, resulting in bold, vibrant colors with high opacity.",
    bestFor: "High-volume promotional T-Shirts, Event Tees, Crewnecks, and Canvas Tote Bags.",
    fabrics: "100% Cotton, Cotton-Poly blends, and standard canvas materials.",
    durability: "High. Long-lasting colors that resist fading. Over several years, minor ink cracking may occur if tumble-dried hot.",
    costProfile: "High setup cost per color (screen creation), but extremely low unit cost. Ideal for orders of 100+ units.",
    proTip: "Limit your design to 1-3 solid colors for maximum budget efficiency. Each additional color requires a separate screen, which increases setup costs.",
    details: [
      "Extremely vibrant ink colors",
      "Most cost-effective for large bulk orders",
      "Works best on solid block designs",
      "Smooth, uniform ink finish"
    ]
  },
  {
    id: "dtg",
    name: "DTG (Direct to Garment)",
    icon: Shirt,
    title: "Direct to Garment Digital Print",
    description: "High-resolution digital inkjet printing directly onto the fabric fibers (similar to a paper printer). Excellent for complex, multi-colored designs, photographs, and high-detail gradient artwork.",
    bestFor: "Bespoke designer t-shirts, small batch merchandise, and highly detailed artistic prints.",
    fabrics: "100% Combed Cotton or high-cotton blends (minimum 80% cotton is recommended for ink absorption).",
    durability: "Medium. Ink fuses with fibers, resulting in a soft feel. Colors fade gradually over 40+ washes.",
    costProfile: "Zero setup fee. Flat cost per print, making it perfect for custom low-volume runs (10-50 units).",
    proTip: "Great for quick-turnaround samples or colorful gradient logos. Always wash inside out in cold water to preserve print details.",
    details: [
      "Unlimited colors and smooth gradients",
      "Ultra-soft feel (no thick ink layer)",
      "Zero setup costs or plate charges",
      "Ideal for photography and fine art prints"
    ]
  },
  {
    id: "sublimation",
    name: "Sublimation",
    icon: Activity,
    title: "Dye Sublimation Printing",
    description: "Heat-activated dyes are chemically gas-fused directly into polyester fibers. The print becomes part of the fabric itself, meaning there is absolutely zero physical ink feel and maximum breathability.",
    bestFor: "Athletic uniforms, dryfit corporate polo shirts, custom sports jerseys, and high-performance cycling wear.",
    fabrics: "100% Polyester or high-polyester active fabrics only (White or light colors).",
    durability: "Maximum. The print will never crack, peel, or fade, even under sweat, stretching, or daily washing.",
    costProfile: "Low setup fees, highly efficient for full-surface all-over printing (AOP).",
    proTip: "Choose this for corporate sports days, gyms, or outdoor workers who require light, breathable, moisture-wicking uniforms.",
    details: [
      "100% breathable with zero ink weight",
      "All-over print (AOP) seamless graphics",
      "Colors stay vibrant forever",
      "No cracking or peeling possible"
    ]
  },
  {
    id: "dtf",
    name: "DTF / Heat Transfer",
    icon: Flame,
    title: "Direct to Film & Heat Transfer",
    description: "Artwork is digitally printed onto a release film and heat-pressed onto the garment with specialized adhesive. Delivers razor-sharp edges, solid gradients, and fine details on almost any fabric type.",
    bestFor: "Corporate event badges, sleeve logos, sports numbers, and windbreakers/jackets.",
    fabrics: "Polyester, Nylon, Cotton, Poly-spandex, and waterproof outerwear fabrics.",
    durability: "High. Flexible adhesive allows the print to stretch. Withstands standard machine wash cycles.",
    costProfile: "Minimal setup cost. Very economical for small logos, badges, and personalizing names/numbers.",
    proTip: "Excellent for multi-colored brand logos placed on difficult spots (like sleeves, collars, or polyester jackets) where screen printing fails.",
    details: [
      "Razor-sharp edges and fine details",
      "Applies perfectly to synthetic and synthetic-blend fabrics",
      "Elastic, stretch-resistant prints",
      "Vivid color rendering"
    ]
  }
];

export default function CustomizationEducation() {
  const [activeTab, setActiveTab] = useState("embroidery");
  const selectedMethod = printMethods.find(m => m.id === activeTab) || printMethods[0];
  const IconComponent = selectedMethod.icon;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tagline}>Branding & Customization</span>
          <h2 className={styles.title}>Garment Personalization Methods</h2>
          <p className={styles.subtitle}>
            Empowering brands with the right technology. Learn about our industry-grade customization techniques to select the best match for your project.
          </p>
        </div>

        {/* Tab Selection */}
        <div className={styles.tabsRow}>
          {printMethods.map((m) => {
            const TabIcon = m.icon;
            return (
              <button
                key={m.id}
                className={`${styles.tabBtn} ${activeTab === m.id ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab(m.id)}
              >
                <TabIcon size={18} />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Content Showcase */}
        <div className={styles.showcaseGrid}>
          {/* Left Panel: Specifications */}
          <div className={styles.detailsCard}>
            <div className={styles.methodHeader}>
              <div className={styles.iconCircle}>
                <IconComponent size={24} />
              </div>
              <div>
                <h3 className={styles.methodTitle}>{selectedMethod.title}</h3>
                <span className={styles.methodBadge}>Professional Customization</span>
              </div>
            </div>

            <p className={styles.methodDesc}>{selectedMethod.description}</p>

            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Best For:</span>
                <span className={styles.specVal}>{selectedMethod.bestFor}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Suitable Fabrics:</span>
                <span className={styles.specVal}>{selectedMethod.fabrics}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Feel & Durability:</span>
                <span className={styles.specVal}>{selectedMethod.durability}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Pricing & MOQ:</span>
                <span className={styles.specVal}>{selectedMethod.costProfile}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/customizer" className={styles.primaryAction}>
                Try in Design Studio <ArrowRight size={16} />
              </Link>
              <Link href={`/contact?subject=Customization Inquiry&message=I would like to inquire about ${selectedMethod.name} customization.`} className={styles.secondaryAction}>
                Get Bulk Quote
              </Link>
            </div>
          </div>

          {/* Right Panel: Technical Details & Tips */}
          <div className={styles.visualCard}>
            <div className={styles.visualPattern}>
              <h4 className={styles.cardSectionTitle}>Key Highlights</h4>
              <ul className={styles.checkList}>
                {selectedMethod.details.map((detail, idx) => (
                  <li key={idx} className={styles.checkItem}>
                    <CheckCircle size={16} className={styles.checkIcon} />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.proTipCard}>
              <div className={styles.proTipHeader}>
                <Coins size={18} className={styles.proTipIcon} />
                <span>Expert Recommendation</span>
              </div>
              <p className={styles.proTipText}>{selectedMethod.proTip}</p>
            </div>

            <div className={styles.educationalNote}>
              💡 <strong>Confused?</strong> Don&apos;t worry. When you place a bulk order, our production managers review your artwork and recommend the most cost-effective, high-quality printing method for your selected fabric.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
