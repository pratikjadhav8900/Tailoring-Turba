"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trash2, AlertCircle, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";
import EmptyState from "@/components/EmptyState";

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
  
  // Logic to calculate subtotal, customization fees (per item), and GST
  const subtotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Design charge should be ₹300 for EACH unique customized product in the cart
  const customItemsCount = cart.filter(item => item.customDesign).length;
  const designCharge = customItemsCount * 300; 
  
  const gst = Math.round((subtotal + designCharge) * 0.05);
  const estimatedTotal = subtotal + designCharge + gst;

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
            <h1 className={styles.title}>Your Selection</h1>
            <div className={styles.guestIndicator}>
              <ShoppingBag size={14} />
              <span>{cartCount} Items</span>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <EmptyState 
            illustration="/illustrations/empty_cart.png"
            title="Your selection is empty"
            description="Explore our curated collections of premium corporate apparel and start building your custom range today."
            ctaText="Explore Collection"
            ctaHref="/products"
            onCtaClick={() => console.log("Analytics Event: [Empty Cart] -> [Explore Collection Clicked]")}
          />
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItems}>
              {cart.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    {item.customDesign && <span className={styles.customBadge}>Custom</span>}
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill style={{ objectFit: 'contain', padding: '10%' }} />
                    ) : (
                      <div style={{ opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <ShoppingBag size={48} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <div className={styles.itemMeta}>
                      <span className={styles.metaBadge}>{item.code}</span>
                      {item.customDesign && <span className={styles.metaBadge}>Personalized</span>}
                    </div>
                    
                    <div className={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')}</div>

                    <div className={styles.itemActions}>
                      <div className={styles.quantityDisplay}>
                        Quantity: <b>{item.quantity}</b>
                      </div>
                      <button 
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <b>₹{subtotal.toLocaleString('en-IN')}</b>
              </div>
              
              {designCharge > 0 && (
                <div className={styles.summaryRow}>
                  <span>Customization Fee</span>
                  <b>₹{designCharge}</b>
                </div>
              )}
              
              <div className={styles.summaryRow}>
                <span>Tax (GST 5%)</span>
                <b>₹{gst.toLocaleString('en-IN')}</b>
              </div>

              <div className={styles.divider} />
              
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>
                  {isWholesale ? "Est. Quote" : "Total Estimate"}
                </span>
                <span className={styles.totalValue}>
                  ₹{estimatedTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button onClick={handleCheckoutClick} className={styles.checkoutBtn}>
                {isWholesale ? "Request Bulk Quote" : "Secure Checkout"}
              </button>

              <div className={styles.checkoutInfo}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--tth-olive-dark)' }} />
                <span>
                  {isWholesale 
                    ? "As a B2B order (50+ units), this qualifies for bulk pricing. Our team will contact you with a final pro-forma invoice."
                    : "Standard pricing applies. Complete your order to proceed to payment."
                  }
                </span>
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
