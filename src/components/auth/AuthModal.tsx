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

            <button 
              type="button" 
              onClick={() => signIn("google", { callbackUrl: redirectTo })}
              className={styles.googleBtn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

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
