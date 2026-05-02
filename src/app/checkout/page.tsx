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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    postalCode: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const cleanPrice = item.price.replace(/[^\d.]/g, '');
      const numericPrice = parseFloat(cleanPrice) || 0;
      return total + (numericPrice * item.quantity);
    }, 0);
  };

  const subtotal = calculateTotal();
  const designCharge = cartCount > 0 ? 250 : 0;
  const gst = cartCount > 0 ? Math.round((subtotal + designCharge) * 0.05) : 0;
  const estimatedTotal = subtotal + designCharge + gst;

  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      // Prepare items for API
      const orderItems = cart.map(item => {
        const cleanPrice = item.price.replace(/[^\d.]/g, '');
        const numericPrice = parseFloat(cleanPrice) || 0;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: numericPrice,
          customStateJson: item.customDesign ? JSON.stringify(item.customDesign) : undefined,
          printFiles: item.uploadedAssets || undefined,
          mockupUrl: item.customDesign ? item.image : undefined,
          mockupUrlBack: item.mockupUrlBack
        };
      });

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: {
            name: `${formData.firstName} ${formData.lastName}`,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: "India"
          }
        }),
      });

      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to place order.");
      }

      setIsSuccess(true);
      clearCart();
    } catch (err: any) {
      console.error("[CHECKOUT_ERROR]", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  if (isSuccess) {
    return (
      <div key="success-screen" className={styles.pageWrapper}>
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

  // Security check: Route them to contact if somehow they accessed this directly with > 50 items
  if (cartCount >= 50) {
    if (typeof window !== 'undefined') {
      window.location.href = "/contact?mode=inquiry";
    }
    return null;
  }

  return (
    <div key="checkout-form-screen" className={styles.pageWrapper}>
      <form onSubmit={handleCheckout} className={styles.form}>
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
              
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className={styles.input} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={styles.input} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Shipping Address</label>
                <input type="text" name="street" value={formData.street} onChange={handleInputChange} required placeholder="Street address or P.O. Box" className={styles.input} />
              </div>

              <div className={styles.formRow3}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>State</label>
                  <select name="state" value={formData.state} onChange={handleInputChange} required className={styles.input}>
                    <option value="">Select</option>
                    <option value="MH">Maharashtra</option>
                    <option value="DL">Delhi</option>
                    <option value="KA">Karnataka</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>PIN Code</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required className={styles.input} />
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

              <div className={styles.summaryBreakdown}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Design & Setup</span>
                  <span>₹{designCharge}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span>₹{estimatedTotal}</span>
              </div>

              {error && (
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '12px', 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '4px',
                  color: '#b91c1c',
                  fontSize: '0.85rem'
                }}>
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={isProcessing}
                className={styles.payBtn}
              >
                {isProcessing ? "Processing..." : `Pay ₹${estimatedTotal}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
