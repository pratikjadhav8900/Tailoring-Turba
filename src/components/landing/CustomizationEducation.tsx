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
    description: "Classic, high-quality thread work stitched directly onto the fabric. Gives a clean, slightly raised logo that looks professional and never fades.",
    bestFor: "Corporate polo shirts, uniform shirts, jackets, hoodies, and caps.",
    fabrics: "Thicker materials like pique cotton, fleece, canvas, and poly-blends.",
    durability: "Top-tier. Outlasts the garment. Machine wash as much as you want.",
    costProfile: "One-time digitization/setup fee. Very cheap for repeat bulk orders.",
    proTip: "Great for chest or sleeve logos. Avoid full-back designs as stitched embroidery makes the fabric stiff and heavy.",
    details: [
      "Premium embossed texture",
      "Rich, professional look",
      "Safe to iron directly",
      "Won't peel or fade"
    ]
  },
  {
    id: "screen",
    name: "Screen Printing",
    icon: Layers,
    title: "Precision Screen Printing",
    description: "The industry standard for bulk t-shirts. Uses screens to press ink onto the fabric, creating sharp, solid colors that pop.",
    bestFor: "Promotional t-shirts, events, custom bags, and crewnecks.",
    fabrics: "100% cotton, poly-cotton blends, and canvas.",
    durability: "Long-lasting. To prevent cracking over the years, wash inside-out.",
    costProfile: "Low unit cost for big runs. Best for simple 1-3 color logos.",
    proTip: "Keep the colors limited to save money. Adding colors means more screens, which adds to the setup cost.",
    details: [
      "Vibrant, solid ink",
      "Vast range of colors",
      "Best price for bulk",
      "Smooth, clean finish"
    ]
  },
  {
    id: "dtg",
    name: "DTG (Direct to Garment)",
    icon: Shirt,
    title: "Direct to Garment Digital Print",
    description: "Like printing on paper, but for t-shirts. Specialized fabric printers spray ink directly onto cotton fibers, capturing every tiny detail and color.",
    bestFor: "Complex multi-color logos, colorful artwork, and small runs.",
    fabrics: "100% cotton works best.",
    durability: "Soft feel, no heavy ink print. Fades slightly over time, like vintage tees.",
    costProfile: "No setup fees. Perfect for smaller, highly detailed orders.",
    proTip: "Perfect if your logo has gradients or photos. Wash inside-out in cold water.",
    details: [
      "Unlimited print colors",
      "Super soft to touch",
      "Zero setup costs",
      "Perfect for gradients"
    ]
  },
  {
    id: "sublimation",
    name: "Sublimation",
    icon: Activity,
    title: "Dye Sublimation Printing",
    description: "Dye is chemically infused directly into polyester fibers using heat. The print literally becomes part of the shirt, meaning there is zero physical ink texture.",
    bestFor: "Sports jerseys, activewear, dry-fit polos, and gym wear.",
    fabrics: "100% polyester only (white or light colors).",
    durability: "Will never fade, crack, or peel—even with intense sweat and sports washing.",
    costProfile: "Cost-effective, perfect for full-coverage prints.",
    proTip: "Choose this if you need moisture-wicking, breathable uniforms for sports or hot environments.",
    details: [
      "100% breathable",
      "Print is part of fabric",
      "Never fades or cracks",
      "Full all-over print (AOP)"
    ]
  },
  {
    id: "dtf",
    name: "DTF / Heat Transfer",
    icon: Flame,
    title: "Direct to Film & Heat Transfer",
    description: "Designs are printed on a film and heat-pressed onto the garment with specialized adhesive. Creates extremely sharp edges and vibrant gradients.",
    bestFor: "Logo badges, numbers on sports jerseys, and waterproof jackets.",
    fabrics: "Polyester, nylon, cotton, spandex—works on almost anything.",
    durability: "Good stretch and durability. Machine wash friendly.",
    costProfile: "Very cheap for individual names, small logo placements, or labels.",
    proTip: "Great for placing logos in tricky spots (collars, sleeves) where standard printing is hard.",
    details: [
      "Sharp borders & lines",
      "Flexible & stretchable",
      "Great on jackets & nylon",
      "Vivid color gradients"
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
          <span className={styles.tagline}>Branding Options</span>
          <h2 className={styles.title}>Garment Customization Methods</h2>
          <p className={styles.subtitle}>
            Not sure which printing method fits your logo and fabric choice? Here is a simple guide to our custom clothing printing services.
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
              💡 <strong>Still unsure?</strong> Don&apos;t worry. Once you submit a quote or design, our team will review your logo and fabric choice to recommend the best, most budget-friendly printing method before production.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
