"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";

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
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <main className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
          <div style={{ background: 'white', padding: '60px', borderRadius: '16px', border: '1px solid var(--border-light)', maxWidth: '600px', margin: '0 auto' }}>
            <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
            <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', marginBottom: '16px', color: 'var(--text-main)' }}>Order Confirmed!</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Thank you for retail order. We have received your payment and will begin processing your items immediately.
            </p>
            <Link href="/" className="btn-primary" style={{ display: 'inline-block' }}>
              Return to Home
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Navbar />
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
        <Link href="/cart" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '24px', textDecoration: 'none', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '32px', letterSpacing: '-0.5px' }}>
          Retail Checkout
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          {/* Form Side */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              Shipping Details
            </h2>
            
            <form id="checkout-form" onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>First Name</label>
                  <input type="text" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Last Name</label>
                  <input type="text" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Email Address</label>
                <input type="email" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Shipping Address</label>
                <input type="text" required placeholder="Street address or P.O. Box" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>City</label>
                  <input type="text" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>State</label>
                  <select required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white' }}>
                    <option value="">Select</option>
                    <option value="MH">Maharashtra</option>
                    <option value="DL">Delhi</option>
                    <option value="KA">Karnataka</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>PIN Code</label>
                  <input type="text" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '16px 0 8px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                Payment Method
              </h2>

              <div style={{ padding: '16px', border: '1px solid var(--accent)', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="radio" id="card" name="payment" defaultChecked style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }} />
                <label htmlFor="card" style={{ fontWeight: 600 }}>Credit / Debit Card</label>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Card Number</label>
                <input type="text" placeholder="XXXX XXXX XXXX XXXX" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
              </div>
            </form>
          </div>

          {/* Cart Summary Side */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-light)', height: 'max-content', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              In your cart
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 600 }}>{item.price}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, margin: '24px 0' }}>
              <span>Total</span>
              <span>₹{estimatedTotal}</span>
            </div>

            <button 
              form="checkout-form"
              type="submit"
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                background: 'var(--accent)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                border: 'none',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isProcessing ? "Processing Payment..." : `Pay ₹${estimatedTotal}`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
