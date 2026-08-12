"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./AuthForm.module.css";
import { Globe, ArrowRight, Check } from "lucide-react";
import { validateAndNormalizePhone } from "@/lib/phone";
import { auth, hasFirebaseConfig } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const COUNTRIES = [
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "UAE", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭" }
];

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

  const [registerTab, setRegisterTab] = useState<'email' | 'phone'>('email');
  const [otp, setOtp] = useState("");
  const [signupAttemptId, setSignupAttemptId] = useState("");
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  // Touch states for inline errors
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Firebase state
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Country selector states
  const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let script: HTMLScriptElement;
    if (mode === "register") {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      (window as any).onTurnstileSuccess = (token: string) => {
        setTurnstileToken(token);
      };
    }
    return () => {
      if (script) {
        document.body.removeChild(script);
      }
      delete (window as any).onTurnstileSuccess;
    };
  }, [mode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpCooldown]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");
      if (oauthError === "OAuthAccountNotLinked") {
        setError("This email is already registered using a password. Please sign in with your email and password instead.");
      } else if (oauthError === "VerificationRequiredToLink") {
        setError("An account with this email already exists but is not verified. Please verify your email address via the link sent to your inbox before linking your Apple or Google account.");
      } else if (oauthError === "OAuthSignin" || oauthError === "OAuthCallback" || oauthError === "OAuthCreateAccount") {
        setError("An error occurred during Google/Apple sign-in. Please try again.");
      } else if (oauthError) {
        setError(`Authentication failed: ${oauthError}. Please try again.`);
      }
    }
  }, []);

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

  // Handle mode sync with URL
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const currentDialCode = COUNTRIES.find(c => c.code === selectedCountryCode)?.dialCode || "+91";

  // Form Validations
  const isNameValid = name.trim().length >= 2 && !/\d/.test(name) && /^[a-zA-Z\s'.]+$/.test(name);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isConfirmPasswordValid = confirmPassword === password;
  const isPhoneInputValid = validateAndNormalizePhone(phone, selectedCountryCode).isValid;

  const isFormValid = registerTab === "email"
    ? (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && !!turnstileToken)
    : (isPhoneVerified && isNameValid && isPasswordValid && isConfirmPasswordValid && !!turnstileToken);

  async function handleSendOtp() {
    const validation = validateAndNormalizePhone(phone, selectedCountryCode);
    if (!validation.isValid || !validation.normalized) {
      setError("Please enter a valid mobile number.");
      return;
    }
    setOtpLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // 1. Register signup attempt with backend first (rate-limit check & duplicate account check)
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: validation.normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpLoading(false);
        setError(data.error || "Failed to start signup attempt.");
        return;
      }

      const attemptId = data.signupAttemptId;
      setSignupAttemptId(attemptId);

      // 2. Dispatch OTP via Firebase or Mock Mode
      if (hasFirebaseConfig && auth) {
        // Setup invisible recaptcha verifier
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
          });
        }
        const appVerifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, validation.normalized, appVerifier);
        setConfirmationResult(result);
        setSuccessMessage("Verification SMS sent successfully to your phone via Firebase!");
      } else {
        // Fallback Mock mode (handled by backend log statement)
        setSuccessMessage(`[MOCK MODE] Verification code logged to server console.`);
      }

      setOtpLoading(false);
      setOtpCooldown(60);
    } catch (err: any) {
      setOtpLoading(false);
      console.error("[OTP_SEND_ERROR]", err);
      // Map technical Firebase error messages
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format for the selected country.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. SMS rate limit exceeded by Firebase.");
      } else {
        setError(err.message || "Failed to send OTP. Please try again.");
      }
    }
  }

  async function handleVerifyOtp() {
    const validation = validateAndNormalizePhone(phone, selectedCountryCode);
    if (!validation.isValid || !validation.normalized) {
      setError("Please enter a valid mobile number.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP code.");
      return;
    }
    setVerifyLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      let idToken = "";

      if (hasFirebaseConfig && confirmationResult) {
        // Verify with Firebase
        const credential = await confirmationResult.confirm(otp);
        idToken = await credential.user.getIdToken();
      }

      // Verify the ID token (or OTP in mock fallback) on the backend
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: validation.normalized,
          otp: !hasFirebaseConfig ? otp : undefined,
          idToken: hasFirebaseConfig ? idToken : undefined,
          signupAttemptId
        }),
      });
      const data = await res.json();
      setVerifyLoading(false);
      if (!res.ok) {
        setError(data.error || "Invalid OTP code.");
      } else {
        setPhoneVerificationToken(data.phoneVerificationToken);
        setIsPhoneVerified(true);
        setSuccessMessage("Mobile number verified successfully!");
      }
    } catch (err: any) {
      setVerifyLoading(false);
      console.error("[OTP_VERIFY_ERROR]", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid verification code. Please check your SMS and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("Verification code expired. Please request a new OTP.");
      } else {
        setError(err.message || "Failed to verify OTP. Please try again.");
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === "email_not_verified") {
        setError("EMAIL_NOT_VERIFIED");
      } else if (res.error === "phone_not_verified") {
        setError("PHONE_NOT_VERIFIED");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } else {
      router.push("/dashboard");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) {
      setError("Please fill in all fields correctly.");
      return;
    }

    const validation = registerTab === "phone" ? validateAndNormalizePhone(phone, selectedCountryCode) : null;
    const finalPhone = validation ? validation.normalized : undefined;

    setLoading(true);
    setError("");
    setSuccessMessage("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: registerTab === "email" ? email : undefined,
        phone: finalPhone,
        password,
        isB2B,
        companyName,
        gstNumber,
        registerMethod: registerTab,
        turnstileToken,
        signupAttemptId: registerTab === "phone" ? signupAttemptId : undefined,
        phoneVerificationToken: registerTab === "phone" ? phoneVerificationToken : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed. Please try again.");
      if (typeof window !== "undefined" && (window as any).turnstile) {
        (window as any).turnstile.reset();
        setTurnstileToken("");
      }
    } else {
      if (registerTab === "email") {
        setRegisteredEmail(email);
        setShowCheckEmail(true);
        setError("");
        if (data.emailSent === false) {
          setResendError("Account created, but we failed to send the verification email. Please click 'Resend Verification Email' to try again.");
        } else {
          setResendError("");
        }
      } else {
        // Automatic login for mobile registered users
        setLoading(true);
        const loginRes = await signIn("credentials", {
          email: finalPhone,
          password,
          redirect: false,
        });
        setLoading(false);
        if (loginRes?.error) {
          setError("Account created successfully. Please login manually.");
          setMode("login");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }

  async function handleResendVerification() {
    const targetEmail = registeredEmail || email;
    if (!targetEmail) {
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
        body: JSON.stringify({ email: targetEmail }),
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

  if (!mounted) return null;

  if (showCheckEmail) {
    return (
      <div className={styles.authWrapper}>
        <div className={styles.authCard}>
          <div className={styles.banner}>
            Join the Club & Get <span>15% OFF</span> your first custom order
          </div>
          <div className={styles.content}>
            <div className={styles.header} style={{ marginBottom: '24px' }}>
              <Link href="/" className={styles.logo}>Tailoring <span>Turba</span></Link>
              <h2 className={styles.title} style={{ marginTop: '24px', fontSize: '1.8rem' }}>Check your email</h2>
              <p className={styles.sub} style={{ marginTop: '16px', fontSize: '0.95rem' }}>
                We've sent a verification link to:
              </p>
              <p style={{ fontWeight: 700, color: '#1a1a1a', margin: '12px 0', fontSize: '1.05rem', wordBreak: 'break-all' }}>
                {registeredEmail}
              </p>
              <p className={styles.sub} style={{ marginTop: '12px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0}
                className={styles.resendBtn}
                style={{ width: '100%', padding: '14px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}
              >
                {resendLoading ? "Resending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
              </button>

              {resendMessage && <p className={styles.resendSuccess} style={{ textAlign: 'center', margin: 0 }}>{resendMessage}</p>}
              {resendError && <p className={styles.resendError} style={{ textAlign: 'center', margin: 0 }}>{resendError}</p>}

              <button
                type="button"
                onClick={() => {
                  setShowCheckEmail(false);
                  setSuccessMessage("");
                  setError("");
                  setMode("login");
                }}
                className={styles.socialBtn}
                style={{ width: '100%', padding: '14px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* <button
              type="button"
              onClick={() => signIn('apple', { callbackUrl: '/dashboard' })}
              className={styles.socialBtn}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: "2px" }}>
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.48C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.1 16.67C20.08 16.74 19.67 18.11 18.71 19.5M15.97 4.17C16.63 3.37 17.07 2.28 16.95 1C16 1.04 14.9 1.6 14.24 2.38C13.68 3.04 13.19 4.14 13.34 5.39C14.39 5.47 15.4 4.88 15.97 4.17Z" />
              </svg>
              Apple
            </button> */}
          </div>

          <div className={styles.separator}>
            <div className={styles.sepLine}></div>
            <span className={styles.sepText}>OR USE EMAIL</span>
            <div className={styles.sepLine}></div>
          </div>

          {successMessage && <div className={styles.successAlert}>{successMessage}</div>}

          {error === "EMAIL_NOT_VERIFIED" && (
            <div className={styles.unverifiedBanner}>
              <p className={styles.unverifiedText}>
                Please verify your email address before continuing.
              </p>
              <div className={styles.resendSection}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading || resendCooldown > 0}
                  className={styles.resendBtn}
                >
                  {resendLoading ? "Resending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                </button>
              </div>
              {resendMessage && <p className={styles.resendSuccess}>{resendMessage}</p>}
              {resendError && <p className={styles.resendError}>{resendError}</p>}
            </div>
          )}

          {error && error !== "EMAIL_NOT_VERIFIED" && <div className={styles.error}>{error}</div>}

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
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.input}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.form}>
              {/* Register Tabs */}
              <div className={styles.registerTabs}>
                <button
                  type="button"
                  className={`${styles.registerTab} ${registerTab === "email" ? styles.registerTabActive : ""}`}
                  onClick={() => { setRegisterTab("email"); setError(""); setSuccessMessage(""); }}
                >
                  Email Address
                </button>
                <button
                  type="button"
                  className={`${styles.registerTab} ${registerTab === "phone" ? styles.registerTabActive : ""}`}
                  onClick={() => { setRegisterTab("phone"); setError(""); setSuccessMessage(""); }}
                >
                  Mobile Number
                </button>
              </div>

              {registerTab === "email" ? (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onBlur={() => setNameTouched(true)}
                      required
                    />
                    {name && nameTouched && !isNameValid && (
                      <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                        Please enter a valid full name.
                      </p>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input
                      type="email"
                      className={styles.input}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      required
                    />
                    {email && emailTouched && !isEmailValid && (
                      <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                        Please enter a valid email address.
                      </p>
                    )}
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Password</label>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showPassword ? "text" : "password"}
                          className={styles.input}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onBlur={() => setPasswordTouched(true)}
                          required
                        />
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                              <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                              <line x1="2" y1="2" x2="22" y2="22" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {password && passwordTouched && !isPasswordValid && (
                        <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                          Password must be at least 8 characters.
                        </p>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Confirm</label>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={styles.input}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          onBlur={() => setConfirmPasswordTouched(true)}
                          required
                        />
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                              <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                              <line x1="2" y1="2" x2="22" y2="22" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {confirmPassword && confirmPasswordTouched && !isConfirmPasswordValid && (
                        <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                          Passwords do not match.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Phone input and send OTP */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Phone Number</label>
                    <div className={styles.otpRow}>
                      <div className={styles.countrySelectorContainer}>
                        <button
                          type="button"
                          className={styles.countryTrigger}
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          disabled={isPhoneVerified}
                        >
                          <span>{COUNTRIES.find(c => c.code === selectedCountryCode)?.flag}</span>
                          <span>{COUNTRIES.find(c => c.code === selectedCountryCode)?.dialCode}</span>
                          <span style={{ fontSize: "0.6rem" }}>▼</span>
                        </button>

                        {showCountryDropdown && (
                          <div className={styles.countryDropdown}>
                            <input
                              type="text"
                              className={styles.countrySearchInput}
                              placeholder="Search country or code..."
                              value={countrySearchQuery}
                              onChange={e => setCountrySearchQuery(e.target.value)}
                              autoFocus
                            />
                            <div className={styles.countryList}>
                              {COUNTRIES.filter(c =>
                                c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                c.code.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                c.dialCode.includes(countrySearchQuery)
                              ).map(c => (
                                <div
                                  key={c.code}
                                  className={styles.countryOption}
                                  onClick={() => {
                                    setSelectedCountryCode(c.code);
                                    setCountrySearchQuery("");
                                    setShowCountryDropdown(false);
                                    setPhoneTouched(true);
                                  }}
                                >
                                  <span>{c.flag}</span>
                                  <span>{c.name} ({c.dialCode})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <input
                          type="tel"
                          className={`${styles.input} ${styles.phoneInputWithSelector}`}
                          value={phone}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, ""); // Allow only digits
                            if (val.length <= 15) {
                              setPhone(val);
                            }
                          }}
                          onBlur={() => setPhoneTouched(true)}
                          placeholder="9876543210"
                          disabled={isPhoneVerified}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading || otpCooldown > 0 || isPhoneVerified || !isPhoneInputValid}
                        className={styles.socialBtn}
                        style={{ whiteSpace: "nowrap", padding: "12px 16px", height: "48px" }}
                      >
                        {otpLoading ? "Sending..." : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Send OTP"}
                      </button>
                    </div>
                    {phone && phoneTouched && !isPhoneInputValid && (
                      <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "6px" }}>
                        Please enter a valid mobile number.
                      </p>
                    )}
                    {/* Firebase Invisible reCAPTCHA target */}
                    <div id="recaptcha-container"></div>
                  </div>

                  {/* OTP Enter and verify */}
                  {signupAttemptId && !isPhoneVerified && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Enter OTP</label>
                      <div className={styles.otpRow}>
                        <input
                          type="text"
                          className={styles.input}
                          value={otp}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 6) {
                              setOtp(val);
                            }
                          }}
                          placeholder="6-digit code"
                          maxLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifyLoading || !/^\d{6}$/.test(otp)}
                          className={styles.socialBtn}
                          style={{ whiteSpace: "nowrap", padding: "12px 16px", height: "48px" }}
                        >
                          {verifyLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Additional registration details shown after mobile verified */}
                  {isPhoneVerified && (
                    <>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                          type="text"
                          className={styles.input}
                          value={name}
                          onChange={e => setName(e.target.value)}
                          onBlur={() => setNameTouched(true)}
                          required
                        />
                        {name && nameTouched && !isNameValid && (
                          <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                            Please enter a valid full name.
                          </p>
                        )}
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Password</label>
                          <div className={styles.passwordWrapper}>
                            <input
                              type={showPassword ? "text" : "password"}
                              className={styles.input}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              onBlur={() => setPasswordTouched(true)}
                              required
                            />
                            <button
                              type="button"
                              className={styles.eyeBtn}
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                  <line x1="2" y1="2" x2="22" y2="22" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {password && passwordTouched && !isPasswordValid && (
                            <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                              Password must be at least 8 characters.
                            </p>
                          )}
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Confirm</label>
                          <div className={styles.passwordWrapper}>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className={styles.input}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              onBlur={() => setConfirmPasswordTouched(true)}
                              required
                            />
                            <button
                              type="button"
                              className={styles.eyeBtn}
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                  <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                  <line x1="2" y1="2" x2="22" y2="22" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {confirmPassword && confirmPasswordTouched && !isConfirmPasswordValid && (
                            <p className={styles.inlineError} style={{ color: "red", fontSize: "0.8rem", marginTop: "4px" }}>
                              Passwords do not match.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Show remaining signup fields when method is verified */}
              {(registerTab === "email" || isPhoneVerified) && (
                <>
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

                  {/* Cloudflare Turnstile Container */}
                  <div
                    className="cf-turnstile"
                    data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                    data-callback="onTurnstileSuccess"
                    style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
                  />

                  <button type="submit" className={styles.submitBtn} disabled={loading || !isFormValid}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </>
              )}
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
