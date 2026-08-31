import Image from "next/image";
import Link from "next/link";
import styles from "./TargetAudienceGrid.module.css";

const targets = [
  {
    title: "College / NGO Merch",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1200",
    gridArea: "a"
  },
  {
    title: "Event Merchandise",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
    gridArea: "b"
  },
  {
    title: "Retail Apparel Stores",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
    gridArea: "c"
  },
  {
    title: "Market Place",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=1200",
    gridArea: "d"
  },
  {
    title: "Instagram",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1200",
    gridArea: "e"
  },
  {
    title: "Local Clothing",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1200",
    gridArea: "f"
  }
];

export default function TargetAudienceGrid() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.intro}>
            <h2 className={styles.heading}>Bulk Customized Tees for All</h2>
            <p className={styles.subtext}>
              Premium customized t-shirts in bulk, designed for printing, branding, and resale. Perfect for businesses, events, and online stores.
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
