"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

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
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.grid}>
            {/* Left — Info */}
            <div className={styles.info}>
              <div className="section-badge">📅 Pune Showroom</div>
              <h1 className={styles.title}>Book a Visit</h1>
              <p className={styles.sub}>
                Visit our Pune showroom to feel the fabric quality, see colour options in person, and discuss bulk orders with our team. Appointments are free!
              </p>

              <div className={styles.details}>
                <div className={styles.detail}>
                  <div className={styles.detailIcon}>📍</div>
                  <div>
                    <strong>Location</strong>
                    <p>Tailoring Turba, Kothrud,<br />Pune - 411038, Maharashtra</p>
                  </div>
                </div>
                <div className={styles.detail}>
                  <div className={styles.detailIcon}>🕐</div>
                  <div>
                    <strong>Hours</strong>
                    <p>Monday – Saturday<br />10:00 AM to 7:00 PM</p>
                  </div>
                </div>
                <div className={styles.detail}>
                  <div className={styles.detailIcon}>📞</div>
                  <div>
                    <strong>Direct Call</strong>
                    <p>+91 99999 99999</p>
                  </div>
                </div>
              </div>

              <div className={styles.perks}>
                {["Free fabric samples", "Live printing demo", "Bulk quote in 10 mins", "GST invoice ready"].map((p, i) => (
                  <div key={i} className={styles.perk}>✅ {p}</div>
                ))}
              </div>
            </div>

            {/* Right — Booking Form */}
            <div className={`${styles.form} glass-card`}>
              {submitted ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}>🎉</div>
                  <h2>Booking Confirmed!</h2>
                  <p>We&apos;ll send a confirmation to your email. See you at the showroom!</p>
                  <button className="btn-primary" onClick={() => setSubmitted(false)} style={{ marginTop: 20 }}>
                    Book Another Slot
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2 className={styles.formTitle}>Schedule Your Visit</h2>
                  {error && <div className={styles.error}>{error}</div>}

                  <div className={styles.row}>
                    <div className="form-group">
                      <label className="form-label">Your Name</label>
                      <input id="book-name" type="text" className="form-input" placeholder="Rahul Sharma" value={form.name} onChange={e => set("name", e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input id="book-phone" type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set("phone", e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input id="book-email" type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={e => set("email", e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <input id="book-date" type="date" className="form-input" min={minDate} value={form.date} onChange={e => set("date", e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Time Slot</label>
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

                  <div className="form-group">
                    <label className="form-label">Notes / What to Discuss (optional)</label>
                    <textarea
                      id="book-notes"
                      className="form-input"
                      rows={3}
                      placeholder="e.g. 150 cricket jerseys, need sublimation print, want to see jersey samples"
                      value={form.notes}
                      onChange={e => set("notes", e.target.value)}
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  <button id="book-submit" type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                    {loading ? "Booking..." : "📅 Confirm Booking"}
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
