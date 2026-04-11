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
            {showRegister ? "Create Account" : "Sign In"}
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {!showRegister ? (
          <>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your password"
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
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <div className={styles.registerPrompt}>
              <p>New to Tailoring Turba?</p>
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
              <User size={48} className={styles.registerIcon} />
              <h3>Create Your Account</h3>
              <p>Join Tailoring Turba to design custom garments and track your orders.</p>
            </div>
            
            <Link href="/register" className={styles.registerLinkBtn}>
              Create New Account
            </Link>
            
            <button
              onClick={() => setShowRegister(false)}
              className={styles.backToLogin}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
