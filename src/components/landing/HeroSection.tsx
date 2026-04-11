import Link from "next/link";
import Image from "next/image";
import styles from "./HeroSection.module.css";
export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.content}>
          <div className="section-badge">Premium B2B Manufacturing</div>
          <h1 className={styles.title}>
            Design & Order Custom Teamwear <span>Online.</span>
          </h1>
          <p className={styles.subtitle}>
            From raw fabrics to custom sublimated jerseys. Tailoring Turba offers a complete B2B/B2C solution for teams, events, and bulk orders directly from our Pune facility.
          </p>
          
          <div className={styles.actions}>
            <Link href="/customizer" className="btn-primary">
              Customize Now →
            </Link>
            <Link href="/products" className="btn-secondary">
              Browse Catalogs
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <h3>10k+</h3>
              <p>Garments Delivered</p>
            </div>
            <div className={styles.stat}>
              <h3>48hr</h3>
              <p>Sample Dispatch</p>
            </div>
            <div className={styles.stat}>
              <h3>100%</h3>
              <p>In-House Printing</p>
            </div>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.imageGrid}>
            <div className={styles.mainImage}>
              <Image 
                src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1000&q=80" 
                alt="Apparel Manufacturing" 
                fill 
                style={{objectFit: 'cover'}} 
              />
            </div>
            <div className={styles.sideImages}>
              <div className={styles.smallImage}>
                <Image 
                  src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80" 
                  alt="Factory sewing" 
                  fill 
                  style={{objectFit: 'cover'}} 
                />
              </div>
              <div className={styles.smallImage}>
                <Image 
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" 
                  alt="Plain color t-shirts" 
                  fill 
                  style={{objectFit: 'cover'}} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
