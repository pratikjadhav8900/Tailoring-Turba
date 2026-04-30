"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { Receipt, RotateCcw, Brush, Truck, Package, ShieldCheck, Lock, Award } from "lucide-react";

type Review = {
  id: string;
  name: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  photos: string[];
};

export default function ProductDetailsClient({ product, relatedProducts }: { product: any, relatedProducts: any[] }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState(product.gallery?.[0] || product.image);
  const [qty, setQty] = useState<number | string>(10);
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

  const storageKey = `reviews_product_${product.id}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setReviews(JSON.parse(saved));
  }, [storageKey]);

  const handleAddToCart = () => {
    const finalQty = Math.max(10, parseInt(qty as string) || 10);
    addToCart({
      id: Date.now().toString(),
      code: product.name,
      name: product.name,
      price: product.price,
      quantity: finalQty,
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
          {/* LEFT COLUMN */}
          <div className={styles.leftColumn}>
            <div className={styles.mainImageContainer}>
              {activeImage ? (
                <Image src={activeImage} alt={product.name} fill style={{ objectFit: "cover" }} priority />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', color: '#9ca3af' }}>No Image</div>
              )}
              {product.badge && (
                <span style={{ position: "absolute", top: 16, left: 16, background: "var(--tth-olive-dark)", color: "white", padding: "6px 14px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {product.badge}
                </span>
              )}
            </div>

            {product.gallery && product.gallery.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {product.gallery.map((img: string, i: number) => (
                  <button key={i} className={`${styles.thumbnailBtn} ${activeImage === img ? styles.active : ""}`} onClick={() => setActiveImage(img)} title={`View ${i + 1}`}>
                    <Image src={img} alt={`${product.name} view ${i + 1}`} fill style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

            {product.description && (
              <div style={{ paddingTop: "32px", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px" }}>About this product</p>
                <p style={{ fontSize: "0.95rem", color: "#475569", lineHeight: 1.8, margin: 0 }}>{product.description}</p>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div style={{ paddingTop: "28px", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "14px" }}>What makes it special</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {product.features.map((f: string, i: number) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: "#334155" }}>
                      <span style={{ color: "var(--tth-olive-dark)", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.detailsContainer}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--tth-olive-dark)", letterSpacing: "0.1em" }}>{product.category}</span>
              <h1 className={styles.title}>{product.name}</h1>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 500, marginBottom: "6px", letterSpacing: "0.04em" }}>{product.type}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div>{renderStars(averageRating)}</div>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  {reviews.length > 0 ? `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length > 1 ? "s" : ""})` : "No reviews yet"}
                </span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
              <div className={styles.price}>{product.price}</div>
              <div style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 700, marginTop: "6px", letterSpacing: "0.04em" }}>✓ Wholesale / Bulk Eligible</div>
            </div>

            <div style={{ padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#475569", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Package size={16} strokeWidth={1.5} style={{ color: "var(--tth-olive-dark)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "#1e293b", fontSize: "0.88rem" }}>Bulk orders available</strong>
                <div style={{ marginTop: "3px", fontSize: "0.78rem" }}>Dispatches based on customization timeline. Branding available.</div>
              </div>
            </div>

            <div className={styles.actions}>
              <div className={styles.qtyRow}>
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b", letterSpacing: "0.04em" }}>Qty:</span>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value === '' ? '' : parseInt(e.target.value) || '')} onBlur={() => setQty(Math.max(10, parseInt(qty as string) || 10))} min={10} className={styles.qtyInput} />
              </div>
              <button className={styles.btnCart} onClick={handleAddToCart}>Add to Cart</button>
              <Link href={`/customizer?productId=${product.id}`} className={styles.btnCart} style={{ textDecoration: 'none', textAlign: 'center' }}>
                Customize in Studio
              </Link>
              <Link href={`/contact?product=${product.name}`} className={styles.btnInquire}>Request Bulk Quote</Link>
            </div>

            {/* Trust Badges Strip */}
            <div style={{ 
              marginTop: "16px", 
              padding: "16px", 
              background: "white", 
              border: "1px solid #f1f5f9", 
              borderRadius: "12px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px"
            }}>
              {[
                { icon: <Receipt size={16} />, title: "GST Invoice", sub: "Guaranteed" },
                { icon: <ShieldCheck size={16} />, title: "Made in India", sub: "Pure Quality" },
                { icon: <Lock size={16} />, title: "Secure Pay", sub: "100% Safe" },
                { icon: <Award size={16} />, title: "Certified", sub: "B2B Expert" },
              ].map((badge, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ color: "var(--tth-olive-dark)", background: "#f8fafc", padding: "6px", borderRadius: "6px" }}>{badge.icon}</div>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1e293b", lineHeight: 1 }}>{badge.title}</div>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px" }}>{badge.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "16px", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { icon: <Receipt size={14} strokeWidth={1.5} />, text: "Full GST tax invoice provided" },
                { icon: <RotateCcw size={14} strokeWidth={1.5} />, text: "Hassle-free returns within 7 days" },
                { icon: <Brush size={14} strokeWidth={1.5} />, text: "Custom branding & logo printing available" },
                { icon: <Truck size={14} strokeWidth={1.5} />, text: "Reliable Pan-India delivery" },
              ].map((ft, i) => (
                <div key={i} style={{ fontSize: "0.83rem", color: "#64748b", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "var(--tth-olive-dark)", flexShrink: 0 }}>{ft.icon}</span>
                  {ft.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section style={{ background: "#f8fafc", padding: "64px 0" }}>
            <div className="container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>Similar Products</h2>
                  <p style={{ color: "#64748b", fontSize: "0.95rem" }}>From the same {product.category} collection</p>
                </div>
                <Link href="/products" style={{ color: "var(--tth-olive-dark)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>View All →</Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
                {relatedProducts.map(rp => (
                  <Link key={rp.id} href={`/products/${rp.id}`} style={{ textDecoration: "none" }}>
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                    >
                      <div style={{ height: "200px", position: "relative", background: "#f1f5f9" }}>
                        {rp.image ? (
                           <Image src={rp.image} alt={rp.name} fill style={{ objectFit: "cover" }} />
                        ) : (
                           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No Image</div>
                        )}
                        {rp.badge && (<span style={{ position: "absolute", top: 10, right: 10, background: "var(--tth-olive-dark)", color: "white", fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase" }}>{rp.badge}</span>)}
                      </div>
                      <div style={{ padding: "16px" }}>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>{rp.type}</div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>{rp.name}</h3>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--tth-olive-dark)" }}>{rp.price}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section style={{ padding: "48px 0 64px" }}>
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
                  style={{ background: "var(--tth-olive-dark)", color: "white", border: "none", padding: "14px 32px", borderRadius: "8px", fontWeight: 700, cursor: submitting || formRating === 0 ? "not-allowed" : "pointer", opacity: submitting || formRating === 0 ? 0.6 : 1, fontSize: "1rem" }}>
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
