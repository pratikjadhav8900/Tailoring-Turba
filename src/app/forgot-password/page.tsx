"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../login/auth.module.css"; // Reuse login styles

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setStep(2);
        setSuccess("An OTP has been sent to your email.");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Invalid OTP or request.");
      } else {
        setSuccess("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Left Split: Premium Image */}
      <div className={styles.imagePane}>
        <div className={styles.imageOverlay} />
        <Image 
          src="/premium_tailoring_auth_login_1777472320461.png" 
          alt="Premium Tailoring" 
          fill 
          style={{ objectFit: "cover" }} 
          priority
        />
      </div>

      {/* Right Split: Form */}
      <div className={styles.formPane}>
        <div className={styles.formContainer}>
          <Link href="/" className={styles.logo}>Tailoring <span>Turba</span></Link>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.sub}>
            {step === 1 ? "Enter your email to receive an OTP." : "Enter the OTP and your new password."}
          </p>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div style={{ color: "green", padding: "10px", backgroundColor: "#e6ffe6", borderRadius: "4px", marginBottom: "20px", fontSize: "14px" }}>{success}</div>}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>OTP</label>
                <input
                  type="text"
                  className={styles.input}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  placeholder="6-digit OTP"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <p className={styles.footer} style={{ marginTop: 24 }}>
            Remembered your password?{" "}
            <Link href="/login" className={styles.link}>Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
