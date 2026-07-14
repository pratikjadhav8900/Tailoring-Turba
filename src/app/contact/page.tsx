"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import styles from "./page.module.css";
import { CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/contexts/CartContext";
import { getElementDetails } from "@/lib/customizer-utils";

function ContactForm() {
  const searchParams = useSearchParams();
  const productName = searchParams.get("product");
  const { cart } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    quantity: "50",
    message: productName
      ? `I am interested in placing a bulk order for: ${productName}. Please share pricing and availability details.`
      : "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Calculate cart items & totals for pro-forma
      let cartItems = [];
      let totalAmount = 0;
      let totalCustomCharge = 0;
      
      if (cart.length > 0) {
        cartItems = cart.map(item => {
          return {
            product: { name: item.name },
            quantity: item.quantity,
            price: item.price
          };
        });
        const subtotal = cart.reduce((t, i) => t + (Number(i.price) * (i.quantity || 0)), 0);
        
        const printingCharge = cart.reduce((t, item) => {
          if (!item.customDesign) return t;
          const gType = item.customDesign.garmentType || "round-neck";
          const fEls = (item.customDesign.frontElements || []).map(el => getElementDetails(el, gType, "front"));
          const bEls = (item.customDesign.backElements || []).map(el => getElementDetails(el, gType, "back"));
          const printCost = [...fEls, ...bEls].reduce((s, el) => s + el.cost, 0);
          return t + (printCost * (item.quantity || 0));
        }, 0);
        
        const customItemsCount = cart.filter(i => i.customDesign).length;
        const designCharge = customItemsCount * 300;
        totalCustomCharge = printingCharge + designCharge;
        
        const gst = Math.round((subtotal + totalCustomCharge) * 0.05);
        totalAmount = subtotal + totalCustomCharge + gst;
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cartItems: cartItems.length > 0 ? cartItems : undefined,
          totalAmount: totalAmount > 0 ? totalAmount : undefined,
          customCharge: totalCustomCharge > 0 ? totalCustomCharge : undefined,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        toast.success("Message sent successfully ✓");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        toast.error("Failed to send message");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className={styles.layout}>
      {/* ─── Left Panel ─── */}
      <div className={styles.leftPanel}>
        <div className={styles.bgImage} />
        <div className={styles.bgOverlay} />

        <div className={styles.leftContent}>
          <p className={styles.eyebrow}>Bulk Enquiry</p>

          <h1 className={styles.leftTitle}>
            Let&apos;s build<br />
            <em>something great</em><br />
            together.
          </h1>

          <p className={styles.leftSubtitle}>
            Whether you need 50 units or 50,000 — our team crafts every order with precision and care. Get a tailored quote within 24 hours.
          </p>

          {productName && (
            <div className={styles.productBadge}>
              <span />
              Enquiring for: {productName}
            </div>
          )}

          <div className={styles.contactDetails}>
            <div className={styles.contactItem}>
              <Mail size={14} strokeWidth={1.5} className={styles.contactIcon} />
              <span className={styles.contactValue}>tailoringturba@gmail.com</span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={14} strokeWidth={1.5} className={styles.contactIcon} />
              <span className={styles.contactValue}>9022553346</span>
            </div>
            <div className={styles.contactItem}>
              <MapPin size={14} strokeWidth={1.5} className={styles.contactIcon} />
              <span className={styles.contactValue}>321/1 Pandit Jawaharlal Nehru Marg Pune 411042, Sanjay Departments, Pune, Maharashtra 411042, IN</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          {isSubmitted ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={28} strokeWidth={1.5} />
              </div>
              <h2 className={styles.successTitle}>Enquiry Received</h2>
              <p className={styles.successText}>
                Thank you for reaching out. Our corporate relationship manager will review your requirements and get back to you within 24 hours.
              </p>
              <button className={styles.backBtn} onClick={() => window.history.back()}>
                Return to Catalogue
              </button>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Request a Quote</h2>
                <p className={styles.formSubtitle}>
                  Fill in your details below and we&apos;ll send you a personalised pricing sheet within 24 hours.
                </p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                  <div className={styles.group}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      className={styles.input}
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Priya Sharma"
                    />
                  </div>
                  <div className={styles.group}>
                    <label className={styles.label}>Work Email</label>
                    <input
                      className={styles.input}
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="priya@company.com"
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.group}>
                    <label className={styles.label}>Phone Number</label>
                    <input
                      className={styles.input}
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9022553346"
                    />
                  </div>
                  <div className={styles.group}>
                    <label className={styles.label}>Company Name</label>
                    <input
                      className={styles.input}
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="ABC Corp"
                    />
                  </div>
                </div>

                <div className={styles.group}>
                  <label className={styles.label}>Quantity (Min. 50)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="50"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="50"
                  />
                </div>

                <div className={styles.group}>
                  <label className={styles.label}>Product Details & Requirements</label>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="e.g. logo placement, delivery timeline, colour preferences..."
                  />
                </div>

                {error && (
                  <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "12px" }}>
                    ⚠️ {error}
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}>
                  {isLoading ? "Sending your request..." : "Submit Quote Request →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className={styles.pageWrapper}>
      <Suspense fallback={<div style={{ height: "100vh" }} />}>
        <ContactForm />
      </Suspense>
    </div>
  );
}
