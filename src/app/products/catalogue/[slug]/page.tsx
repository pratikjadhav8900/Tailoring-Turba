"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";

type Product = {
  id: string;
  code: string;
  name: string;
  spec: string | null;
  price?: string;
};

type CategoryData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  hsn: string | null;
  gst: string | null;
  pageImages: { pageNumber: number; url: string }[];
  products: Product[];
};

export default function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<CategoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/catalogue/${params.slug}`)
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.error) {
          setData(resData);
        }
        setIsLoading(false);
      });
  }, [params.slug]);

  if (isLoading) return <div className={styles.loadingState}>Loading premium collection...</div>;
  if (!data) return <div className={styles.loadingState}>Category not found.</div>;

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          {/* Header Section */}
          <div className={styles.header}>
            <div className={styles.breadcrumb}>
              <Link href="/">Home</Link>
              <span className={styles.separator}>/</span>
              <Link href="/products/catalogue">Catalogue</Link>
              <span className={styles.separator}>/</span>
              <span className={styles.current}>{data.name}</span>
            </div>
            
            <div className={styles.headerContent}>
              <h1 className={styles.title}>{data.name}</h1>
              <p className={styles.subtitle}>{data.description}</p>
              <div className={styles.headerMeta}>
                <span className={styles.metaCap}>Unit Pricing & GST Included</span>
                <span className={styles.metaDivider}>|</span>
                <span className={styles.metaDetail}>HSN: {data.hsn || "Various"}</span>
              </div>
            </div>
          </div>

          {/* Shoppable Product Cards */}
          <div className={styles.shoppableArea}>
            <div className={styles.productFlex}>
              {data.products.map(product => (
                <div key={product.id} className={styles.premiumCard}>
                  <div className={styles.cardVisual}>
                    {/* Using the first page as a fallback product image if we don't have individual ones */}
                    <Image 
                      src={data.pageImages[0]?.url || "/placeholder.jpg"} 
                      alt={product.name} 
                      fill 
                      style={{ objectFit: "cover", opacity: 0.8 }} 
                    />
                  </div>
                  
                  <div className={styles.cardDetails}>
                    <h3 className={styles.cardName}>{product.name}</h3>
                    <p className={styles.cardSpec}>{product.spec || "Premium quality, custom branding available."}</p>
                    
                    <div className={styles.cardPricing}>
                      <div className={styles.priceLabel}>Starting from</div>
                      <div className={styles.priceValue}>₹{product.price || "1,499"}</div>
                      <div className={styles.gstNote}>Inc. {data.gst || "18%"} GST</div>
                    </div>

                    <div className={styles.cardActions}>
                      <button 
                        className={styles.addToCartBtn}
                        onClick={() => addToCart({
                          id: product.id,
                          code: product.code,
                          name: product.name,
                          price: product.price || "1,499",
                          quantity: 1
                        })}
                      >
                        Add to Cart
                      </button>
                      <Link 
                        href={`/contact?product=${product.code}&category=${data.slug}`} 
                        className={styles.buyNowBtn}
                      >
                        Request Quote
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && data.pageImages[currentIndex] && (
          <div className={styles.lightbox} onClick={() => setLightboxOpen(false)}>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <Image 
                src={data.pageImages[currentIndex].url} 
                alt="Catalogue View" 
                fill 
                style={{ objectFit: 'contain' }} 
              />
              <button className={styles.closeBtn} onClick={() => setLightboxOpen(false)}>×</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
