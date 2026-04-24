import Image from "next/image";
import Link from "next/link";
import styles from "./TargetAudienceGrid.module.css";

const targets = [
  {
    title: "College / NGO Merch",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80",
    gridArea: "a"
  },
  {
    title: "Event Merchandise",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    gridArea: "b"
  },
  {
    title: "Retail Apparel Stores",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    gridArea: "c"
  },
  {
    title: "Market Place",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
    gridArea: "d"
  },
  {
    title: "Instagram",
    image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80",
    gridArea: "e"
  },
  {
    title: "Local Clothing",
    image: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&q=80",
    gridArea: "f"
  }
];

export default function TargetAudienceGrid() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.intro}>
            <h2 className={styles.heading}>Bulk Blank Tees for All</h2>
            <p className={styles.subtext}>
              Premium blank t-shirts in bulk, ready for printing, branding, and resale. Perfect for businesses, events, and online stores.
            </p>
            <Link href="/contact" className={styles.button}>
              Get a Quote Now
            </Link>
          </div>
          
          {targets.map((target, index) => (
            <div key={index} className={styles.card} style={{ gridArea: target.gridArea }}>
              <div className={styles.imageWrap}>
                <Image
                  src={target.image}
                  alt={target.title}
                  fill
                  className={styles.image}
                />
              </div>
              <h3 className={styles.cardTitle}>{target.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
