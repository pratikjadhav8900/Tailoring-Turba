"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Mail, Lock, User } from "lucide-react";
import styles from "./AuthModal.module.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, redirectTo = "/dashboard" }: AuthModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    setLoading(false);
    
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      onSuccess?.();
      onClose();
      router.push(redirectTo);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {showRegister ? "Join Us" : "Welcome Back"}
          </h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {!showRegister ? (
          <>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} strokeWidth={1.5} className={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="e.g. name@example.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} strokeWidth={1.5} className={styles.inputIcon} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? "Verifying..." : "Sign In to Continue"}
              </button>
            </form>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <div className={styles.registerPrompt}>
              <p>Experience the craft of Tailoring Turba</p>
              <button
                onClick={() => setShowRegister(true)}
                className={styles.registerBtn}
              >
                Create an account
              </button>
            </div>
          </>
        ) : (
          <div className={styles.registerContent}>
            <div className={styles.registerInfo}>
              <User size={56} strokeWidth={1} className={styles.registerIcon} />
              <h3>Start Your Journey</h3>
              <p>Create an account to design custom apparel, save your measurements, and track orders with ease.</p>
            </div>
            
            <Link href="/register" className={styles.registerLinkBtn}>
              Register New Account
            </Link>
            
            <button
              onClick={() => setShowRegister(false)}
              className={styles.backToLogin}
            >
              Already have an account? Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
