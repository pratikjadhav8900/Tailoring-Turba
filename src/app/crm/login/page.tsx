"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck, TrendingUp, Users, Target } from "lucide-react";

function CrmLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // SECURITY: only accept a same-origin relative path (see src/app/ops/login/page.tsx for
  // why — an absolute/protocol-relative value here is an open redirect).
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/crm";
  const callbackUrl = rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//") ? rawCallbackUrl : "/crm";

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "UnauthorizedRole") {
      setError("This account does not have Sales CRM access. Ask your admin to set your department to SALES.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId.trim() || !password) {
      setError("Please enter your User ID and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: userId.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        setError("Invalid User ID or password.");
        setLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/crm/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          router.push(callbackUrl);
          router.refresh();
          return;
        }
      }

      setError("Your account does not have active Sales CRM access.");
      setLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-[#111827] select-none font-sans overflow-x-hidden">
      <div className="hidden lg:flex lg:order-1 relative w-full lg:w-[48%] bg-gradient-to-br from-[#FF6A39] via-[#F2582A] to-[#E0481C] flex-col justify-between p-10 lg:p-12 overflow-hidden text-white lg:min-h-screen">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-1.5 shrink-0 overflow-hidden">
            <Image src="/turba-logo-mark.png" alt="Tailoring Turba Logo" width={36} height={36} className="object-contain w-full h-full" priority unoptimized />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white drop-shadow-xs">Tailoring Turba</span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-orange-100">Sales CRM</span>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12 space-y-6">
          <h2 className="text-3xl font-bold leading-tight max-w-sm">Every lead, one pipeline, zero drop-offs.</h2>
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3">
              <Target className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Meta & Google Ads leads land here automatically</span>
            </div>
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3">
              <Users className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Work your assigned leads and the old customer list</span>
            </div>
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Track score, status and follow-ups in one view</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-orange-100">
          Internal tool for the Tailoring Turba sales team.
        </div>
      </div>

      <div className="w-full lg:w-[52%] bg-white flex flex-col justify-between px-6 py-10 sm:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F8F9FB] border border-[#ECEEF2] flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                <Image src="/turba-logo-mark.png" alt="Tailoring Turba" width={24} height={24} className="object-contain" unoptimized />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#111827]">Tailoring Turba</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#FF6A39]/10 text-[#FF6A39] border border-[#FF6A39]/20">SALES CRM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-3 tracking-tight">Sales Login</h1>
            <p className="text-xs text-[#6B7280] mt-1">Enter the User ID and password provided by management.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                User ID / Employee Code<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your employee User ID"
                autoComplete="username"
                className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FF6A39] focus:ring-2 focus:ring-[#FF6A39]/20 outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[140px] px-8 py-2.5 rounded-lg bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-3 rounded-xl bg-[#F9FAFB] border border-[#ECEEF2] text-xs text-[#6B7280] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#374151]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A39]" />
              <span>Sales Account Notice</span>
            </div>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              Sales CRM accounts reuse your Tailoring Turba Ops employee login. Contact an admin if you need access enabled.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A39] hover:text-[#E85A2A] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to TailoringTurba.com</span>
            </Link>
          </div>
        </div>

        <div className="w-full text-center text-[11px] text-[#9CA3AF] mt-10 pt-4 border-t border-[#F3F4F6]">
          Copyright © 2026 Tailoring Turba. Internal Sales Platform.
        </div>
      </div>
    </div>
  );
}

export default function CrmLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-[#9CA3AF] text-xs font-sans">
          Loading Sales Login...
        </div>
      }
    >
      <CrmLoginForm />
    </Suspense>
  );
}
