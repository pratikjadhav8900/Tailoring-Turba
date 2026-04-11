"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

function ContactForm() {
  const searchParams = useSearchParams();
  const productCode = searchParams.get("product");
  const categorySlug = searchParams.get("category");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    quantity: "50",
    message: productCode 
      ? `I am interested in ordering ${productCode} from the ${categorySlug} collection.` 
      : ""
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    console.log("Form Submitted", formData);
    setIsSubmitted(true);
  };

  return (
    <div className={styles.contactContainer}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Bulk Order Enquiry</h1>
        <p className={styles.subtitle}>
          Get a professional quote for your corporate requirements. Our team will contact you within 24 hours.
        </p>

        {isSubmitted ? (
          <div className={styles.successMessage}>
            <h2>Thank you for your interest!</h2>
            <p>Your enquiry has been received. Our corporate relationship manager will reach out to you shortly.</p>
            <button className={styles.backBtn} onClick={() => window.history.back()}>Back to Catalogue</button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.group}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className={styles.group}>
                <label>Work Email</label>
                <input 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div className={styles.group}>
              <label>Company Name</label>
              <input 
                type="text" 
                required 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="ABC Corp"
              />
            </div>

            <div className={styles.group}>
              <label>Quantity Required (MOQ: 50)</label>
              <input 
                type="number" 
                min="50"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            <div className={styles.group}>
              <label>Special Instructions / Product Details</label>
              <textarea 
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="e.g. Logo printing type, delivery timeline..."
              />
            </div>

            <button type="submit" className={styles.submitBtn}>Submit Quote Request</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <Suspense fallback={<div>Loading enquiry form...</div>}>
            <ContactForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
