import Link from "next/link";
import styles from "./EditorialWelcome.module.css";

export default function EditorialWelcome() {
  return (
    <section className={styles.editorial}>
      <div className="container">
        <div className={styles.content}>
          <h2 className={styles.headline}>
            The apparel manufacturing brand built for <br/>
            <i>innovators like you</i> in mind. We create blank<br/>
            apparels on which you express your<br/>
            individuality.
          </h2>
          
          <p className={styles.tagline}>Customise. Print. Wear.</p>

          <p className={styles.body}>
            From a 5-piece sample run to a 50,000-piece corporate rollout —
            Tailoring Turba is Pune&apos;s premier B2B blank apparel manufacturer.
            Our three in-house brands (Magic, Folkswear, Tailoring Turba) cover every
            fabric weight, silhouette, and price point.
          </p>

          <Link href="/products" className={styles.btn}>
            EXPLORE OUR RANGE
          </Link>
        </div>
      </div>
    </section>
  );
}
