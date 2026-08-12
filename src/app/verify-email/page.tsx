"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState<"success" | "error">("error");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // Run verification on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setStatus("error");
      setMessage("Invalid verification request. No token was provided.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
          if (data.email) {
            setEmail(data.email);
          }
        } else {
          setStatus("success");
          setMessage("Your email address has been verified. You can now sign in to your Tailoring Turba account.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred while verifying your email address.");
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [token]);

  // Handle resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  async function handleResendVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setResendError("Please enter your email address.");
      return;
    }
    setResendLoading(true);
    setResendMessage("");
    setResendError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendError(data.error || "Failed to resend verification email. Please try again.");
      } else {
        setResendMessage("Verification email has been resent successfully!");
        setResendCooldown(60);
      }
    } catch (err) {
      setResendError("A network error occurred. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className={styles.loadingBox}>
        <div className={styles.spinner}></div>
        <p className={styles.message}>Verifying your email address, please wait...</p>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      {status === "success" ? (
        <div className={styles.successBox}>
          <div className={styles.iconSuccess}>✓</div>
          <h2 className={styles.title}>Email Verified Successfully</h2>
          <p className={styles.message}>{message}</p>
          <Link href="/login" className={styles.button}>
            Continue to Login
          </Link>
        </div>
      ) : (
        <div className={styles.errorBox}>
          <div className={styles.iconError}>✗</div>
          <h2 className={styles.title}>Verification Link Invalid or Expired</h2>
          <p className={styles.message}>This verification link is no longer valid.</p>
          
          <form onSubmit={handleResendVerification} className={styles.resendForm}>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                placeholder="Enter email to resend link"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.emailInput}
                required
              />
              <button
                type="submit"
                disabled={resendLoading || resendCooldown > 0}
                className={styles.resendBtn}
              >
                {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Verification Email"}
              </button>
            </div>
            {resendMessage && <p className={styles.resendSuccess}>{resendMessage}</p>}
            {resendError && <p className={styles.resendError}>{resendError}</p>}
          </form>

          <Link href="/login" className={styles.buttonSecondary}>
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Link href="/" className={styles.logo}>Tailoring <span>Turba</span></Link>
          </div>
          <Suspense fallback={
            <div className={styles.loadingBox}>
              <div className={styles.spinner}></div>
              <p className={styles.message}>Loading...</p>
            </div>
          }>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}
