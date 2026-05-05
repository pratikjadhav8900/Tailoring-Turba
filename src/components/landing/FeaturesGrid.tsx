import Image from "next/image";
import styles from "./FeaturesGrid.module.css";

const features = [
  {
    title: "Live Inventory",
    description: "Mobile app shows real-time stock updates for quick ordering",
    image: "/images/features/inventory.png"
  },
  {
    title: "Start Your Brand",
    description: "Launch your label with bespoke customized apparel designed for your brand.",
    image: "/images/features/brand.png"
  },
  {
    title: "Private Label Ready",
    description: "Support for neck labels, hang tags, and custom packaging.",
    image: "/images/features/labels.png"
  },
  {
    title: "Best B2B Margins",
    description: "Flexible MOQs and volume pricing directly from the factory.",
    image: "/images/features/margins.png"
  },
  {
    title: "Easy Ordering",
    description: "Place orders via WhatsApp or mobile app — simple & fast.",
    image: "/images/features/ordering.png"
  },
  {
    title: "Local Presence",
    description: "Warehouses in Mumbai, Pune, Bangalore & Hyderabad.",
    image: "/images/features/presence.png"
  },
  {
    title: "Loyalty Perks",
    description: "Early access to launches, rewards, and exclusive deals.",
    image: "/images/features/perks.png"
  },
  {
    title: "Marketing Collateral",
    description: "Get catalogues, mockups, and ready-to-send pitch decks.",
    image: "/images/features/collateral.png"
  }
];

export default function FeaturesGrid() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className={styles.image}
                />
              </div>
              <h3 className={styles.title}>{feature.title}</h3>
              <p className={styles.description}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
