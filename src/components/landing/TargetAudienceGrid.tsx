import Image from "next/image";
import Link from "next/link";
import styles from "./TargetAudienceGrid.module.css";

const targets = [
  {
    title: "College / NGO Merch",
    image: "/images/targets/college.png",
    gridArea: "a"
  },
  {
    title: "Event Merchandise",
    image: "/images/targets/events.png",
    gridArea: "b"
  },
  {
    title: "Retail Apparel Stores",
    image: "/images/targets/retail.png",
    gridArea: "c"
  },
  {
    title: "Market Place",
    image: "/images/targets/marketplace.png",
    gridArea: "d"
  },
  {
    title: "Instagram",
    image: "/images/targets/instagram.png",
    gridArea: "e"
  },
  {
    title: "Local Clothing",
    image: "/images/targets/clothing.png",
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
