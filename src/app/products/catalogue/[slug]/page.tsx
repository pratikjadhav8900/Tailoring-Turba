"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";
import Skeleton from "@/components/Skeleton";

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

  if (isLoading) return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.heroHeader} style={{ background: '#f8fafc' }}>
          <div className={styles.heroContent}>
            <Skeleton width="200px" height="1rem" style={{ marginBottom: '16px' }} />
            <Skeleton width="100px" height="0.8rem" style={{ marginBottom: '12px' }} />
            <Skeleton width="60%" height="2.5rem" style={{ marginBottom: '20px' }} />
            <Skeleton width="40%" height="1rem" />
          </div>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.productGrid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={styles.card} style={{ pointerEvents: 'none' }}>
                <div className={styles.cardVisual}>
                  <Skeleton height="100%" borderRadius="0" />
                </div>
                <div className={styles.cardBody}>
                  <Skeleton width="30%" height="0.7rem" style={{ marginBottom: "12px" }} />
                  <Skeleton width="80%" height="1.2rem" style={{ marginBottom: "12px" }} />
                  <Skeleton width="100%" height="0.8rem" style={{ marginBottom: "20px" }} />
                  <div style={{ marginBottom: '20px' }}>
                    <Skeleton width="40%" height="0.7rem" style={{ marginBottom: '8px' }} />
                    <Skeleton width="60%" height="1.5rem" />
                  </div>
                  <div className={styles.cardActions}>
                    <Skeleton width="100%" height="2.5rem" borderRadius="8px" />
                    <Skeleton width="100%" height="2.5rem" borderRadius="8px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
  if (!data) return <div className={styles.loadingState}>Collection not found.</div>;

  return (
    <div className={styles.pageWrapper} suppressHydrationWarning>
      <Navbar />
      <main className={styles.main}>

        {/* Hero Header — full bleed, matches catalogue */}
        <div className={styles.heroHeader}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <div className={styles.breadcrumb}>
              <Link href="/">Home</Link>
              <span className={styles.sep}>/</span>
              <Link href="/products/catalogue">Catalogue</Link>
              <span className={styles.sep}>/</span>
              <span>{data.name}</span>
            </div>
            <p className={styles.eyebrow}>Collection</p>
            <h1 className={styles.title}>{data.name}</h1>
            {data.description && (
              <p className={styles.sub}>{data.description}</p>
            )}
            <div className={styles.metaRow}>
              <span>Unit Pricing & GST Included</span>
              <span className={styles.metaDot}>·</span>
              <span>HSN: {data.hsn || "Various"}</span>
              {data.gst && (
                <>
                  <span className={styles.metaDot}>·</span>
                  <span>GST: {data.gst}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className={styles.mainContent}>
          {data.products.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No products found in this collection.</p>
              <Link href="/products/catalogue" className={styles.backLink}>← Back to Catalogue</Link>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {data.products.map(product => (
                <div key={product.id} className={styles.card}>
                  <div className={styles.cardVisual}>
                    <Image
                      src={data.pageImages[0]?.url || "/placeholder.jpg"}
                      alt={product.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                    <div className={styles.cardOverlay}></div>
                    <div className={styles.cardCode}>{product.code}</div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardTag}>Product</div>
                    <h3 className={styles.cardName}>{product.name}</h3>
                    {product.spec && (
                      <p className={styles.cardSpec}>{product.spec}</p>
                    )}

                    <div className={styles.pricingBlock}>
                      <div className={styles.priceLabel}>Starting from</div>
                      <div className={styles.priceValue}>₹{product.price || "1,499"}</div>
                      <div className={styles.gstNote}>Inc. {data.gst || "18%"} GST</div>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.addToCartBtn}
                        onClick={() => addToCart({
                          id: product.id,
                          productId: product.id,
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
                        className={styles.quoteBtn}
                      >
                        Request Quote
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Catalogue Page Images — lightbox strip */}
          {data.pageImages.length > 0 && (
            <div className={styles.pagesSection}>
              <div className={styles.pagesSectionHeader}>
                <h2 className={styles.pagesSectionTitle}>Catalogue Pages</h2>
                <p className={styles.pagesSectionSub}>Click any page to view full size</p>
              </div>
              <div className={styles.pagesGrid}>
                {data.pageImages.map((img, i) => (
                  <button
                    key={i}
                    className={styles.pageThumb}
                    onClick={() => { setCurrentIndex(i); setLightboxOpen(true); }}
                  >
                    <Image src={img.url} alt={`Page ${img.pageNumber}`} fill style={{ objectFit: "cover" }} />
                    <div className={styles.pageNum}>Pg {img.pageNumber}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Lightbox */}
      {lightboxOpen && data.pageImages[currentIndex] && (
        <div className={styles.lightbox} onClick={() => setLightboxOpen(false)}>
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setLightboxOpen(false)}>×</button>
            <Image
              src={data.pageImages[currentIndex].url}
              alt="Catalogue Page"
              fill
              style={{ objectFit: "contain" }}
            />
            <div className={styles.lightboxNav}>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >←</button>
              <span className={styles.navCount}>{currentIndex + 1} / {data.pageImages.length}</span>
              <button
                className={styles.navBtn}
                onClick={() => setCurrentIndex(i => Math.min(data.pageImages.length - 1, i + 1))}
                disabled={currentIndex === data.pageImages.length - 1}
              >→</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
