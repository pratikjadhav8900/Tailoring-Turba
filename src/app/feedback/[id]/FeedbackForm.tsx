"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./page.module.css";

interface FeedbackFormProps {
  orderId: string;
  orderNumber?: number;
  customerName: string;
}

export default function FeedbackForm({ orderId, orderNumber, customerName }: FeedbackFormProps) {
  const [ratings, setRatings] = useState({
    serviceOverall: 0,
    serviceProfessionalism: 0,
    serviceTimeline: 0,
    easeOrdering: 0,
    easeCommunication: 0,
    easeProcess: 0,
    fabricQuality: 0,
    fabricExpectations: 0,
    fabricStitching: 0,
    printingLogo: 0,
    printingAccuracy: 0,
  });
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const displayNo = orderNumber ? String(orderNumber) : orderId.slice(-8).toUpperCase();

  const handleRatingClick = (category: keyof typeof ratings, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if any rating is not filled
    const unrated = Object.entries(ratings).filter(([_, val]) => val === 0);
    if (unrated.length > 0) {
      toast.error("Please answer all 11 rating questions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          ...ratings,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        toast.success("Thank you for your feedback ✓");
      } else {
        toast.error(data.error || "Failed to submit feedback. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={36} strokeWidth={1.5} />
            </div>
            <h1 className={styles.successTitle}>Thank You!</h1>
            <p className={styles.successText}>
              Your detailed feedback for Order <strong>#{displayNo}</strong> has been submitted successfully.
              We deeply appreciate you taking the time to share your feedback to help us craft better products.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Defined sections with questions
  const sections = [
    {
      title: "Service",
      questions: [
        {
          key: "serviceOverall" as const,
          label: "1. Overall Experience",
          text: "How satisfied are you with your overall experience with Tailoring Turba?",
        },
        {
          key: "serviceProfessionalism" as const,
          label: "2. Team Professionalism",
          text: "How would you rate the professionalism and helpfulness of our team throughout the order process?",
        },
        {
          key: "serviceTimeline" as const,
          label: "3. Delivery Timeline",
          text: "Did we deliver your order within the promised timeline?",
        },
      ],
    },
    {
      title: "Ease of Service",
      questions: [
        {
          key: "easeOrdering" as const,
          label: "4. Placing Order",
          text: "How easy was it to place your order with Tailoring Turba?",
        },
        {
          key: "easeCommunication" as const,
          label: "5. Communication & Updates",
          text: "How satisfied are you with the communication and updates provided during your order?",
        },
        {
          key: "easeProcess" as const,
          label: "6. Process Convenience",
          text: "How convenient was the overall ordering and approval process?",
        },
      ],
    },
    {
      title: "Fabric Quality",
      questions: [
        {
          key: "fabricQuality" as const,
          label: "7. Fabric Quality",
          text: "How would you rate the quality of the fabric used in your order?",
        },
        {
          key: "fabricExpectations" as const,
          label: "8. Comfort & Finish",
          text: "Did the fabric meet your expectations in terms of comfort, durability, and finish?",
        },
        {
          key: "fabricStitching" as const,
          label: "9. Stitching & Customization",
          text: "How satisfied are you with the stitching and overall garment quality?",
        },
      ],
    },
    {
      title: "Printing & Branding",
      questions: [
        {
          key: "printingLogo" as const,
          label: "10. Branding Quality",
          text: "How would you rate the quality of the logo/print/embroidery on your garments?",
        },
        {
          key: "printingAccuracy" as const,
          label: "11. Alignment & Accuracy",
          text: "How satisfied are you with the accuracy of the colors, design, and placement of the print/branding?",
        },
      ],
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Feedback Form</p>
          <h1 className={styles.title}>Your experience matters</h1>
          <p className={styles.subtitle}>
            Hello {customerName}, thank you for choosing Tailoring Turba. Please take a moment to rate our services for Order #{displayNo} out of 5 stars.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {sections.map((section) => (
            <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: "24px", borderBottom: "1px solid #f1f5f9", paddingBottom: "24px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--tth-olive-dark)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0 0 0" }}>
                {section.title}
              </h2>
              
              {section.questions.map((q) => (
                <div key={q.key} className={styles.ratingSection}>
                  <div className={styles.ratingHeader}>
                    <label className={styles.ratingLabel}>{q.label}</label>
                    <p className={styles.ratingDescription}>{q.text}</p>
                  </div>
                  
                  {/* Rating selection (1 to 5) */}
                  <div className={styles.circlesRow} style={{ gridTemplateColumns: "repeat(5, 1fr)", maxWidth: "280px" }}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`${styles.circleBtn} ${ratings[q.key] === val ? styles.circleBtnActive : ""}`}
                        onClick={() => handleRatingClick(q.key, val)}
                        title={`Rate ${val}/5`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className={styles.textareaGroup}>
            <label className={styles.textareaLabel}>12. Improvements</label>
            <p className={styles.ratingDescription}>What could we improve to make your next experience even better?</p>
            <textarea
              className={styles.textarea}
              placeholder="Please write a custom message for review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
