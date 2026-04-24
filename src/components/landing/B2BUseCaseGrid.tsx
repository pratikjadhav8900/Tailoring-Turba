import Image from "next/image";
import Link from "next/link";
import styles from "./B2BUseCaseGrid.module.css";

const useCases = [
  { title: "College & NGO Merch", image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&q=80", colSpan: 2, rowSpan: 1 },
  { title: "Event Merchandise", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80", colSpan: 1, rowSpan: 1 },
  { title: "E-commerce Brands", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80", colSpan: 1, rowSpan: 1 },
  { title: "Corporate Gifting", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80", colSpan: 1, rowSpan: 1 },
];

export default function B2BUseCaseGrid() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.content}>
            <span className={styles.tag}>WHO WE SERVE</span>
            <h2 className={styles.headline}>Bulk Blank Tees<br/>for All</h2>
            <p className={styles.desc}>
              Premium blank t-shirts and polos in bulk, ready for printing,
              branding, and resale. Perfect for businesses, events, schools, and online stores.
            </p>
            <ul className={styles.list}>
              <li>Starting from just 5 pieces</li>
              <li>Custom branding & logo printing</li>
              <li>Fast 5–10 day delivery PAN India</li>
              <li>Competitive B2B pricing with tiered discounts</li>
            </ul>
            <Link href="/booking" className={styles.btn}>
              GET A QUOTE NOW <span className={styles.arrow}>→</span>
            </Link>
          </div>
          <div className={styles.grid}>
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className={styles.gridItem}
                style={{
                  gridColumn: `span ${uc.colSpan}`,
                  gridRow: `span ${uc.rowSpan}`
                }}
              >
                <Image src={uc.image} alt={uc.title} fill className={styles.img} />
                <div className={styles.overlay} />
                <h3 className={styles.title}>{uc.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
