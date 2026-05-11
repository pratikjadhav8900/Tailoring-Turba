"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { INDIAN_STATES } from "@/lib/logistics";
import styles from "./page.module.css";

export default function CheckoutPage() {
  const router = useRouter();
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
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  const states = INDIAN_STATES;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setMounted(true);
    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (mounted && cartCount >= 50) {
      router.push("/contact?mode=inquiry");
    }
  }, [mounted, cartCount, router]);

  // Pincode Lookup
  useEffect(() => {
    const fetchAddress = async () => {
      const code = formData.postalCode.replace(/\s/g, '');
      if (code.length === 6 && /^\d+$/.test(code)) {
        setIsFetchingAddress(true);
        try {
          const res = await fetch(`/api/pincode/${code}`);
          const data = await res.json();
          
          if (res.ok) {
            const { city, state: stateName } = data;
            
            // Find state code
            const state = states.find(s => 
              s.name.toLowerCase().includes(stateName.toLowerCase()) || 
              stateName.toLowerCase().includes(s.name.toLowerCase())
            );
            
            setFormData(prev => ({
              ...prev,
              city: city,
              state: state ? state.code : prev.state
            }));
          }
        } catch (err) {
          console.error("Pincode fetch error:", err);
        } finally {
          setIsFetchingAddress(false);
        }
      }
    };

    fetchAddress();
  }, [formData.postalCode]);

  const subtotal = cart.reduce((total, item) => {
    const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;
    return total + (itemPrice * (item.quantity || 0));
  }, 0);
  const designCharge = cart.filter(item => {
    if (!item.customDesign) return false;
    const hasFrontElements = (item.customDesign.frontElements?.length || 0) > 0;
    const hasBackElements = (item.customDesign.backElements?.length || 0) > 0;
    const hasAssets = (item.uploadedAssets?.length || 0) > 0;
    return hasFrontElements || hasBackElements || hasAssets;
  }).length * 300;
  
  const gst = Math.round((subtotal + designCharge) * 0.05);
  const estimatedTotal = subtotal + designCharge + gst;

  const [error, setError] = useState<string | null>(null);
  
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      // 2. Create Razorpay Order via our API
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: estimatedTotal,
          currency: "INR",
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            customStateJson: item.customDesign ? JSON.stringify(item.customDesign) : undefined,
            printFiles: item.uploadedAssets || undefined,
            mockupUrl: item.customDesign ? item.image : undefined,
            mockupUrlBack: item.mockupUrlBack
          })),
          shippingAddress: {
            name: `${formData.firstName} ${formData.lastName}`,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: "India"
          },
          notes: {
            customerName: `${formData.firstName} ${formData.lastName}`,
            email: formData.email
          }
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to initiate payment.");

      // 3. Open Razorpay Modal
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Tailoring Turba",
        description: "Premium Custom Apparel Order",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          // 4. Verify Payment Signature
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error || "Payment verification failed.");
            setIsProcessing(false);
            return;
          }

          // 5. Success! The backend already updated the order.
          setIsSuccess(true);
          clearCart();
          setIsProcessing(false);
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
        },
        theme: {
          color: "#4a5e3a",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      if (!(window as any).Razorpay) {
        throw new Error("Razorpay payment gateway is not available. Please refresh the page.");
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed.");
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      console.error("[CHECKOUT_ERROR]", err);
      setError(err.message || "An unexpected error occurred.");
      setIsProcessing(false);
    }
  };


  if (!mounted || cartCount >= 50) return null;

  if (isSuccess) {
    return (
      <div className={styles.pageWrapper}>
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

  return (
    <div className={styles.pageWrapper}>
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
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    required 
                    placeholder={isFetchingAddress ? "Fetching..." : ""}
                    className={styles.input} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>State</label>
                  <div className={styles.customDropdownContainer}>
                    <button 
                      type="button"
                      className={styles.dropdownToggle}
                      onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                    >
                      {states.find(s => s.code === formData.state)?.name || "Select State"}
                    </button>
                    
                    {isStateDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        {states.map((s) => (
                          <div 
                            key={s.code} 
                            className={styles.dropdownItem}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, state: s.code }));
                              setIsStateDropdownOpen(false);
                            }}
                          >
                            {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>PIN Code {isFetchingAddress && "..."}</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required className={styles.input} maxLength={6} />
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
                    <span className={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className={styles.summaryBreakdown}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {designCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Design & Setup</span>
                    <span>₹{designCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST (5%)</span>
                  <span>₹{gst.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span>₹{estimatedTotal.toLocaleString('en-IN')}</span>
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
