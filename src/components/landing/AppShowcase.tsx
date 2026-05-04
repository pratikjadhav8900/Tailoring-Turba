import Image from "next/image";
import Link from "next/link";
import { Share2, PackageCheck, Truck } from "lucide-react";
import styles from "./AppShowcase.module.css";

export default function AppShowcase() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.imageWrapper}>
            <Image
              src="/images/platform.png"
              alt="Tailoring Turba Platform"
              fill
              className={styles.featureImage}
            />
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.contentWrap}>
            <span className={styles.label}>TAILORING TURBA PLATFORM</span>
            <h2 className={styles.heading}>Manage B2B orders<br />seamlessly</h2>
            
            <ul className={styles.featuresList}>
              <li>
                <div className={styles.iconWrap}>
                  <Share2 size={24} />
                </div>
                <p>Share product and colors with your customers at a click of a button.</p>
              </li>
              <li>
                <div className={styles.iconWrap}>
                  <PackageCheck size={24} />
                </div>
                <p>View live inventory and commit to your customers across the table.</p>
              </li>
              <li>
                <div className={styles.iconWrap}>
                  <Truck size={24} />
                </div>
                <p>Track customised orders at every stage of production and update your customers proactively.</p>
              </li>
            </ul>

            <Link href="/about" className={styles.button}>
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
