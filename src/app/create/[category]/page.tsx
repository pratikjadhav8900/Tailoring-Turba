"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { FABRICS, FABRIC_CATEGORIES, GARMENTS, Fabric, FabricCategory } from "@/lib/fabric-data";
import styles from "./page.module.css";

// Category configuration
const categoryConfig = {
  "mens-tshirts": {
    title: "Men's T-Shirts",
    description: "Premium quality t-shirts designed for comfort and style",
    allowedGarments: ["round-neck", "v-neck", "polo"]
  },
  "womens-tshirts": {
    title: "Women's T-Shirts", 
    description: "Tailored fits with feminine styling and superior comfort",
    allowedGarments: ["round-neck", "v-neck"]
  },
  "kids-tshirts": {
    title: "Kids' T-Shirts",
    description: "Durable and comfortable shirts perfect for active children",
    allowedGarments: ["round-neck", "v-neck"]
  }
};

type CategoryKey = keyof typeof categoryConfig;
type GarmentType = keyof typeof GARMENTS;

export default function CategoryPage({ params }: { params: { category: string } }) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<FabricCategory | "all">("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  
  const categoryKey = params.category as CategoryKey;
  const config = categoryConfig[categoryKey];

  // Filter fabrics based on category and allowed garments
  const filteredFabrics = useMemo(() => {
    let fabrics = FABRICS.filter(fabric => 
      config.allowedGarments.some(garment => fabric.garments.includes(garment as GarmentType))
    );

    // Apply fabric category filter
    if (selectedCategory !== "all") {
      fabrics = fabrics.filter(fabric => fabric.category === selectedCategory);
    }

    // Apply price range filter
    if (priceRange !== "all") {
      fabrics = fabrics.filter(fabric => {
        const [min, max] = fabric.priceRange.replace('[^0-9-]', '').split('-').map(Number);
        switch (priceRange) {
          case "budget":
            return max <= 200;
          case "mid":
            return min >= 150 && max <= 400;
          case "premium":
            return min >= 300;
          default:
            return true;
        }
      });
    }

    return fabrics;
  }, [config.allowedGarments, selectedCategory, priceRange]);

  if (!config) {
    return (
      <>
        <main className={styles.main}>
          <div className="container">
            <div className={styles.error}>
              <h1>Category Not Found</h1>
              <p>The category you're looking for doesn't exist.</p>
              <Link href="/create" className="btn-primary">Back to Categories</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const handleAddDesign = (fabric: Fabric, garmentType: string) => {
    const params = new URLSearchParams({
      garment: garmentType,
      fabricId: fabric.id
    });
    
    // Navigate to customizer with pre-selected options
    window.location.href = `/customizer?${params.toString()}`;
  };

  return (
    <>
      <main className={styles.main}>
        <div className="container">
          {/* Header */}
          <div className={styles.header}>
            <Link href="/create" className={styles.backLink}>
              &larr; Back to Categories
            </Link>
            <h1 className={styles.title}>{config.title}</h1>
            <p className={styles.description}>{config.description}</p>
          </div>

          {/* Filters Sidebar */}
          <div className={styles.content}>
            <aside className={styles.sidebar}>
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Fabric Type</h3>
                <div className={styles.filterOptions}>
                  <button
                    className={`${styles.filterOption} ${selectedCategory === "all" ? styles.active : ""}`}
                    onClick={() => setSelectedCategory("all")}
                  >
                    All Fabrics
                  </button>
                  {FABRIC_CATEGORIES.filter(cat => cat.key !== "all").map((cat) => (
                    <button
                      key={cat.key}
                      className={`${styles.filterOption} ${selectedCategory === cat.key ? styles.active : ""}`}
                      onClick={() => setSelectedCategory(cat.key as FabricCategory)}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Price Range</h3>
                <div className={styles.filterOptions}>
                  <button
                    className={`${styles.filterOption} ${priceRange === "all" ? styles.active : ""}`}
                    onClick={() => setPriceRange("all")}
                  >
                    All Prices
                  </button>
                  <button
                    className={`${styles.filterOption} ${priceRange === "budget" ? styles.active : ""}`}
                    onClick={() => setPriceRange("budget")}
                  >
                    Budget (Under Rs. 200)
                  </button>
                  <button
                    className={`${styles.filterOption} ${priceRange === "mid" ? styles.active : ""}`}
                    onClick={() => setPriceRange("mid")}
                  >
                    Mid-Range (Rs. 150-400)
                  </button>
                  <button
                    className={`${styles.filterOption} ${priceRange === "premium" ? styles.active : ""}`}
                    onClick={() => setPriceRange("premium")}
                  >
                    Premium (Rs. 300+)
                  </button>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className={styles.productSection}>
              <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>Available Fabrics ({filteredFabrics.length})</h2>
                <p className={styles.resultsSub}>Choose your preferred fabric and start designing</p>
              </div>

              {filteredFabrics.length === 0 ? (
                <div className={styles.noResults}>
                  <h3>No fabrics found</h3>
                  <p>Try adjusting your filters to see more options.</p>
                </div>
              ) : (
                <div className={styles.productGrid}>
                  {filteredFabrics.map((fabric) => (
                    <div key={fabric.id} className={styles.productCard}>
                      <div className={styles.imageContainer}>
                        <Image
                          src={fabric.images.base}
                          alt={fabric.brand}
                          fill
                          className={styles.productImage}
                        />
                        {fabric.tag && (
                          <span className={styles.productTag}>{fabric.tag}</span>
                        )}
                      </div>
                      
                      <div className={styles.productInfo}>
                        <h3 className={styles.productBrand}>{fabric.brand}</h3>
                        <p className={styles.productFabric}>{fabric.fabric}</p>
                        
                        <div className={styles.productSpecs}>
                          <span className={styles.spec}>{fabric.gsm} GSM</span>
                          <span className={styles.spec}>{fabric.sizes}</span>
                        </div>
                        
                        <div className={styles.productPrice}>{fabric.priceRange}</div>
                        
                        <div className={styles.garmentOptions}>
                          <span className={styles.garmentLabel}>Available in:</span>
                          <div className={styles.garmentButtons}>
                            {fabric.garments
                              .filter(garment => config.allowedGarments.includes(garment as GarmentType))
                              .map((garment) => (
                                <button
                                  key={garment}
                                  className={styles.garmentBtn}
                                  onClick={() => handleAddDesign(fabric, garment)}
                                >
                                  {GARMENTS[garment].label}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
