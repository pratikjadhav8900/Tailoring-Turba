"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import styles from "./page.module.css";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { Receipt, RotateCcw, Brush, Truck, Package, ShieldCheck, Lock, Award, ArrowRightLeft, Check, Heart, MapPin, Tag, Calendar, X, ShoppingBag, ChevronRight } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getResizedCloudinaryUrl } from "@/lib/cloudinary-client";
import { getProductStructuredColors } from "@/lib/customizer-utils";
import toast from "react-hot-toast";

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
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const minQty = Math.max(product.minOrderQuantity || 0, 10);
  const configKey = `tt_product_config_${product.id}`;

  const [qty, setQty] = useState<number | string>(minQty);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const imageGridRef = useRef<HTMLDivElement>(null);

  // Initialize selectedColor on product change
  useEffect(() => {
    const structuredColors = getProductStructuredColors(product);
    if (structuredColors && structuredColors.length > 0) {
      setSelectedColor(structuredColors[0]);
    } else {
      setSelectedColor(null);
    }
  }, [product]);

  // Scroll to start of images gallery on selected color change
  useEffect(() => {
    if (imageGridRef.current) {
      imageGridRef.current.scrollLeft = 0;
    }
    setCurrentMobileSlide(0);
  }, [selectedColor]);

  const basePresets = [10, 20, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 5000];
  const quickQuantities = Array.from(new Set([
    minQty,
    ...basePresets.filter(q => q > minQty)
  ])).sort((a, b) => a - b);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxZoomed, setLightboxZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('details');

  // E-commerce state additions
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"success" | "error" | null>(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState("");
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  // Restore saved config for this specific product on mount/id change
  useEffect(() => {
    try {
      const savedConfig = sessionStorage.getItem(configKey);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.qty !== undefined) {
          setQty(Math.max(minQty, Number(parsed.qty) || minQty));
        }
        if (parsed.selectedSize !== undefined) {
          setSelectedSize(parsed.selectedSize);
        }
      }
    } catch (e) {
      console.error("Failed to load saved product config:", e);
    }
  }, [product.id, minQty, configKey]);

  // Save config to sessionStorage when qty or selectedSize changes
  useEffect(() => {
    try {
      const numQty = typeof qty === 'number' ? qty : (parseInt(qty as string) || minQty);
      sessionStorage.setItem(configKey, JSON.stringify({ qty: numQty, selectedSize }));
    } catch (e) {
      console.error("Failed to save product config:", e);
    }
  }, [qty, selectedSize, configKey, minQty]);

  const handleDecrementQty = () => {
    const current = typeof qty === 'number' ? qty : (parseInt(qty as string) || minQty);
    setQty(Math.max(minQty, current - 1));
  };

  const handleIncrementQty = () => {
    const current = typeof qty === 'number' ? qty : (parseInt(qty as string) || minQty);
    setQty(current + 1);
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919022553346";
  const sampleMessage = `Hi Tailoring Turba! I'm interested in requesting a sample for: ${product.name} (ID: ${product.id}).${selectedSize ? ` Size: ${selectedSize}.` : ""} Requested Quantity: ${qty || 10}.`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(sampleMessage)}`;

  const structuredColors = getProductStructuredColors(product);

  const baseGallery: string[] = product.gallery && product.gallery.length > 0
    ? [...product.gallery]
    : (product.image ? [product.image] : []);

  let mappedUrls: string[] = [];
  if (selectedColor && Array.isArray(selectedColor.imageUrls) && selectedColor.imageUrls.length > 0) {
    mappedUrls = selectedColor.imageUrls.filter(Boolean);
  } else if (selectedColor && (selectedColor.image || selectedColor.imageUrl)) {
    const single = String(selectedColor.image || selectedColor.imageUrl).trim();
    if (single) mappedUrls = [single];
  }

  // Prepend selected color's mapped image(s) to the front, followed by remaining product images
  let imagesList: string[] = [...baseGallery];
  if (mappedUrls.length > 0) {
    const remaining = baseGallery.filter(url => !mappedUrls.includes(url));
    imagesList = [...mappedUrls, ...remaining];
  }

  if (imagesList.length === 0 && product.image) {
    imagesList = [product.image];
  }

  const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : (product.category?.toLowerCase().includes("shirt") || product.name?.toLowerCase().includes("shirt")
        ? ["38", "40", "42", "44", "46", "48"]
        : ["S", "M", "L", "XL", "2XL", "3XL"]);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus("error");
      setDeliveryEstimate("");
      return;
    }

    setIsCheckingPincode(true);
    setTimeout(() => {
      setIsCheckingPincode(false);
      setPincodeStatus("success");
      // Estimate: 4 days from today
      const date = new Date();
      date.setDate(date.getDate() + 4);
      const day = date.toLocaleDateString("en-IN", { weekday: 'long' });
      const month = date.toLocaleDateString("en-IN", { month: 'short' });
      const num = date.getDate();
      setDeliveryEstimate(`${day}, ${num} ${month}`);
    }, 600);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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
    window.scrollTo(0, 0);
  }, [product.id]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setReviews(JSON.parse(saved));
  }, [storageKey]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size before adding to the bag.");
      return;
    }
    const finalQty = Math.max(minQty, parseInt(qty as string) || minQty);
    addToCart({
      id: `${product.id}-${selectedSize}`,
      productId: product.id,
      code: product.code || product.name,
      name: `${product.name} (Size ${selectedSize})`,
      price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^\d.]/g, '')) || 0,
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
          style={{ color: filled ? "#10b981" : "#e5e7eb", fontSize: interactive ? "1.75rem" : "1rem", cursor: interactive ? "pointer" : "default", transition: "color 0.1s" }}
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

  const isCustomizable = Boolean(
    (product.type?.toLowerCase().includes("polo") || 
     product.type?.toLowerCase().includes("round neck") || 
     product.type?.toLowerCase().includes("t-shirt") ||
     product.type?.toLowerCase().includes("crewneck") ||
     product.type?.toLowerCase().includes("oversize") ||
     product.type?.toLowerCase().includes("hoodie") ||
     product.type?.toLowerCase().includes("jacket") ||
     product.name?.toLowerCase().includes("t-shirt") ||
     product.name?.toLowerCase().includes("polo") ||
     product.name?.toLowerCase().includes("crewneck") ||
     product.name?.toLowerCase().includes("hoodie")) &&
    !(
      (product.category?.toLowerCase().includes("shirt") && !product.category?.toLowerCase().includes("t-shirt")) ||
      (product.name?.toLowerCase().includes("shirt") && !product.name?.toLowerCase().includes("t-shirt"))
    )
  );

  const getProductDescription = () => {
    if (product.description && product.description.trim().length > 10) {
      return product.description;
    }
    
    const category = product.category?.toLowerCase() || "";
    const name = product.name?.toLowerCase() || "";
    
    if (category.includes("polo") || name.includes("polo")) {
      return `This premium custom corporate polo is designed for maximum daily comfort and team presentation. Featuring durable double-needle stitching, rich fabric weight, and excellent color fastness. Ready for custom logo embroidery or printing.`;
    }
    if (category.includes("t-shirt") || name.includes("t-shirt") || name.includes("crewneck") || name.includes("round neck")) {
      return `A classic crewneck custom t-shirt engineered for daily comfort and brand promotions. Made from combed, bio-washed cotton/dryfit fibers to ensure a soft skin-feel and superior print results.`;
    }
    if (category.includes("shirt") || name.includes("shirt")) {
      return `A classic shirting essential tailored for professional boardroom meetings and smart-casual corporate attire. Crafted with high-grade shirting fibers, offering a clean, breathable structure that keeps you sharp all day.`;
    }
    if (category.includes("hoodie") || name.includes("hoodie") || name.includes("jacket") || category.includes("winter")) {
      return `Keep your team warm with this premium winterwear collection. Featuring heavyweight fleece poly-cotton fabric, sturdy lining, and a comfortable relaxed fit. Perfect for corporate gifting and employee kits.`;
    }
    if (category.includes("trouser") || name.includes("trouser") || name.includes("pant")) {
      return `Premium formal trousers constructed with stretch-infused poly-viscose fabric for optimal comfort and crease-resistance. Features tailored pocketing and waistband details suitable for standard boardroom dressing.`;
    }
    
    return `Premium custom apparel tailored for corporate branding, team uniforms, and promotional merchandise. Crafted from hand-selected fabrics to ensure excellent wearability, durability, and printing compliance.`;
  };

  const specs = [
    { label: "Product Type", value: product.productType || "Corporate Garment" },
    { label: "Quality Tier", value: product.qualityTier || "Standard Commercial" },
    { label: "Fabric", value: product.fabric || product.fabricComposition || (product.features?.[0]?.includes("GSM") ? product.features[0].split(" ").slice(2).join(" ") : product.features?.[0]) || "100% Combed Cotton" },
    { label: "Fabric Weight", value: product.gsm ? `${product.gsm} GSM` : (product.features?.find((f: string) => f.includes("GSM"))?.split(" ")?.[0] || "220 GSM") },
    { label: "Fit", value: product.fit || (product.name?.toLowerCase().includes("oversize") ? "Oversized Fit" : "Regular Fit") },
    { label: "Collar / Neck", value: product.neckType || (product.name?.toLowerCase().includes("polo") ? "Polo Collar" : product.name?.toLowerCase().includes("hood") ? "Hooded" : "Round Neck") },
    { label: "Sleeve Type", value: product.sleeveType || (product.name?.toLowerCase().includes("t-shirt") || product.name?.toLowerCase().includes("polo") ? "Half Sleeve" : "Full Sleeve") },
    { label: "Pattern", value: product.pattern || "Solid / Plain" },
    { label: "Occasion", value: product.collection || "Corporate / Casual" },
    { label: "Country of Origin", value: product.countryOfOrigin || "India" }
  ];

  return (
    <>
      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumbContainer}>
          <nav className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href="/products" className={styles.breadcrumbLink}>Products</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{product.name}</span>
          </nav>
        </div>

        {/* Hero Product Section */}
        <div className={styles.layout}>
          {/* LEFT COLUMN: Multi-Image Scroll Gallery */}
          <div className={styles.leftColumn}>
            {product.badge && (
              <span className={styles.productBadge}>
                {product.badge}
              </span>
            )}
            <div className={styles.mobileSliderWrapper}>
              <div 
                ref={imageGridRef}
                className={styles.imageGrid}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  if (target.clientWidth > 0) {
                    const index = Math.round(target.scrollLeft / target.clientWidth);
                    setCurrentMobileSlide(index);
                  }
                }}
              >
                {imagesList.map((img: string, i: number) => (
                  <div 
                    key={i} 
                    className={styles.gridImageWrap}
                    onClick={() => {
                      setLightboxImg(img);
                      setLightboxZoomed(false);
                    }}
                    style={{ cursor: "zoom-in" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getResizedCloudinaryUrl(img, 800, 1000)}
                      alt={`${product.name} view ${i + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
              {imagesList.length > 1 && (
                <>
                  <div className={styles.mobileSlideBadge}>
                    {currentMobileSlide + 1} / {imagesList.length}
                  </div>
                  <div className={styles.mobileSliderDots}>
                    {imagesList.map((_: any, i: number) => (
                      <span 
                        key={i} 
                        className={`${styles.sliderDot} ${currentMobileSlide === i ? styles.activeDot : ""}`} 
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky E-commerce Purchasing Panel */}
          <div className={styles.detailsContainer}>
            <div>
              <span className={styles.categoryLabel}>{product.category}</span>
              <h1 className={styles.title} style={{ fontFamily: "var(--font-sans), sans-serif", fontWeight: 800, fontSize: "1.5rem" }}>
                {product.brand || "Tailoring Turba"}
              </h1>
              <p className={styles.typeLabel} style={{ fontSize: "1.1rem", color: "#475569", fontWeight: 400, marginTop: "4px" }}>
                {product.name}
              </p>
              
              {/* Myntra-Style Floating Ratings Badge - Only shown if there are real reviews */}
              {reviews.length > 0 && (
                <div 
                  className={styles.ratingsBadge}
                  onClick={() => {
                    const elem = document.getElementById("reviews-section-anchor");
                    if (elem) elem.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {averageRating.toFixed(1)}
                    <span className={styles.ratingsBadgeStar}>★</span>
                  </span>
                  <span className={styles.ratingsBadgeCount}>
                    {reviews.length} {reviews.length === 1 ? "Rating" : "Ratings"}
                  </span>
                </div>
              )}
            </div>

            {/* Price Displays with strike-through MRP and Percentage Discount */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                <span className={styles.price} style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
                </span>
                <span className={styles.mrpText}>
                  MRP ₹{Math.round((typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^\d.]/g, '')) || 0) * 1.5).toLocaleString('en-IN')}
                </span>
                <span className={styles.discountText}>
                  (33% OFF)
                </span>
              </div>
              <div className={styles.taxLabel}>inclusive of all taxes</div>
              
              <div className={styles.stockBadge} style={{ marginTop: "16px" }}>
                <div className={styles.stockPulse} />
                <span>500+ Units Ready for Dispatch</span>
              </div>
            </div>

            {/* Structured Color Swatch Selector */}
            {structuredColors && structuredColors.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Select Color: <span style={{ fontWeight: 500, color: "#64748b" }}>{selectedColor?.name || ""}</span>
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {structuredColors.map((color: any) => {
                    const isSelected = (selectedColor?.value && color.value && selectedColor.value.toUpperCase() === color.value.toUpperCase()) || 
                      (selectedColor?.name && color.name && selectedColor.name.toLowerCase() === color.name.toLowerCase());
                    const isWhite = color.value?.toUpperCase() === "#FFFFFF" || color.value?.toUpperCase() === "#FFF";

                    return (
                      <button
                        key={`${color.name}-${color.value}`}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: color.value,
                          border: isSelected 
                            ? "2px solid #000" 
                            : (isWhite ? "1px solid #cbd5e1" : "1px solid rgba(0,0,0,0.15)"),
                          boxShadow: isSelected ? "0 0 0 2px #fff, 0 0 0 4px #000" : "inset 0 0 0 1px rgba(0,0,0,0.05)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          padding: 0
                        }}
                        title={`${color.name} (${color.value})`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Circular Size Selector */}
            <div className={styles.sizeContainer}>
              <div className={styles.sizeHeader}>
                <span className={styles.sizeLabel}>Select Size</span>
                <button 
                  type="button" 
                  className={styles.sizeChartLink}
                  onClick={() => setShowSizeChart(true)}
                >
                  SIZE CHART <ChevronRight size={14} />
                </button>
              </div>
              <div className={styles.sizeGrid}>
                {availableSizes.map((size: string) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.sizeButton} ${selectedSize === size ? styles.sizeButtonActive : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty Input & Action Buttons */}
            <div className={styles.actions} style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", marginTop: "12px" }}>
              <div className={styles.qtyRow} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1e293b", letterSpacing: "0.05em", textTransform: "uppercase", marginRight: "4px" }}>Qty:</span>
                <button
                  type="button"
                  className={styles.qtyStepperBtn}
                  onClick={handleDecrementQty}
                  disabled={(typeof qty === 'number' ? qty : (parseInt(qty as string) || minQty)) <= minQty}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={qty} 
                  onChange={(e) => setQty(e.target.value === '' ? '' : parseInt(e.target.value) || '')} 
                  onBlur={() => setQty(Math.max(minQty, parseInt(qty as string) || minQty))} 
                  min={minQty} 
                  className={styles.qtyInput} 
                />
                <button
                  type="button"
                  className={styles.qtyStepperBtn}
                  onClick={handleIncrementQty}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Quick Qty Scroller */}
              <div className={styles.qtyScrollerContainer}>
                <div className={styles.qtyScrollerHeader}>
                  <span className={styles.qtyScrollerLabel}>Quick Select Qty:</span>
                </div>
                <div className={styles.qtyScroller}>
                  {quickQuantities.map((q) => {
                    const isActive = Number(qty) === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        className={`${styles.qtyPill} ${isActive ? styles.qtyPillActive : ""}`}
                        onClick={() => setQty(q)}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Myntra-Style Primary Add to Bag & Wishlist Action Row */}
              <div className={styles.actionRowFlex}>
                <button className={styles.btnCartBag} onClick={handleAddToCart}>
                  <ShoppingBag size={18} />
                  Add To Bag
                </button>
                <button 
                  className={styles.btnWishlistCard} 
                  onClick={() => toggleWishlist(product)}
                  style={{ color: isInWishlist(product.id) ? "#ef4444" : "#1e293b" }}
                >
                  <Heart size={18} fill={isInWishlist(product.id) ? "#ef4444" : "none"} />
                  {isInWishlist(product.id) ? "Shortlisted" : "Wishlist"}
                </button>
              </div>

              {/* Design Studio, Sample Request, and Inquiries */}
              <div style={{ display: "grid", gridTemplateColumns: isCustomizable ? "1fr 1fr" : "1fr", gap: "12px", marginTop: "8px" }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSample}
                  style={{ textDecoration: 'none', textAlign: 'center', borderRadius: "6px" }}
                >
                  Request Sample
                </a>
                {isCustomizable && (() => {
                  const studioUrl = `/customizer?id=${product.id}` +
                    (product.productType ? `&productType=${encodeURIComponent(product.productType)}` : "") +
                    (selectedColor ? `&colorName=${encodeURIComponent(selectedColor.name)}&colorValue=${encodeURIComponent(selectedColor.value)}` : "");
                  return (
                    <Link href={studioUrl} className={styles.btnStudio} style={{ textDecoration: 'none', textAlign: 'center', borderRadius: "6px" }}>
                      Design Studio
                    </Link>
                  );
                })()}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                <button 
                  onClick={() => isInCompare(product.id) ? removeFromCompare(product.id) : addToCompare(product)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: isInCompare(product.id) ? "#f8fafc" : "white",
                    color: "#1e293b",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  {isInCompare(product.id) ? (
                    <><Check size={18} color="#10b981" /> Added to Compare</>
                  ) : (
                    <><ArrowRightLeft size={18} /> Add to Compare</>
                  )}
                </button>
                <Link href={`/contact?product=${product.name}`} className={styles.btnInquire} style={{ borderRadius: "8px", padding: "14px" }}>
                  Request Bulk Quote
                </Link>
              </div>
            </div>

            {/* Interactive Delivery Pincode Checker */}
            <div className={styles.pincodeContainer}>
              <span className={styles.pincodeTitle}>
                <MapPin size={16} /> Delivery Options
              </span>
              <form onSubmit={handleCheckPincode} className={styles.pincodeForm}>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter pincode (e.g. 400001)"
                  className={styles.pincodeInput}
                />
                <button type="submit" className={styles.pincodeBtn}>
                  {isCheckingPincode ? "..." : "Check"}
                </button>
              </form>

              {pincodeStatus === "success" && (
                <div className={styles.pincodeResult}>
                  <div className={styles.pincodeSuccess}>
                    <Check size={16} /> Deliverable Pincode
                  </div>
                  <ul className={styles.deliveryDetailList}>
                    <li className={styles.deliveryDetailItem}>
                      <Calendar size={15} className={styles.deliveryIcon} />
                      <span>Get it by <strong>{deliveryEstimate}</strong></span>
                    </li>
                    <li className={styles.deliveryDetailItem}>
                      <Truck size={15} className={styles.deliveryIcon} />
                      <span>Standard Shipping (Free on orders above ₹1,000)</span>
                    </li>
                    <li className={styles.deliveryDetailItem}>
                      <Package size={15} className={styles.deliveryIcon} />
                      <span>Cash on Delivery available</span>
                    </li>
                  </ul>
                </div>
              )}

              {pincodeStatus === "error" && (
                <div className={styles.pincodeResult}>
                  <div className={styles.pincodeError}>
                    ❌ Please enter a valid 6-digit postal code.
                  </div>
                </div>
              )}
            </div>

            {/* Coupons & Bank Offers */}
            <div className={styles.offersContainer}>
              <span className={styles.offersTitle}>
                <Tag size={16} /> Best Offers & Coupons
              </span>
              <div className={styles.offersList}>
                <div className={styles.offerItem}>
                  <span className={styles.offerBadge}>Bulk Discount</span>
                  <div>
                    Buy 50+ items and get <strong>20% OFF</strong> automatically. Use Code <strong className={styles.offerCode}>TURBABULK</strong> at checkout.
                  </div>
                </div>
                <div className={styles.offerItem}>
                  <span className={styles.offerBadge}>Bank Offer</span>
                  <div>
                    Flat <strong>10% Instant Discount</strong> on BOB Credit Cards on a min spend of ₹3,500. Max discount ₹1,000.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Content Section - Accordion Design */}
        <section className={styles.editorialSection}>
          <div className="container">
            <div className={styles.accordionContainer}>
              
              {/* 1. Product Details */}
              <div className={styles.accordionItem}>
                <button className={styles.accordionHeader} onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}>
                  <div className={styles.headerLabelGroup}>
                    <span className={styles.headerNumber}>01</span>
                    <span className={styles.headerLabel}>PRODUCT DETAILS & CRAFTSMANSHIP</span>
                  </div>
                  <span className={styles.accordionIcon}>{openAccordion === 'details' ? '—' : '+'}</span>
                </button>
                {openAccordion === 'details' && (
                  <div className={styles.accordionContent}>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailsStory} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <p className={styles.description} style={{ margin: 0 }}>{getProductDescription()}</p>
                        
                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", marginTop: "4px" }}>
                          <h5 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Material & Care</h5>
                          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                            {product.name?.toLowerCase().includes("dryfit") || product.type?.toLowerCase().includes("dryfit")
                              ? "100% Micro Polyester Dryfit fabric. Machine wash cold with like colors, do not iron on print."
                              : "100% Premium Combed Cotton, Bio-Washed. Machine wash cold, tumble dry low."}
                          </p>
                        </div>
                        
                        <div className={styles.policyStripCompact} style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                          <div className={styles.policyItem}><RotateCcw size={14} /> 7-Day Inspection Period</div>
                          <div className={styles.policyItem}><Brush size={14} /> Custom Branding Available</div>
                        </div>
                      </div>
                      <div className={styles.detailsSpecs} style={{ flexGrow: 1 }}>
                        <h4 className={styles.specTitle}>PRODUCT SPECIFICATIONS</h4>
                        <div className={styles.specsTable}>
                          {specs.map((s, i) => (
                            <div key={i} className={styles.specRow}>
                              <span className={styles.specLabel}>{s.label}</span>
                              <span className={styles.specValue}>{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Wholesale & Pricing */}
              <div className={styles.accordionItem}>
                <button className={styles.accordionHeader} onClick={() => setOpenAccordion(openAccordion === 'wholesale' ? null : 'wholesale')}>
                  <div className={styles.headerLabelGroup}>
                    <span className={styles.headerNumber}>02</span>
                    <span className={styles.headerLabel}>WHOLESALE PRICING & MOQS</span>
                  </div>
                  <span className={styles.accordionIcon}>{openAccordion === 'wholesale' ? '—' : '+'}</span>
                </button>
                {openAccordion === 'wholesale' && (
                  <div className={styles.accordionContent}>
                    <div className={styles.wholesaleGrid}>
                      <div className={styles.pricingTableCard}>
                        <div className={styles.pricingTable}>
                          <div className={styles.tableRow} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "12px", fontWeight: 700, color: "#94a3b8", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                            <span>VOLUME QUANTITY</span>
                            <span>UNIT PRICE (INR)</span>
                          </div>
                          <div className={styles.tableRow}>
                            <span>{minQty}+ units (MOQ)</span>
                            <span className={styles.priceHighlight}>₹{typeof product.price === 'number' ? product.price : product.price}</span>
                          </div>
                          <div className={styles.tableRow}>
                            <span>100+ units</span>
                            <span className={styles.priceHighlight}>₹{typeof product.price === 'number' ? Math.round(product.price * 0.8) : Math.round(parseFloat(String(product.price).replace(/[^\d.]/g, '')) * 0.8)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.samplingPromo}>
                        <h4 className={styles.samplingTitle}>QUALITY ASSURANCE</h4>
                        <p className={styles.samplingText}>Request a production-grade sample to verify fit and finish. Sample cost is fully credited against your subsequent bulk order.</p>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnSampleMinimal}
                        >
                          Request Sample Pack →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Logistics & Compliance */}
              <div className={styles.accordionItem}>
                <button className={styles.accordionHeader} onClick={() => setOpenAccordion(openAccordion === 'logistics' ? null : 'logistics')}>
                  <div className={styles.headerLabelGroup}>
                    <span className={styles.headerNumber}>03</span>
                    <span className={styles.headerLabel}>LOGISTICS & COMPLIANCE</span>
                  </div>
                  <span className={styles.accordionIcon}>{openAccordion === 'logistics' ? '—' : '+'}</span>
                </button>
                {openAccordion === 'logistics' && (
                  <div className={styles.accordionContent}>
                    <div className={styles.logisticsGrid}>
                      <div className={styles.logisticsInfo}>
                        <div className={styles.infoBlock}>
                          <h5 className={styles.infoTitle}>TAXATION</h5>
                          <p className={styles.infoText}>All orders include a formal GST tax invoice, enabling full input tax credit for registered businesses.</p>
                        </div>
                        <div className={styles.infoBlock}>
                          <h5 className={styles.infoTitle}>PRODUCTION TIMELINE</h5>
                          <p className={styles.infoText}>Standard dispatch within 3-5 business days for blank inventory. Custom branding requires an additional 7-10 days.</p>
                        </div>
                      </div>
                      <div className={styles.trustStripCompact}>
                        {[
                          { icon: <ShieldCheck size={18} />, title: "Made in India", sub: "Premium Sourcing" },
                          { icon: <Lock size={18} />, title: "Secure B2B Pay", sub: "100% Protection" },
                          { icon: <Award size={18} />, title: "Export Quality", sub: "Global Standards" },
                        ].map((item, i) => (
                          <div key={i} className={styles.trustItemCompact}>
                            <div className={styles.trustIcon}>{item.icon}</div>
                            <div>
                              <div className={styles.trustTitle}>{item.title}</div>
                              <div className={styles.trustSub}>{item.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

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
                  <div 
                    key={rp.id} 
                    onClick={() => router.push(`/products/${rp.id}`)}
                    style={{ padding: 0, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#ffffff" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                  >
                      <div style={{ height: "200px", position: "relative", background: "#f8fafc" }}>
                        {rp.image ? (
                           <Image src={rp.image} alt={rp.name} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 240px" />
                        ) : (
                           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No Image</div>
                        )}
                        {rp.badge && (<span style={{ position: "absolute", top: 10, right: 10, background: "var(--tth-olive-dark)", color: "white", fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase" }}>{rp.badge}</span>)}
                      </div>
                      <div style={{ padding: "16px", background: "#ffffff" }}>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>{rp.type}</div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>{rp.name}</h3>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--tth-olive-dark)" }}>₹{typeof rp.price === 'number' ? rp.price.toLocaleString('en-IN') : rp.price}</div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section id="reviews-section-anchor" style={{ padding: "48px 0 64px" }}>
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
                        <div style={{ width: `${r.pct}%`, height: "100%", background: "#10b981", borderRadius: "999px" }} />
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
          <div 
            onClick={() => {
              setLightboxImg(null);
              setLightboxZoomed(false);
            }} 
            style={{ 
              position: "fixed", 
              inset: 0, 
              background: "rgba(0,0,0,0.95)", 
              zIndex: 9999, 
              display: lightboxZoomed ? "block" : "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              overflow: lightboxZoomed ? "auto" : "hidden",
              padding: lightboxZoomed ? "40px" : "0",
              cursor: "zoom-out"
            }}
          >
            {!lightboxZoomed && (
              <span style={{
                position: "fixed",
                bottom: "30px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                pointerEvents: "none",
                zIndex: 10000,
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                Click image to zoom
              </span>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={lightboxImg} 
              alt="Zoomed view" 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxZoomed(!lightboxZoomed);
              }}
              style={
                lightboxZoomed 
                  ? { 
                      display: "block", 
                      margin: "0 auto", 
                      maxWidth: "none", 
                      maxHeight: "none", 
                      width: "180vw", 
                      height: "auto", 
                      cursor: "zoom-out",
                      transition: "width 0.2s ease"
                    }
                  : { 
                      maxWidth: "90vw", 
                      maxHeight: "90vh", 
                      objectFit: "contain", 
                      borderRadius: "8px", 
                      cursor: "zoom-in",
                      transition: "max-width 0.2s ease"
                    }
              } 
            />
            <button 
              onClick={() => {
                setLightboxImg(null);
                setLightboxZoomed(false);
              }} 
              style={{ 
                position: "fixed", 
                top: "20px", 
                right: "20px", 
                background: "rgba(255,255,255,0.15)", 
                border: "none", 
                color: "white", 
                fontSize: "2rem", 
                cursor: "pointer", 
                borderRadius: "50%", 
                width: "44px", 
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                backdropFilter: "blur(4px)"
              }}
            >
              ×
            </button>
          </div>
        )}
        {showSizeChart && (
          <div className={styles.modalOverlay} onClick={() => setShowSizeChart(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button 
                type="button" 
                className={styles.modalClose} 
                onClick={() => setShowSizeChart(false)}
              >
                <X size={18} />
              </button>
              <h3 className={styles.modalTitle}>Size Guide / Measurements</h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
                All measurements are in inches. Standard regular fit catalog shirting.
              </p>
              
              {product.category?.toLowerCase().includes("shirt") || product.name?.toLowerCase().includes("shirt") ? (
                <table className={styles.chartTable}>
                  <thead>
                    <tr>
                      <th className={styles.chartTh}>Brand Size</th>
                      <th className={styles.chartTh}>Shoulder (in)</th>
                      <th className={styles.chartTh}>Chest (in)</th>
                      <th className={styles.chartTh}>Sleeve Length (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>38 (S)</td>
                      <td className={styles.chartTd}>16.9</td>
                      <td className={styles.chartTd}>40.2</td>
                      <td className={styles.chartTd}>25.2</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>40 (M)</td>
                      <td className={styles.chartTd}>18.5</td>
                      <td className={styles.chartTd}>43.3</td>
                      <td className={styles.chartTd}>25.6</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>42 (L)</td>
                      <td className={styles.chartTd}>19.3</td>
                      <td className={styles.chartTd}>46.1</td>
                      <td className={styles.chartTd}>26.0</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>44 (XL)</td>
                      <td className={styles.chartTd}>20.5</td>
                      <td className={styles.chartTd}>48.4</td>
                      <td className={styles.chartTd}>26.4</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>46 (XXL)</td>
                      <td className={styles.chartTd}>21.3</td>
                      <td className={styles.chartTd}>51.2</td>
                      <td className={styles.chartTd}>26.8</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>48 (3XL)</td>
                      <td className={styles.chartTd}>22.4</td>
                      <td className={styles.chartTd}>53.5</td>
                      <td className={styles.chartTd}>27.2</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className={styles.chartTable}>
                  <thead>
                    <tr>
                      <th className={styles.chartTh}>Size</th>
                      <th className={styles.chartTh}>Shoulder (in)</th>
                      <th className={styles.chartTh}>Chest (in)</th>
                      <th className={styles.chartTh}>Front Length (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>S</td>
                      <td className={styles.chartTd}>16.9</td>
                      <td className={styles.chartTd}>39.0</td>
                      <td className={styles.chartTd}>26.8</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>M</td>
                      <td className={styles.chartTd}>17.7</td>
                      <td className={styles.chartTd}>40.9</td>
                      <td className={styles.chartTd}>27.6</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>L</td>
                      <td className={styles.chartTd}>18.1</td>
                      <td className={styles.chartTd}>42.9</td>
                      <td className={styles.chartTd}>28.7</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>XL</td>
                      <td className={styles.chartTd}>18.9</td>
                      <td className={styles.chartTd}>46.1</td>
                      <td className={styles.chartTd}>29.5</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>XXL</td>
                      <td className={styles.chartTd}>19.7</td>
                      <td className={styles.chartTd}>48.8</td>
                      <td className={styles.chartTd}>30.7</td>
                    </tr>
                    <tr className={styles.chartTr}>
                      <td className={styles.chartTd}>3XL</td>
                      <td className={styles.chartTd}>20.1</td>
                      <td className={styles.chartTd}>50.8</td>
                      <td className={styles.chartTd}>31.5</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
