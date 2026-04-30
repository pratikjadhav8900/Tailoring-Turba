"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.push("/dashboard");
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

      {/* Right Split: Login Form */}
      <div className={styles.formPane}>
        <div className={styles.formContainer}>
          <Link href="/" className={styles.logo}>Tailoring <span>Turba</span></Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.sub}>Sign in to your Tailoring Turba account.</p>

          <button 
            type="button" 
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })} 
            className={`${styles.submitBtn} ${styles.googleBtn}`}
          >
            <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} height={18} style={{ marginRight: "12px" }} />
            Continue with Google
          </button>
          
          <div className={styles.separator}>
            <div className={styles.sepLine}></div>
            <span className={styles.sepText}>Or sign in with email</span>
            <div className={styles.sepLine}></div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
            {/* Dummy inputs to fool browser autofill managers */}
            <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex={-1} />
            <input type="password" name="password_fake" style={{ display: 'none' }} tabIndex={-1} />

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                id="user_email_kraftx"
                name="user_email_kraftx"
                type="email"
                className={styles.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="new-password" 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                id="user_pass_kraftx"
                name="user_pass_kraftx"
                type="password"
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <button id="login-submit" type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.link}>Create one free</Link>
          </p>
          <p className={styles.footer} style={{ marginTop: 8 }}>
            <Link href="/forgot-password" className={styles.link}>Forgot your password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
