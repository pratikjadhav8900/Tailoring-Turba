import Image from "next/image";
import styles from "./FeaturesGrid.module.css";

const features = [
  {
    title: "Live Inventory",
    description: "Mobile app shows real-time stock updates for quick ordering",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&q=80"
  },
  {
    title: "Start Your Brand",
    description: "Use blank tees to launch your label without manufacturing costs.",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80"
  },
  {
    title: "Private Label Ready",
    description: "Support for neck labels, hang tags, and custom packaging.",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80"
  },
  {
    title: "Best B2B Margins",
    description: "Flexible MOQs and volume pricing directly from the factory.",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80"
  },
  {
    title: "Easy Ordering",
    description: "Place orders via WhatsApp or mobile app — simple & fast.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80"
  },
  {
    title: "Local Presence",
    description: "Warehouses in Mumbai, Pune, Bangalore & Hyderabad.",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80"
  },
  {
    title: "Loyalty Perks",
    description: "Early access to launches, rewards, and exclusive deals.",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80"
  },
  {
    title: "Marketing Collateral",
    description: "Get catalogues, mockups, and ready-to-send pitch decks.",
    image: "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=400&q=80"
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
