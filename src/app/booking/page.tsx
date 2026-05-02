"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";
import { Calendar, MapPin, Clock, Phone, CheckCircle2 } from "lucide-react";

const timeSlots = [
  "10:00 AM", "11:00 AM", "12:00 PM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

export default function BookingPage() {
  const [form, setForm] = useState({ date: "", timeSlot: "", name: "", phone: "", email: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.timeSlot) { setError("Please pick a date and time slot."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError("Booking failed. Please try again or call us directly.");
    }
  }

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <>
      <main className={styles.main}>
        <div className="container">
          <div className={styles.grid}>
            {/* Left — Info */}
            <div className={styles.info}>
              <div className={styles.badge}><Calendar size={14} /> Pune Showroom</div>
              <h1 className={styles.title}>Book a Visit</h1>
              <p className={styles.sub}>
                Visit our Pune showroom to feel the fabric quality, see colour options in person, and discuss bulk orders with our tailoring experts.
              </p>

              <div className={styles.details}>
                <div className={styles.detail}>
                  <div className={styles.detailIcon}><MapPin size={24} /></div>
                  <div>
                    <strong>Location</strong>
                    <p>321/1 Pandit Jawaharlal Nehru Marg Pune 411042, Sanjay Departments,<br />Pune, Maharashtra 411042, IN</p>
                  </div>
                </div>
                <div className={styles.detail}>
                  <div className={styles.detailIcon}><Clock size={24} /></div>
                  <div>
                    <strong>Hours</strong>
                    <p>Monday – Saturday<br />10:00 AM to 7:00 PM</p>
                  </div>
                </div>
                <div className={styles.detail}>
                  <div className={styles.detailIcon}><Phone size={24} /></div>
                  <div>
                    <strong>Direct Call</strong>
                    <p>07942669612</p>
                  </div>
                </div>
              </div>

              <div className={styles.perks}>
                {["Free fabric samples", "Live printing demo", "Bulk quote in 10 mins", "GST invoice ready"].map((p, i) => (
                  <div key={i} className={styles.perk}>
                    <CheckCircle2 size={18} color="var(--tth-olive)" /> {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Booking Form */}
            <div className={styles.form}>
              {submitted ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}><CheckCircle2 size={64} /></div>
                  <h2>Booking Confirmed.</h2>
                  <p>We&apos;ve sent a confirmation to your email. We look forward to seeing you.</p>
                  <button className={styles.btnSubmit} onClick={() => setSubmitted(false)}>
                    Book Another Slot
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2 className={styles.formTitle}>Schedule Your Visit</h2>
                  {error && <div className={styles.error}>{error}</div>}

                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Your Name</label>
                      <input id="book-name" type="text" className={styles.input} placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => set("name", e.target.value)} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Phone Number</label>
                      <input id="book-phone" type="tel" className={styles.input} placeholder="+91 98765 43210" value={form.phone} onChange={e => set("phone", e.target.value)} required />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input id="book-email" type="email" className={styles.input} placeholder="you@company.com" value={form.email} onChange={e => set("email", e.target.value)} />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Preferred Date</label>
                    <input id="book-date" type="date" className={styles.input} min={minDate} value={form.date} onChange={e => set("date", e.target.value)} required />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Preferred Time Slot</label>
                    <div className={styles.slots}>
                      {timeSlots.map(slot => (
                        <button
                          type="button"
                          key={slot}
                          className={`${styles.slot} ${form.timeSlot === slot ? styles.slotSelected : ""}`}
                          onClick={() => set("timeSlot", slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Notes / What to Discuss (optional)</label>
                    <textarea
                      id="book-notes"
                      className={styles.input}
                      rows={3}
                      placeholder="e.g. 150 cricket jerseys, need sublimation print..."
                      value={form.notes}
                      onChange={e => set("notes", e.target.value)}
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  <button id="book-submit" type="submit" className={styles.btnSubmit} disabled={loading}>
                    {loading ? "Booking..." : "Confirm Booking"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
