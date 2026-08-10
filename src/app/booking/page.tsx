"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import styles from "./page.module.css";
import { 
  Calendar, MapPin, Clock, Phone, CheckCircle2, 
  Sparkles, ArrowRight, ArrowLeft, Shirt, Layers, 
  Settings, Users, ClipboardCheck, MessageSquare, 
  ChevronRight, Award, Trophy, ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const visitPurposes = [
  {
    id: "Bulk Apparel",
    name: "Bulk Apparel",
    icon: Layers,
    desc: "Discuss custom hoodies, shirts, designs & manufacturing scaling.",
  },
  {
    id: "Sports Jerseys",
    name: "Sports Jerseys",
    icon: Trophy,
    desc: "Explore sublimation print technology, athletic cuts & fits.",
  },
  {
    id: "Corporate Uniforms",
    name: "Corporate Uniforms",
    icon: Shirt,
    desc: "Examine high-quality polo shirts, embroidery & corporate styles.",
  },
  {
    id: "Streetwear",
    name: "Streetwear",
    icon: Sparkles,
    desc: "Finalize pattern specs, heavyweight cottons & custom streetwear cuts.",
  },
  {
    id: "Printing Consultation",
    name: "Printing Consultation",
    icon: Settings,
    desc: "See live DTF, screen printing, and advanced embroidery demos.",
  },
  {
    id: "Fabric Exploration",
    name: "Fabric Exploration",
    icon: ClipboardCheck,
    desc: "Touch and evaluate our catalog of 200+ GSM premium fabrics in person.",
  },
];

const timeSlots = [
  "10:00 AM", "11:00 AM", "12:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];



const galleryItems = [
  { title: "The Innovation Studio", tag: "Studio", img: "/hero_indian_studio.png" },
  { title: "Precision Sewing", tag: "Craftsmanship", img: "/hero_sewing.png" },
  { title: "Fabric Milling", tag: "Knitting", img: "/hero_knitting.png" },
  { title: "Industrial Production", tag: "Scale", img: "/hero_factory.png" }
];



export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ date: "", timeSlot: "", name: "", phone: "", email: "", notes: "", purpose: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const formSectionRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const scrollToNextBtn = () => {
    setTimeout(() => {
      if (footerRef.current) {
        footerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  };

  const nextStep = () => {
    if (step === 0 && !form.purpose) {
      setError("Please select the purpose of your visit.");
      return;
    }
    if (step === 1 && !form.date) {
      setError("Please pick a preferred date.");
      return;
    }
    if (step === 2 && !form.timeSlot) {
      setError("Please pick an appointment slot.");
      return;
    }
    setError("");
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(s => s - 1);
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("Please enter your name and phone number.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // If notes are empty, pass a default text containing the purpose
          notes: form.notes || `Studio Visit: ${form.purpose}`
        }),
      });

      setLoading(false);
      if (res.ok) {
        setSubmitted(true);
        toast.success("Studio booking confirmed ✓");
      } else {
        setError("Booking failed. Please try again or call us directly.");
        toast.error("Failed to book appointment");
      }
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Please check your network and try again.");
      toast.error("Network error");
    }
  }

  // Compute minimum date safely on client to avoid UTC/timezone hydration errors
  const [minDate, setMinDate] = useState<string>("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    setMinDate(`${y}-${m}-${d}`);
  }, []);

  // Compute 6 quick date options (skipping Sundays) for instant single-tap selection on mobile
  const quickDates = useMemo(() => {
    const list: { iso: string; label: string; badge?: string }[] = [];
    const curr = new Date();
    curr.setDate(curr.getDate() + 1);

    while (list.length < 6) {
      if (curr.getDay() !== 0) { // Skip Sunday
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, "0");
        const d = String(curr.getDate()).padStart(2, "0");
        const iso = `${y}-${m}-${d}`;
        const dayName = curr.toLocaleDateString("en-IN", { weekday: "short" });
        const monthName = curr.toLocaleDateString("en-IN", { month: "short" });
        const dayNum = curr.getDate();
        const badge = list.length === 0 ? "Tomorrow" : undefined;
        list.push({ iso, label: `${dayName}, ${dayNum} ${monthName}`, badge });
      }
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, []);

  return (
    <div className={styles.bookingContainer}>
      <Navbar />
      <div className={styles.noiseOverlay}></div>
      <div className={styles.radialGlows}>
        <div className={styles.glow1}></div>
        <div className={styles.glow2}></div>
        <div className={styles.glow3}></div>
      </div>

      {/* SECTION 1: Cinematic Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <motion.div 
              className={styles.heroTagline}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Tailoring Turba Studio
            </motion.div>
            
            <motion.h1 
              className={styles.heroTitle}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              Experience Your Brand<br />Before You <span>Print It.</span>
            </motion.h1>

            <motion.p 
              className={styles.heroSub}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Book an exclusive consultation in our Pune studio. Feel our premium fabrics, see custom printing machinery in action, and discuss your apparel manufacturing orders with our specialists.
            </motion.p>

            <motion.div 
              className={styles.heroCtaGroup}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <button className={styles.primaryCta} onClick={scrollToForm}>
                Schedule Visit <ArrowRight size={16} />
              </button>
              <a href="tel:9022553346" className={styles.secondaryCta}>
                Call Studio
              </a>
            </motion.div>
          </div>
        </div>
      </section>



      {/* SECTION 3: Cinematic Gallery */}
      <section className={styles.gallerySection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>The Production Floor</div>
            <h2 className={styles.sectionTitle}>Crafted in Detail</h2>
            <p className={styles.sectionSub}>A look into our design studios, fabrication mills, and custom embroidery machinery hubs.</p>
          </div>

          <div className={styles.galleryGrid}>
            {galleryItems.map((item, idx) => (
              <div key={idx} className={`${styles.galleryItem} ${styles[`item${idx + 1}`]}`}>
                <Image 
                  src={item.img} 
                  alt={item.title}
                  fill
                  className={styles.galleryImg}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className={styles.galleryOverlay}>
                  <span className={styles.galleryTag}>{item.tag}</span>
                  <h4 className={styles.galleryTitle}>{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Interactive Booking Panel */}
      <section className={styles.bookingSection} ref={formSectionRef}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>Reservations</div>
            <h2 className={styles.sectionTitle}>Request Access</h2>
            <p className={styles.sectionSub}>Select a slot to confirm your exclusive apparel and printing consultation session.</p>
          </div>

          <div className={styles.bookingGlassPanel}>
            {/* Header step indicators */}
            {!submitted && (
              <div className={styles.bookingHeader}>
                <div className={styles.stepIndicators}>
                  {[
                    { label: "Purpose", num: 1 },
                    { label: "Date", num: 2 },
                    { label: "Time", num: 3 },
                    { label: "Credentials", num: 4 },
                  ].map((stepObj, idx) => {
                    const isCompleted = step > idx;
                    const isActive = step === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`${styles.stepIndicator} ${isActive ? styles.stepIndicatorActive : ""} ${isCompleted ? styles.stepIndicatorCompleted : ""}`}
                      >
                        <div className={styles.stepNum}>
                          {isCompleted ? "✓" : stepObj.num}
                        </div>
                        <span className="hide-mobile">{stepObj.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--tth-gold)", textTransform: "uppercase" }}>
                  Step {step + 1} of 4
                </div>
              </div>
            )}

            {/* Form body */}
            <div className={styles.bookingBody}>
              {error && <div className={styles.error}>{error}</div>}

              {submitted ? (
                <motion.div 
                  className={styles.successContainer}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className={styles.successRing}>
                    <CheckCircle2 size={44} strokeWidth={1.5} />
                  </div>
                  <h2 className={styles.successTitle}>Booking Requested</h2>
                  <p className={styles.successDesc}>
                    We have successfully queued your studio visit request. A studio specialist will connect with you via email or phone shortly to confirm your slot.
                  </p>
                  <button 
                    className={styles.primaryCta} 
                    onClick={() => {
                      setForm({ date: "", timeSlot: "", name: "", phone: "", email: "", notes: "", purpose: "" });
                      setStep(0);
                      setSubmitted(false);
                    }}
                  >
                    Schedule Another Visit
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* STEP 1: Select Purpose */}
                  {step === 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h3 className={styles.formLabel}>What is the purpose of your studio visit?</h3>
                      <div className={styles.purposeGrid}>
                        {visitPurposes.map((p) => {
                          const Icon = p.icon;
                          const isActive = form.purpose === p.id;
                          return (
                            <div 
                              key={p.id} 
                              className={`${styles.purposeCard} ${isActive ? styles.purposeCardActive : ""}`}
                              onClick={() => {
                                set("purpose", p.id);
                                setError("");
                                scrollToNextBtn();
                              }}
                            >
                              <Icon size={28} className={styles.purposeIcon} strokeWidth={1.2} />
                              <span className={styles.purposeName}>{p.name}</span>
                              <span className={styles.purposeDesc}>{p.desc}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Choose Date */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h3 className={styles.formLabel}>Select your preferred date</h3>
                      
                      {/* Quick Date Pills for 1-Tap Mobile Selection */}
                      <div className={styles.datePickerContainer}>
                        <label className={styles.formInputLabel} style={{ marginBottom: "10px", display: "block" }}>Quick Options</label>
                        <div className={styles.quickDateGrid}>
                          {quickDates.map((qd) => {
                            const isActive = form.date === qd.iso;
                            return (
                              <button
                                key={qd.iso}
                                type="button"
                                className={`${styles.quickDatePill} ${isActive ? styles.quickDatePillActive : ""}`}
                                onClick={() => {
                                  set("date", qd.iso);
                                  setError("");
                                  scrollToNextBtn();
                                }}
                              >
                                {qd.badge && <span style={{ display: "block", fontSize: "0.68rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>{qd.badge}</span>}
                                <span>{qd.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <label className={styles.formInputLabel} style={{ marginTop: "16px", marginBottom: "8px", display: "block" }}>Or Pick Custom Date</label>
                        <input 
                          type="date" 
                          className={styles.darkInput} 
                          min={minDate} 
                          value={form.date} 
                          onChange={e => {
                            set("date", e.target.value);
                            setError("");
                            scrollToNextBtn();
                          }}
                          onClick={(e) => {
                            try { (e.target as HTMLInputElement).showPicker?.(); } catch {}
                          }}
                          style={{ minHeight: "52px", fontSize: "16px", cursor: "pointer", background: "#ffffff" }}
                          required 
                        />
                        <div style={{ fontSize: "0.85rem", color: "#52525b", marginTop: "10px", textAlign: "center" }}>
                          Note: Studio visits are closed on Sundays.
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: Select Time Slot */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h3 className={styles.formLabel}>Select a convenient time slot</h3>
                      <div className={styles.slotsGrid}>
                        {timeSlots.map(slot => {
                          const isActive = form.timeSlot === slot;
                          return (
                            <button
                              type="button"
                              key={slot}
                              className={`${styles.slotCard} ${isActive ? styles.slotCardActive : ""}`}
                              onClick={() => {
                                set("timeSlot", slot);
                                setError("");
                                scrollToNextBtn();
                              }}
                            >
                              <Clock size={16} /> {slot}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: Enter Details */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h3 className={styles.formLabel}>Provide your contact credentials</h3>
                      
                      <div className={styles.detailsForm}>
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label className={styles.formInputLabel}>Full Name</label>
                            <input 
                              type="text" 
                              className={styles.darkInput} 
                              placeholder="Rahul Sharma" 
                              value={form.name} 
                              onChange={e => set("name", e.target.value)} 
                              required 
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formInputLabel}>Phone Number</label>
                            <input 
                              type="tel" 
                              className={styles.darkInput} 
                              placeholder="+91 98765 43210" 
                              value={form.phone} 
                              onChange={e => set("phone", e.target.value)} 
                              required 
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formInputLabel}>Email Address</label>
                          <input 
                            type="email" 
                            className={styles.darkInput} 
                            placeholder="you@company.com" 
                            value={form.email} 
                            onChange={e => set("email", e.target.value)} 
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formInputLabel}>Discuss/Specifications (Optional)</label>
                          <textarea 
                            className={styles.darkInput} 
                            rows={3} 
                            placeholder="Tell us about your brand requirement, quantity, custom fabric interests..." 
                            value={form.notes} 
                            onChange={e => set("notes", e.target.value)}
                            style={{ resize: "vertical" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </form>
              )}
            </div>

            {/* Footer Navigation Actions */}
            {!submitted && (
              <div ref={footerRef} className={styles.bookingFooter}>
                {step > 0 ? (
                  <button className={styles.backBtn} onClick={prevStep}>
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 3 ? (
                  <button 
                    className={styles.nextBtn} 
                    onClick={nextStep}
                    disabled={
                      (step === 0 && !form.purpose) ||
                      (step === 1 && !form.date) ||
                      (step === 2 && !form.timeSlot)
                    }
                  >
                    Next Step <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className={styles.primaryCta} 
                    onClick={handleSubmit}
                    disabled={loading || !form.name || !form.phone}
                  >
                    {loading ? "Registering..." : "Request Reservation"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>


      {/* SECTION 6: Location & Timing Details */}
      <section className={styles.locationSection}>
        <div className="container">
          <div className={styles.locationGrid}>
            <div className={styles.locationInfo}>
              <div className={styles.sectionLabel}>Coordinates</div>
              <h2 className={styles.sectionTitle}>Our Studio Address</h2>
              
              <div className={styles.locationDetails}>
                <div className={styles.locationRow}>
                  <MapPin className={styles.locationIcon} size={22} />
                  <div className={styles.locationText}>
                    <strong>Visit Us</strong>
                    <p>321/1, Jawaharlal Nehru Road, Mahatma Phule Peth, near HDFC Bank, Pune, Maharashtra 411042, India</p>
                  </div>
                </div>

                <div className={styles.locationRow}>
                  <Clock className={styles.locationIcon} size={22} />
                  <div className={styles.locationText}>
                    <strong>Studio Timings</strong>
                    <p>Monday – Saturday<br />10:00 AM to 7:00 PM (Sundays Closed)</p>
                  </div>
                </div>

                <div className={styles.locationRow}>
                  <Phone className={styles.locationIcon} size={22} />
                  <div className={styles.locationText}>
                    <strong>Direct Connection</strong>
                    <p>+91 90225 53346 (Enquiries & Support)</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <a href="tel:9022553346" className={styles.primaryCta}>
                  Connect via Call
                </a>
              </div>
            </div>

            <div className={styles.mapWrapper}>
              <iframe
                title="Pune Studio Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.5907009022403!2d73.8666498!3d18.50219!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c192a8384671%3A0x6998d754fec7272b!2sSanjay%20Departments!5e0!3m2!1sen!2sin!4v1716900000000!5m2!1sen!2sin"
                className={styles.styledMap}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
