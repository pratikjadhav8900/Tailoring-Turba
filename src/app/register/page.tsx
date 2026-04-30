"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
      {/* Left Split: Premium Image */}
      <div className={styles.imagePane}>
        <div className={styles.imageOverlay} />
        <Image 
          src="/premium_apparel_auth_register_1777472396833.png" 
          alt="Apparel Manufacturing" 
          fill 
          style={{ objectFit: "cover" }} 
          priority
        />
      </div>

      {/* Right Split: Register Form */}
      <div className={styles.formPane}>
        <div className={`${styles.formContainer} ${styles.formContainerWide}`}>
          <Link href="/" className={styles.logo}>Tailoring <span>Turba</span></Link>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.sub}>Start customizing your team&apos;s wear today.</p>

          <button 
            type="button" 
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
            className={`${styles.submitBtn} ${styles.googleBtn}`}
            style={{ width: "100%" }}
          >
            <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} height={18} style={{ marginRight: "12px" }} />
            Continue with Google
          </button>

          <div className={styles.separator}>
            <div className={styles.sepLine}></div>
            <span className={styles.sepText}>Or register with email</span>
            <div className={styles.sepLine}></div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input id="reg-name" type="text" className={styles.input} value={form.name} onChange={e => set("name", e.target.value)} required autoComplete="off" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input id="reg-phone" type="tel" className={styles.input} value={form.phone} onChange={e => set("phone", e.target.value)} autoComplete="off" />
              </div>
            </div>
 
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input id="reg-email" type="email" className={styles.input} value={form.email} onChange={e => set("email", e.target.value)} required autoComplete="off" />
            </div>
 
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input id="reg-password" type="password" className={styles.input} value={form.password} onChange={e => set("password", e.target.value)} required autoComplete="off" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input id="reg-confirm" type="password" className={styles.input} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} required autoComplete="off" />
              </div>
            </div>

            {/* B2B Toggle */}
            <label className={styles.toggle}>
              <input 
                id="reg-b2b" 
                type="checkbox" 
                checked={form.isB2B} 
                onChange={e => set("isB2B", e.target.checked)} 
                style={{ width: 18, height: 18, accentColor: "var(--tth-olive-dark)", marginTop: 2 }} 
              />
              <div style={{ flex: 1 }}>
                <div className={styles.toggleLabel}>Register as B2B Business</div>
                <div className={styles.toggleSub}>Unlock bulk pricing, GST invoicing & rosters</div>
              </div>
            </label>

            {form.isB2B && (
              <div className={styles.b2bBox}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Company Name</label>
                  <input id="reg-company" type="text" className={styles.input} value={form.companyName} onChange={e => set("companyName", e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>GST Number</label>
                  <input id="reg-gst" type="text" className={styles.input} value={form.gstNumber} onChange={e => set("gstNumber", e.target.value.toUpperCase())} maxLength={15} />
                </div>
              </div>
            )}

            <button id="reg-submit" type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <p className={styles.footer}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
