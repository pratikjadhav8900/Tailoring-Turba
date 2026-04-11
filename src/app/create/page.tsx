"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

const categories = [
  {
    id: "mens-tshirts",
    title: "Men's T-Shirts",
    description: "Classic round neck, V-neck, and polo shirts for men",
    image: "/api/placeholder/800/600",
    garmentTypes: ["round-neck", "v-neck", "polo"]
  },
  {
    id: "womens-tshirts",
    title: "Women's T-Shirts", 
    description: "Styled fits and designs specifically for women",
    image: "/api/placeholder/800/600",
    garmentTypes: ["round-neck", "v-neck"]
  },
  {
    id: "kids-tshirts",
    title: "Kids' T-Shirts",
    description: "Comfortable and durable shirts for children",
    image: "/api/placeholder/800/600", 
    garmentTypes: ["round-neck", "v-neck"]
  }
];

export default function CreatePage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          {/* Header Section */}
          <div className={styles.header}>
            <div className="section-badge">Create Your Own</div>
            <h1 className={styles.title}>Design Custom T-Shirts</h1>
            <p className={styles.sub}>
              Choose your garment category and start creating unique designs with our interactive customizer. 
              Select from premium fabrics and bring your vision to life.
            </p>
          </div>

          {/* Category Grid */}
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/create/${category.id}`}
                className={styles.categoryCard}
              >
                <div className={styles.imageContainer}>
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className={styles.categoryImage}
                    priority
                  />
                  <div className={styles.imageOverlay}>
                    <div className={styles.overlayText}>Your Image Here</div>
                  </div>
                </div>
                
                <div className={styles.content}>
                  <h3 className={styles.categoryTitle}>{category.title}</h3>
                  <p className={styles.categoryDescription}>{category.description}</p>
                  
                  <div className={styles.availableStyles}>
                    <span className={styles.stylesLabel}>Available Styles:</span>
                    <div className={styles.styleTags}>
                      {category.garmentTypes.map((type) => (
                        <span key={type} className={styles.styleTag}>
                          {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button className={styles.selectBtn}>
                    Select Category
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {/* Process Steps */}
          <div className={styles.processSection}>
            <h2 className={styles.processTitle}>How It Works</h2>
            <div className={styles.processSteps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <h3 className={styles.stepTitle}>Choose Category</h3>
                <p className={styles.stepDescription}>Select your garment type from our categories</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <h3 className={styles.stepTitle}>Pick Fabric</h3>
                <p className={styles.stepDescription}>Browse premium fabrics and materials</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <h3 className={styles.stepTitle}>Design & Customize</h3>
                <p className={styles.stepDescription}>Add text, logos, and customize colors</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <h3 className={styles.stepTitle}>Review & Order</h3>
                <p className={styles.stepDescription}>Finalize your design and place your order</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
