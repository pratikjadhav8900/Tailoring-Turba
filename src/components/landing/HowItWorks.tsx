import React from "react";
import { Search, PenTool, Truck } from "lucide-react";
import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    icon: Search,
    title: "Browse & Select",
    desc: "Explore our premium catalogue of over 100+ blank apparel styles, each optimized for B2B branding."
  },
  {
    icon: PenTool,
    title: "Customize Design",
    desc: "Use our full-screen Design Studio to visualize your brand. Upload logos, add text, and tweak every detail."
  },
  {
    icon: Truck,
    title: "Fast Fulfillment",
    desc: "Review your quote and sample. Once approved, we manufacture and deliver with industry-leading speed."
  }
];

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Simplicity, <br /><em>scaled for business.</em></h2>
          <p className={styles.subtitle}>Our end-to-end platform takes the friction out of bulk apparel manufacturing.</p>
        </div>

        <div className={styles.grid}>
          {STEPS.map((step, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.stepNum}>0{idx + 1}</div>
              <div className={styles.iconBox}>
                <step.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
