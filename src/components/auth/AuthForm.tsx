"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./AuthForm.module.css";
import { Globe, ArrowRight, Check } from "lucide-react";

interface AuthFormProps {
  initialMode: 'login' | 'register';
}

export default function AuthForm({ initialMode }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isB2B, setIsB2B] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");
      if (oauthError === "OAuthAccountNotLinked") {
        setError("This email is already registered using a password. Please sign in with your email and password instead.");
      } else if (oauthError === "OAuthSignin" || oauthError === "OAuthCallback" || oauthError === "OAuthCreateAccount") {
        setError("An error occurred during Google sign-in. Please try again.");
      } else if (oauthError) {
        setError(`Authentication failed: ${oauthError}. Please try again.`);
      }
    }
  }, []);

  // Handle mode sync with URL
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleLogin(e: React.FormEvent) {
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
      router.push("/dashboard");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, phone, password, isB2B, companyName, gstNumber
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed. Please try again.");
    } else {
      setMode('login');
      setError("");
      // Optionally show a success message
    }
  }

  if (!mounted) return null;

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        {/* Savana-inspired Banner */}
        <div className={styles.banner}>
          Join the Club & Get <span>15% OFF</span> your first custom order
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ""}`}
            onClick={() => { setMode('login'); setError(""); }}
          >
            Login
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ""}`}
            onClick={() => { setMode('register'); setError(""); }}
          >
            Signup
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <Link href="/" className={styles.logo}>Tailoring <span>Turba</span></Link>
            <h2 className={styles.title}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className={styles.sub}>
              {mode === 'login' ? 'Sign in to access your orders and designs.' : 'Start your premium tailoring journey today.'}
            </p>
          </div>

          {/* Social Login */}
          <div className={styles.socialGrid}>
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className={styles.socialBtn}
            >
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} height={18} />
              Google
            </button>
          </div>

          <div className={styles.separator}>
            <div className={styles.sepLine}></div>
            <span className={styles.sepText}>OR USE EMAIL</span>
            <div className={styles.sepLine}></div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className={styles.form}>
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
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.label}>Password</label>
                  <Link href="/forgot-password" className={styles.link} style={{ fontSize: '0.75rem' }}>Forgot?</Link>
                </div>
                <input
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
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
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Password</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* B2B Toggle */}
              <div className={styles.b2bToggle} onClick={() => setIsB2B(!isB2B)}>
                <div style={{
                  width: 20,
                  height: 20,
                  border: '2px solid var(--tth-olive)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isB2B ? 'var(--tth-olive)' : 'transparent',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {isB2B && <Check size={14} color="white" strokeWidth={3} />}
                </div>
                <div>
                  <div className={styles.b2bLabel}>Business Account</div>
                  <div className={styles.b2bSub}>Wholesale pricing & GST invoicing</div>
                </div>
              </div>

              {isB2B && (
                <div className={styles.b2bSection}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Company Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>GST Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value.toUpperCase())}
                      maxLength={15}
                    />
                  </div>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          <div className={styles.footer}>
            {mode === 'login' ? (
              <p>New to Tailoring Turba? <button onClick={() => setMode('register')} className={styles.link}>Sign up</button></p>
            ) : (
              <p>Already have an account? <button onClick={() => setMode('login')} className={styles.link}>Login</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
