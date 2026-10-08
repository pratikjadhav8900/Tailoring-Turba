"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trash2, ShoppingBag, ShieldCheck, Truck, RotateCcw, Tag, ChevronRight, Palette, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { useCart } from "@/contexts/CartContext";
import styles from "./page.module.css";
import EmptyState from "@/components/ui/EmptyState";
import { getElementDetails } from "@/lib/customizer-utils";
import { GARMENTS } from "@/lib/fabric-data";

export default function CartPage() {
  const { cart, removeFromCart, cartCount } = useCart();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isWholesale = cartCount >= 50;
  
  const subtotal = cart.reduce((total, item) => {
    const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;
    return total + (itemPrice * (item.quantity || 0));
  }, 0);

  const printingCharge = cart.reduce((total, item) => {
    if (!item.customDesign) return total;
    const garmentType = item.customDesign.garmentType || "round-neck";
    const frontDetails = (item.customDesign.frontElements || []).map(el => getElementDetails(el, garmentType, "front"));
    const backDetails = (item.customDesign.backElements || []).map(el => getElementDetails(el, garmentType, "back"));
    const itemPrintingCost = [...frontDetails, ...backDetails].reduce((sum, el) => sum + el.cost, 0);
    return total + (itemPrintingCost * (item.quantity || 0));
  }, 0);

  const customItemsWithEmbroideryCount = cart.filter(item => {
    if (!item.customDesign) return false;
    const elements = [
      ...(item.customDesign.frontElements || []),
      ...(item.customDesign.backElements || [])
    ];
    return elements.some(el => el.printType === "embroidery");
  }).length;

  const designCharge = customItemsWithEmbroideryCount * 300; 
  const totalCustomCharge = printingCharge + designCharge;
  const subtotalVal = isNaN(subtotal) ? 0 : subtotal;
  const gst = Math.round((subtotalVal + totalCustomCharge) * 0.05);
  const estimatedTotal = subtotalVal + totalCustomCharge + gst;

  const handleCheckoutClick = () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    router.push(isWholesale ? '/contact?wholesale=true' : '/checkout');
  };

  const handleAuthSuccess = () => {
    router.push(isWholesale ? '/contact?wholesale=true' : '/checkout');
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.main}>
        {cart.length > 0 && (
          <div className={styles.cartHeader}>
            <h1 className={styles.title}>Your Cart</h1>
            <div className={styles.guestIndicator}>
              <ShoppingBag size={14} />
              <span>{cartCount} Item{cartCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <EmptyState 
            illustration="/illustrations/empty_cart.png"
            title="Your cart is empty"
            description="Explore our curated collections of premium corporate apparel and start building your custom range today."
            ctaText="Explore Collection"
            ctaHref="/products"
            onCtaClick={() => console.log("Analytics Event: [Empty Cart] -> [Explore Collection Clicked]")}
          />
        ) : (
          <div className={styles.cartLayout}>
            {/* LEFT — Cart Items */}
            <div className={styles.cartItems}>
              {cart.map((item) => {
                const itemTotal = (item.price * (item.quantity || 0)).toLocaleString('en-IN');
                const garmentType = item.customDesign?.garmentType || "round-neck";
                const frontEls = (item.customDesign?.frontElements || []).map(el => getElementDetails(el, garmentType, "front"));
                const backEls = (item.customDesign?.backElements || []).map(el => getElementDetails(el, garmentType, "back"));
                const allEls = [...frontEls, ...backEls];
                const itemPrintCost = allEls.reduce((s, el) => s + el.cost, 0);

                return (
                  <div key={item.id} className={styles.cartItem}>
                    {/* Image */}
                    <div className={styles.itemImageContainer}>
                      {item.customDesign && <span className={styles.customBadge}>Custom</span>}
                      {item.customDesign ? (
                        <Image src={(GARMENTS as any)[garmentType]?.baseFront || (GARMENTS as any)[garmentType]?.front || item.image || ''} alt={item.name} fill style={{ objectFit: 'contain' }} />
                      ) : item.image ? (
                        <Image src={item.image} alt={item.name} fill style={{ objectFit: 'contain' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', opacity: 0.15 }}>
                          <ShoppingBag size={40} strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className={styles.itemDetails}>
                      <div className={styles.itemTopRow}>
                        <div>
                          <h3 className={styles.itemName}>{item.name}</h3>
                          <div className={styles.itemMeta}>
                            {item.code && <span className={styles.metaBadge}>{item.code}</span>}
                            {item.customDesign && <span className={`${styles.metaBadge} ${styles.metaBadgeCustom}`}><Palette size={10} /> Personalized</span>}
                          </div>
                        </div>
                        <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)} title="Remove">
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Unit price */}
                      <div className={styles.itemPrice}>
                        ₹{item.price.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#888' }}>/ unit</span>
                      </div>

                      {/* Custom print summary */}
                      {allEls.length > 0 && (
                        <div className={styles.printSummary}>
                          {allEls.map((el, i) => (
                            <div key={i} className={styles.printTag}>
                              🖨️ {(el as any).side || ''} {el.printLabel || 'Print'} — +₹{el.cost}/u
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Custom size breakdown summary */}
                      {item.customDesign?.sizes && Object.entries(item.customDesign.sizes).some(([, q]) => (q || 0) > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px', margin: '6px 0 8px 0' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Sizes:
                          </span>
                          {Object.entries(item.customDesign.sizes)
                            .filter(([, q]) => (q || 0) > 0)
                            .map(([sz, q]) => (
                              <span key={sz} style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: '#f8fafc',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                padding: '2px 8px',
                                borderRadius: '5px'
                              }}>
                                {sz} × {q}
                              </span>
                            ))}
                        </div>
                      )}

                      {/* Qty + Total row */}
                      <div className={styles.itemFooter}>
                        <div className={styles.qtyChip}>
                          <span className={styles.qtyLabel}>QTY</span>
                          <span className={styles.qtyValue}>{item.quantity}</span>
                        </div>
                        <div className={styles.itemTotalBadge}>
                          ₹{itemTotal}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Trust Signals */}
              <div className={styles.trustBar}>
                <div className={styles.trustItem}>
                  <ShieldCheck size={18} color="#16a34a" />
                  <span>Secure Checkout</span>
                </div>
                <div className={styles.trustItem}>
                  <Truck size={18} color="#2563eb" />
                  <span>Pan-India Delivery</span>
                </div>
                <div className={styles.trustItem}>
                  <RotateCcw size={18} color="#9333ea" />
                  <span>Quality Guarantee</span>
                </div>
              </div>
            </div>

            {/* RIGHT — Order Summary */}
            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              {/* Breakdown */}
              <div className={styles.breakdownList}>
                <div className={styles.summaryRow}>
                  <span>Subtotal ({cartCount} units)</span>
                  <b>₹{subtotalVal.toLocaleString('en-IN')}</b>
                </div>
                {printingCharge > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Customization Fee</span>
                    <b>₹{printingCharge.toLocaleString('en-IN')}</b>
                  </div>
                )}
                {designCharge > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Designing Charge</span>
                    <b>₹{designCharge.toLocaleString('en-IN')}</b>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Tax (GST 5%)</span>
                  <b>₹{(isNaN(gst) ? 0 : gst).toLocaleString('en-IN')}</b>
                </div>
              </div>

              <div className={styles.divider} />
              
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>
                  {isWholesale ? "Est. Quote" : "Total Estimate"}
                </span>
                <span className={styles.totalValue}>
                  ₹{(isNaN(estimatedTotal) ? 0 : estimatedTotal).toLocaleString('en-IN')}
                </span>
              </div>

              <button onClick={handleCheckoutClick} className={styles.checkoutBtn}>
                {isWholesale ? "Request Bulk Quote" : "Proceed to Checkout"}
                <ArrowRight size={16} />
              </button>

              {/* Promo / info strip */}
              <div className={styles.promoStrip}>
                <Tag size={13} color="#9333ea" />
                <span>
                  {isWholesale 
                    ? "B2B order (50+ units) — our team will send a pro-forma invoice."
                    : cartCount >= 10
                    ? "Bulk order (10+ units) — 60/40 split payment available at checkout."
                    : "Free design consultation on orders above ₹5,000."
                  }
                </span>
              </div>

              {/* Mini trust badges */}
              <div className={styles.miniTrust}>
                <div className={styles.miniTrustItem}><ShieldCheck size={14} color="#16a34a" /> Razorpay Secured</div>
                <div className={styles.miniTrustItem}><Truck size={14} color="#2563eb" /> Fast Dispatch</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        redirectTo={isWholesale ? "/contact?wholesale=true" : "/checkout"}
      />
    </div>
  );
}
