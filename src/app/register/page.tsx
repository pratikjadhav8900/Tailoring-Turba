"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    isB2B: false, companyName: "", gstNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed. Please try again.");
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg1}></div>
      <div className={styles.bg2}></div>

      <div className={`${styles.card} ${styles.cardWide}`}>
        <Link href="/" className={styles.logo}>Tailoring <span>Turba</span></Link>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.sub}>Start customizing your team&apos;s wear today</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="reg-name" type="text" className="form-input" placeholder="Rahul Sharma" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input id="reg-phone" type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={e => set("email", e.target.value)} required />
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="reg-password" type="password" className="form-input" placeholder="Min 8 characters" value={form.password} onChange={e => set("password", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input id="reg-confirm" type="password" className="form-input" placeholder="Retype password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} required />
            </div>
          </div>

          {/* B2B Toggle */}
          <label className={styles.toggle} style={{ marginTop: 8 }}>
            <input 
              id="reg-b2b" 
              type="checkbox" 
              checked={form.isB2B} 
              onChange={e => set("isB2B", e.target.checked)} 
              style={{ width: 18, height: 18, accentColor: "var(--accent)" }} 
            />
            <div style={{ flex: 1, marginLeft: 8 }}>
              <div className={styles.toggleLabel}>Register as B2B Business</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>Unlock bulk pricing, GST invoicing & rosters</div>
            </div>
          </label>

          {form.isB2B && (
            <div className={styles.formRow} style={{ marginTop: 8, padding: 16, background: "#F9FAFB", borderRadius: 8, border: "1px solid var(--border-light)" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Company Name</label>
                <input id="reg-company" type="text" className="form-input" placeholder="Acme Sports Pvt. Ltd." value={form.companyName} onChange={e => set("companyName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input id="reg-gst" type="text" className="form-input" placeholder="27AAAAA0000A1Z5" value={form.gstNumber} onChange={e => set("gstNumber", e.target.value.toUpperCase())} maxLength={15} />
              </div>
            </div>
          )}

          <button id="reg-submit" type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Creating Account..." : "Create Account →"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
