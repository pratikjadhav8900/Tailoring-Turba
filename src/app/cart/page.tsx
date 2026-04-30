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

  // Wholesale threshold logic
  const isWholesale = cartCount > 10;
  
  // Calculate total price (parsing string prices like "₹115–₹140/pc" by extracting the first number)
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      // Extract numeric value from price string (e.g., "₹115–₹140/pc" -> 115)
      const priceMatch = item.price.match(/\d+/);
      const numericPrice = priceMatch ? parseInt(priceMatch[0], 10) : 0;
      return total + (numericPrice * item.quantity);
    }, 0);
  };

  const subtotal = calculateTotal();
  const designCharge = cartCount > 0 ? 250 : 0; // Base design charge (adjustable)
  const gst = cartCount > 0 ? Math.round((subtotal + designCharge) * 0.05) : 0; // 5% GST
  const estimatedTotal = subtotal + designCharge + gst;

  const handleCheckoutClick = () => {
    if (!session) {
      // Show authentication modal for guest users
      setShowAuthModal(true);
      return;
    }

    if (isWholesale) {
      // For wholesale, redirect to contact page or special quote form
      router.push('/contact?wholesale=true');
    } else {
      // For retail, proceed to checkout
      router.push('/checkout');
    }
  };

  const handleAuthSuccess = () => {
    // User successfully authenticated, proceed with checkout
    if (isWholesale) {
      router.push('/contact?wholesale=true');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={`container ${styles.main}`}>
        <div className={styles.cartHeader}>
  <h1 className={styles.title}>Your Selection</h1>
  {!session && (
    <div className={styles.guestIndicator}>
      <ShoppingBag size={16} />
      <span>Guest Cart</span>
    </div>
  )}
</div>

        {cart.length === 0 ? (
          <div className={styles.emptyCart}>
            <ShoppingBag size={48} color="var(--border-dark)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your selection yet.</p>
            <Link href="/products" className={styles.continueBtn}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItems}>
              {cart.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', color: '#9ca3af' }}>
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.itemDetails}>
                    <div className={styles.itemHeader}>
                      <div>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <span className={styles.itemCode}>Code: {item.code}</span>
                      </div>
                      <div className={styles.itemPrice}>{item.price}</div>
                    </div>
                    
                    <div style={{ marginTop: '12px' }}>
                      <span className={styles.cartQuantity}>Qty: {item.quantity}</span>
                    </div>

                    <button 
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              
              <div className={styles.summaryRow}>
                <span>Total Items</span>
                <span>{cartCount} pieces</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Design & Setup (Est.)</span>
                <span>₹{designCharge}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>GST (5%)</span>
                <span>₹{gst}</span>
              </div>
              
              <div className={`${styles.summaryRow} ${styles.total}`}>
                {isWholesale ? (
                  <span style={{ color: 'var(--tth-olive-dark)', fontSize: '0.9rem', fontWeight: '500' }}>Pricing finalized in quote</span>
                ) : (
                  <>
                    <span>Total</span>
                    <span>₹{estimatedTotal}</span>
                  </>
                )}
              </div>

              <button 
                onClick={handleCheckoutClick}
                className={styles.checkoutBtn}
                style={isWholesale ? { backgroundColor: 'var(--tth-black)' } : {}}
              >
                {isWholesale ? "Request Bulk Quote" : "Proceed to Checkout"}
              </button>

              <div className={styles.checkoutInfo}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--tth-olive-dark)' }} />
                {!session 
                  ? "Please sign in or create an account to proceed with checkout. Your cart items will be saved."
                  : isWholesale 
                    ? "Orders over 10 pieces qualify for wholesale pricing. You will be directed to our corporate team for an exact quote."
                    : "You have 10 or fewer items. You can proceed directly to standard retail checkout."
                }
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
