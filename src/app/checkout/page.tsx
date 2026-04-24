"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import styles from "./page.module.css";

export default function CheckoutPage() {
  const { cart, cartCount, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const priceMatch = item.price.match(/\d+/);
      const numericPrice = priceMatch ? parseInt(priceMatch[0], 10) : 0;
      return total + (numericPrice * item.quantity);
    }, 0);
  };

  const estimatedTotal = calculateTotal();

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    }, 2000);
  };

  if (!mounted) return null;

  if (isSuccess) {
    return (
      <div key="success-screen" className={styles.pageWrapper}>
        <Navbar />
        <main className={styles.successMain}>
          {/* Background Collage Elements */}
          <img 
            src="https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?q=80&w=800" 
            alt="" 
            className={`${styles.collageImg} ${styles.imgMachine}`}
          />
          <img 
            src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800" 
            alt="" 
            className={`${styles.collageImg} ${styles.imgThread}`}
          />
          <img 
            src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800" 
            alt="" 
            className={`${styles.collageImg} ${styles.imgFabric}`}
          />

          <div className={styles.successContent}>
            <CheckCircle2 size={40} className={styles.successIcon} strokeWidth={1.5} />
            <h1 className={styles.successTitle}>Order<br/>Confirmed</h1>
            <p className={styles.successText}>
              Thank you for your retail order. We have received your payment and will begin processing your items immediately. A receipt has been sent to your email.
            </p>
            <Link href="/" className={styles.homeBtn}>
              Return to Catalog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Security check: Route them to contact if somehow they accessed this directly with > 10 items
  if (cartCount > 10) {
    if (typeof window !== 'undefined') {
      window.location.href = "/contact?mode=inquiry";
    }
    return null;
  }

  return (
    <div key="checkout-form-screen" className={styles.pageWrapper}>
      <Navbar />
      
      <div className={styles.layout}>
        {/* Form Side (Left) */}
        <div className={styles.leftColumn}>
          <div className={styles.leftContent}>
            <Link href="/cart" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Cart
            </Link>
            
            <h1 className={styles.title}>
              Retail Checkout
            </h1>

            <h2 className={styles.sectionTitle}>
              Shipping Details
            </h2>
            
            <form id="checkout-form" onSubmit={handleCheckout} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>First Name</label>
                  <input type="text" required className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input type="text" required className={styles.input} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <input type="email" required className={styles.input} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Shipping Address</label>
                <input type="text" required placeholder="Street address or P.O. Box" className={styles.input} />
              </div>

              <div className={styles.formRow3}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>City</label>
                  <input type="text" required className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>State</label>
                  <select required className={styles.input}>
                    <option value="">Select</option>
                    <option value="MH">Maharashtra</option>
                    <option value="DL">Delhi</option>
                    <option value="KA">Karnataka</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>PIN Code</label>
                  <input type="text" required className={styles.input} />
                </div>
              </div>

              <h2 className={styles.sectionTitle} style={{ marginTop: '16px' }}>
                Secure Payment
              </h2>

              <div style={{ 
                padding: '20px', 
                background: 'var(--tth-offwhite)', 
                border: '1px solid var(--tth-beige-light)',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--tth-black)', fontSize: '0.95rem' }}>
                  Razorpay Secure Checkout
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--tth-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Clicking "Pay" will securely redirect you to Razorpay to complete your transaction via UPI, Cards, or Netbanking.
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Cart Summary Side (Right) */}
        <div className={styles.rightColumn}>
          <div className={styles.rightContent}>
            <h2 className={styles.sectionTitle}>
              In your cart
            </h2>

            <div className={styles.cartItems}>
              {cart.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <span className={styles.itemName}>{item.quantity}x {item.name}</span>
                  <span className={styles.itemPrice}>{item.price}</span>
                </div>
              ))}
            </div>

            <div className={styles.totalRow}>
              <span>Total</span>
              <span>₹{estimatedTotal}</span>
            </div>

            <button 
              form="checkout-form"
              type="submit"
              disabled={isProcessing}
              className={styles.payBtn}
            >
              {isProcessing ? "Processing..." : `Pay ₹${estimatedTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
