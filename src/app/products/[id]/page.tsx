"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { allProducts } from "@/lib/products-data";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  name: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  photos: string[]; // base64 data URLs
};

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const product = allProducts.find(p => p.id === parseInt(params.id)) || allProducts[0];

  const [activeImage, setActiveImage] = useState(product.image);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = `reviews_product_${params.id}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setReviews(JSON.parse(saved));
  }, [storageKey]);

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart({
      id: Date.now().toString(),
      code: product.name,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.image
    });
    router.push("/cart");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - formPhotos.length;
    const toProcess = files.slice(0, remaining);
    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormPhotos(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // reset input so same file can be re-added if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formRating === 0 || !formText.trim()) return;

    setSubmitting(true);
    const newReview: Review = {
      id: Date.now().toString(),
      name: formName.trim(),
      rating: formRating,
      title: formTitle.trim(),
      text: formText.trim(),
      date: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      photos: formPhotos
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Reset form
    setFormName(""); setFormRating(0); setFormTitle(""); setFormText(""); setFormPhotos([]);
    setSubmitting(false);
    setSubmitted(true);
    setShowForm(false);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const renderStars = (count: number, interactive = false) =>
    Array.from({ length: 5 }, (_, i) => {
      const filled = interactive ? i < (formHoverRating || formRating) : i < Math.round(count);
      return (
        <span
          key={i}
          style={{ color: filled ? "#F59E0B" : "#e5e7eb", fontSize: interactive ? "1.75rem" : "1rem", cursor: interactive ? "pointer" : "default", transition: "color 0.1s" }}
          onClick={interactive ? () => setFormRating(i + 1) : undefined}
          onMouseEnter={interactive ? () => setFormHoverRating(i + 1) : undefined}
          onMouseLeave={interactive ? () => setFormHoverRating(0) : undefined}
        >★</span>
      );
    });

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0
  }));

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className="container" style={{ paddingTop: "120px", paddingBottom: "16px" }}>
          <nav style={{ fontSize: "0.85rem", color: "#94a3b8", display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href="/products" style={{ color: "#94a3b8", textDecoration: "none" }}>Products</Link>
            <span>/</span>
            <span style={{ color: "#1e293b", fontWeight: 600 }}>{product.name}</span>
          </nav>
        </div>

        {/* Hero Product Section */}
        <div className={`container ${styles.layout}`}>
          {/* Main Image */}
          <div className={styles.mainImageContainer}>
            <Image src={activeImage} alt={product.name} fill style={{ objectFit: "cover" }} priority />
            {product.badge && (
              <span style={{ position: "absolute", top: 16, left: 16, background: "var(--accent)", color: "white", padding: "6px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className={styles.thumbnailStrip}>
            {relatedProducts.slice(0, 4).map((p, i) => (
              <button key={i} className={`${styles.thumbnailBtn} ${activeImage === p.image ? styles.active : ""}`} onClick={() => setActiveImage(p.image)} title={p.name}>
                <Image src={p.image} alt={p.name} fill style={{ objectFit: "cover" }} />
              </button>
            ))}
          </div>

          {/* Details */}
          <div className={styles.detailsContainer}>
            <div>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.06em" }}>{product.type}</span>
              <h1 className={styles.title}>{product.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div>{renderStars(averageRating)}</div>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {reviews.length > 0 ? `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length > 1 ? "s" : ""})` : "No reviews yet"}
                </span>
              </div>
            </div>

            <div>
              <div className={styles.price}>{product.price}</div>
              <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600, marginTop: "4px" }}>✓ Wholesale / Bulk Eligible</div>
            </div>

            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#475569", display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "1.2rem" }}>📦</span>
              <div>
                <strong style={{ color: "#1e293b" }}>Bulk orders available</strong>
                <div style={{ marginTop: "4px", fontSize: "0.8rem" }}>Dispatches based on customization timeline. Branding available.</div>
              </div>
            </div>

            <div className={styles.actions}>
              <div className={styles.qtyRow}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>Qty:</span>
                <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} min={1} className={styles.qtyInput} />
              </div>
              <button className={styles.btnCart} onClick={handleAddToCart}>Add to Cart</button>
              <Link href={`/contact?product=${product.name}`} className={styles.btnInquire}>Request Bulk Quote</Link>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {["🏷️ GST Invoice included", "🔁 Hassle-free returns within 7 days", "🎨 Custom branding & logo printing available", "🚚 Pan-India delivery"].map((ft, i) => (
                <div key={i} style={{ fontSize: "0.85rem", color: "#64748b" }}>{ft}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section style={{ background: "#f8fafc", marginTop: "80px", padding: "64px 0" }}>
            <div className="container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>Similar Products</h2>
                  <p style={{ color: "#64748b", fontSize: "0.95rem" }}>From the same {product.category} collection</p>
                </div>
                <Link href="/products" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>View All →</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {relatedProducts.map(rp => (
                  <Link key={rp.id} href={`/products/${rp.id}`} style={{ textDecoration: "none" }}>
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                    >
                      <div style={{ height: "200px", position: "relative", background: "#f1f5f9" }}>
                        <Image src={rp.image} alt={rp.name} fill style={{ objectFit: "cover" }} />
                        {rp.badge && (<span style={{ position: "absolute", top: 10, right: 10, background: "var(--accent)", color: "white", fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase" }}>{rp.badge}</span>)}
                      </div>
                      <div style={{ padding: "16px" }}>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>{rp.type}</div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>{rp.name}</h3>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>{rp.price}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section style={{ padding: "64px 0", borderTop: "1px solid #f1f5f9" }}>
          <div className="container">
            {/* Header Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Customer Reviews</h2>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Verified purchases only</p>
              </div>
              <button
                onClick={() => { setShowForm(f => !f); setSubmitted(false); }}
                style={{ background: showForm ? "#f1f5f9" : "#0f172a", color: showForm ? "#1e293b" : "white", border: "1px solid #e2e8f0", padding: "11px 22px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", transition: "all 0.15s" }}
              >
                {showForm ? "← Cancel" : "Write a Review"}
              </button>
            </div>

            {/* Success Banner */}
            {submitted && (
              <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: "10px", padding: "16px 24px", marginBottom: "32px", color: "#065f46", fontWeight: 600 }}>
                ✅ Thank you! Your review has been submitted successfully.
              </div>
            )}

            {/* Write Review Form */}
            {showForm && (
              <form onSubmit={handleSubmitReview} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "32px", marginBottom: "48px" }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "24px" }}>Share Your Experience</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px", color: "#1e293b" }}>Your Name *</label>
                    <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Priya Sharma"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px", color: "#1e293b" }}>Review Title</label>
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Excellent corporate gift"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "8px", color: "#1e293b" }}>Your Rating *</label>
                  <div style={{ display: "flex", gap: "4px" }}>{renderStars(formRating, true)}</div>
                  {formRating === 0 && <span style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "4px", display: "block" }}>Please select a star rating</span>}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px", color: "#1e293b" }}>Your Review *</label>
                  <textarea required value={formText} onChange={e => setFormText(e.target.value)} rows={4} placeholder="What did you like or dislike? How was the quality and delivery?"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box" }} />
                </div>

                {/* Photo Upload */}
                <div style={{ marginBottom: "28px" }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "8px", color: "#1e293b" }}>
                    Add Photos <span style={{ color: "#94a3b8", fontWeight: 400 }}>(max 5)</span>
                  </label>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {formPhotos.map((photo, i) => (
                      <div key={i} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt={`upload-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => setFormPhotos(p => p.filter((_, j) => j !== i))}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      </div>
                    ))}
                    {formPhotos.length < 5 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ width: "80px", height: "80px", borderRadius: "8px", border: "2px dashed #cbd5e1", background: "#f8fafc", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", color: "#64748b", fontSize: "0.75rem" }}>
                        <span style={{ fontSize: "1.5rem" }}>📷</span>
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: "none" }} />
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "8px" }}>JPG, PNG, WEBP supported. Max 5 photos.</p>
                </div>

                <button type="submit" disabled={submitting || formRating === 0}
                  style={{ background: "var(--accent)", color: "white", border: "none", padding: "14px 32px", borderRadius: "8px", fontWeight: 700, cursor: submitting || formRating === 0 ? "not-allowed" : "pointer", opacity: submitting || formRating === 0 ? 0.6 : 1, fontSize: "1rem" }}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "48px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "32px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                    No reviews yet for this product
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "#64748b", maxWidth: "400px", lineHeight: 1.6 }}>
                    Share your experience to help other customers make an informed decision. Your review takes less than 2 minutes.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  style={{ background: "#0f172a", color: "white", border: "none", padding: "14px 28px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  Be the First to Review
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "64px", flexWrap: "wrap" }}>
                {/* Rating Summary */}
                <div style={{ minWidth: "220px" }}>
                  <div style={{ fontSize: "4rem", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{averageRating.toFixed(1)}</div>
                  <div style={{ margin: "8px 0" }}>{renderStars(averageRating)}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "24px" }}>Based on {reviews.length} review{reviews.length > 1 ? "s" : ""}</div>
                  {ratingDist.map(r => (
                    <div key={r.star} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: "30px" }}>{r.star} ★</span>
                      <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ width: `${r.pct}%`, height: "100%", background: "#F59E0B", borderRadius: "999px" }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8", minWidth: "28px" }}>{r.count}</span>
                    </div>
                  ))}
                </div>

                {/* Individual Reviews */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{ padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", gap: "14px", marginBottom: "12px", alignItems: "flex-start" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
                          {review.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>{review.name}</div>
                          {review.title && <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>{review.title}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div>{renderStars(review.rating)}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>{review.date}</div>
                        </div>
                      </div>
                      <p style={{ color: "#475569", lineHeight: 1.6, fontSize: "0.9rem", margin: "0 0 16px" }}>{review.text}</p>
                      {review.photos.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {review.photos.map((photo, pi) => (
                            <button key={pi} onClick={() => setLightboxImg(photo)} style={{ padding: 0, background: "none", border: "none", cursor: "pointer" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo} alt={`review-photo-${pi}`} style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Photo Lightbox */}
        {lightboxImg && (
          <div onClick={() => setLightboxImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxImg} alt="review photo" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} />
            <button onClick={() => setLightboxImg(null)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: "2rem", cursor: "pointer", borderRadius: "50%", width: "44px", height: "44px" }}>×</button>
          </div>
        )}
      </main>
    </>
  );
}
