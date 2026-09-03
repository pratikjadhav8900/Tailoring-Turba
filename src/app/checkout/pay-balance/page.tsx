"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import styles from "../page.module.css";

function PayBalanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch Order Details
  useEffect(() => {
    if (!orderId) {
      setError("No Order ID provided.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch order details.");
        }
        
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchOrder();
    }
  }, [orderId, mounted]);

  const handlePayBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create Razorpay Balance Order via API
      const orderRes = await fetch("/api/razorpay/order-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to initiate balance payment.");

      // 2. Open Razorpay Modal
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Tailoring Turba",
        description: orderData.description,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify Signature via verify API
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

          // 4. Success!
          setIsSuccess(true);
          setIsProcessing(false);
        },
        prefill: {
          name: order.user?.name || "",
          email: order.user?.email || "",
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
      console.error("[BALANCE_PAY_ERROR]", err);
      setError(err.message || "An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className={styles.pageWrapper} style={{ justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="animate-spin text-olive-dark" size={48} style={{ color: "#4a5e3a", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "16px", fontFamily: "var(--font-sans)", color: "var(--tth-text-muted)" }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.pageWrapper} style={{ justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div style={{ maxWidth: "500px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-ui)", fontSize: "1.85rem", fontWeight: 700, color: "#b91c1c", marginBottom: "16px" }}>Error Loading Payment</h2>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--tth-text-muted)", marginBottom: "24px" }}>{error || "Order not found."}</p>
          <Link href="/dashboard/orders" className={styles.homeBtn} style={{ borderColor: "#b91c1c" }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.successMain}>
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
          <div className={styles.successContent}>
            <CheckCircle2 size={40} className={styles.successIcon} strokeWidth={1.5} />
            <h1 className={styles.successTitle}>Balance Paid</h1>
            <p className={styles.successText}>
              Thank you! The remaining 40% balance for Order <strong>#{order.id.slice(-8).toUpperCase()}</strong> has been successfully received. We will dispatch your order shortly and email your shipment tracking details.
            </p>
            <Link href="/dashboard/orders" className={styles.homeBtn}>
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Calculate Subtotal and GST
  const subtotal = order.items.reduce((total: number, item: any) => {
    return total + (item.price * item.quantity);
  }, 0);
  const gst = Math.round(subtotal * 0.05);

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      
      <form onSubmit={handlePayBalance} className={styles.form}>
        <div className={styles.layout}>
          {/* Left Column - Billing and Terms */}
          <div className={styles.leftColumn}>
            <div className={styles.leftContent}>
              <Link href="/dashboard/orders" className={styles.backLink}>
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>

              <h1 className={styles.title} style={{ marginBottom: "24px" }}>
                Balance Payment
              </h1>

              <div style={{ fontFamily: "var(--font-sans)", color: "var(--tth-black)" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
                  Order <strong>#{order.orderNumber || order.id.slice(-8).toUpperCase()}</strong> is fully produced and ready to ship.
                </p>
                <p style={{ color: "var(--tth-text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  Please complete the remaining 40% balance checkout. Once verified, the shipping labels will be generated and your custom apparel will leave the warehouse.
                </p>
              </div>

              <h2 className={styles.sectionTitle} style={{ marginTop: "16px" }}>
                Secure Balance Payment
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
                  Razorpay Secure Gateway
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--tth-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Clicking "Pay" will open Razorpay checkout to pay the 40% balance using Cards, UPI, or Netbanking.
                </span>
              </div>

              {/* Policy Disclaimer */}
              <div style={{ 
                padding: '16px', 
                background: '#fffbeb', 
                borderLeft: '4px solid #d97706',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, color: '#92400e', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📦 Bulk Order Split Payment Policy
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', color: '#78350f', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  • 60% Deposit has already been verified.<br/>
                  • 40% Remaining balance is due now prior to shipping.<br/>
                  • A combined invoice displaying full billing & paid details will be emailed post-payment.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Checkout Button */}
          <div className={styles.rightColumn}>
            <div className={styles.rightContent}>
              <h2 className={styles.sectionTitle}>
                Payment Summary
              </h2>

              <div className={styles.cartItems}>
                {order.items.map((item: any) => (
                  <div key={item.id} className={styles.cartItem}>
                    <span className={styles.itemName}>{item.quantity}x {item.product?.name}</span>
                    <span className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className={styles.summaryBreakdown}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Order Total Value</span>
                  <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
                  <span>60% Deposit Paid</span>
                  <span>- ₹{order.amountPaid.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className={styles.totalRow} style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "24px" }}>
                <span>40% Balance Due</span>
                <span>₹{order.remainingAmount.toLocaleString('en-IN')}</span>
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
                {isProcessing ? "Processing..." : `Pay Balance ₹${order.remainingAmount.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function PayBalancePage() {
  return (
    <Suspense fallback={
      <div className={styles.pageWrapper} style={{ justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="animate-spin text-olive-dark" size={48} style={{ color: "#4a5e3a", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <PayBalanceContent />
    </Suspense>
  );
}
