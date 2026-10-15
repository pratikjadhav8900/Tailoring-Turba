"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FileEdit,
  IndianRupee,
  ArrowLeftRight,
  ShoppingCart,
  Percent,
  Truck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Lock,
  User,
  ShieldCheck,
} from "lucide-react";

function OpsLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/ops";

  // Form states
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved User ID if rememberMe was previously set
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "UnauthorizedRole") {
      setError("This account does not have factory operations privileges. Please log in with your Employee User ID.");
    }
    try {
      const saved = localStorage.getItem("turba_saved_employee_id");
      if (saved) {
        setUserId(saved);
        setRememberMe(true);
      }
    } catch {
      // ignore localStorage errors in private browsing
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = userId.trim();
    if (!cleanId) {
      setError("Please enter your Employee User ID.");
      return;
    }
    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    setLoading(true);

    try {
      if (rememberMe) {
        try {
          localStorage.setItem("turba_saved_employee_id", cleanId);
        } catch {}
      } else {
        try {
          localStorage.removeItem("turba_saved_employee_id");
        } catch {}
      }

      const res = await signIn("credentials", {
        redirect: false,
        email: cleanId.toLowerCase(),
        password,
      });

      if (res?.error) {
        setError("Invalid Employee User ID or password. Please verify your credentials.");
        setLoading(false);
        return;
      }

      // Check if user has active employee or admin access to Ops Station
      const sessionRes = await fetch("/api/ops/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          router.push(callbackUrl);
          router.refresh();
          return;
        }
      }

      setError("Your account does not have active Turba Ops credentials. Please contact your factory supervisor.");
      setLoading(false);
    } catch (err: any) {
      setError("An unexpected authentication error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-[#111827] select-none font-sans overflow-x-hidden">
      {/* ================= LEFT HERO / SHOWCASE SECTION (Desktop Only) ================= */}
      <div className="hidden lg:flex lg:order-1 relative w-full lg:w-[52%] xl:w-[54%] bg-gradient-to-br from-[#00A86B] via-[#009861] to-[#008754] flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden text-white lg:min-h-screen">
        {/* Decorative Geometric Rings / Watermark SVG Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-circles" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="45" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="60" cy="60" r="58" fill="none" stroke="white" strokeWidth="0.8" />
                <path d="M 0,60 L 120,60 M 60,0 L 60,120" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-circles)" />
          </svg>
        </div>

        {/* Ambient Radial Highlights */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo on Green Canvas */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-1.5 shrink-0 overflow-hidden">
            <Image
              src="/turba-logo-mark.png"
              alt="Tailoring Turba Logo"
              width={36}
              height={36}
              className="object-contain w-full h-full"
              priority
              unoptimized
            />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white drop-shadow-xs">
              Tailoring Turba
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-emerald-100">
              Operations & Manufacturing Platform
            </span>
          </div>
        </div>

        {/* Center Container: Tablet Dashboard Mockup + Orbiting Feature Badges */}
        <div className="relative z-10 my-auto py-12 sm:py-16 flex items-center justify-center">
          <div className="relative w-full max-w-[520px] xl:max-w-[560px]">
            {/* ================= FLOATING FEATURE BADGES ================= */}
            {/* 1. Proforma & Quotation (Top Center-Left) */}
            <div className="hidden sm:flex absolute -top-10 left-8 z-30 items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:bg-white/28 transition-all pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center shadow-2xs">
                <FileEdit className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-wide drop-shadow-2xs">
                Proforma & Quotation
              </span>
            </div>

            {/* 2. Payment Receipt (Top Right) */}
            <div className="hidden sm:flex absolute -top-8 right-6 z-30 items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:bg-white/28 transition-all pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center shadow-2xs">
                <IndianRupee className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-wide drop-shadow-2xs">
                Payment Receipt
              </span>
            </div>

            {/* 3. Credit / Debit Note (Middle Left) */}
            <div className="hidden sm:flex absolute top-[40%] -left-12 xl:-left-16 z-30 items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:bg-white/28 transition-all pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center shadow-2xs">
                <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-wide drop-shadow-2xs">
                Credit / Debit Note
              </span>
            </div>

            {/* 4. Purchase Order (Bottom Left) */}
            <div className="hidden sm:flex absolute -bottom-8 left-2 z-30 items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:bg-white/28 transition-all pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center shadow-2xs">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-wide drop-shadow-2xs">
                Purchase Order
              </span>
            </div>

            {/* 5. GST Return Report (Bottom Center) */}
            <div className="hidden sm:flex absolute -bottom-10 left-[36%] z-30 items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:bg-white/28 transition-all pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center shadow-2xs">
                <Percent className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-wide drop-shadow-2xs">
                GST Return Report
              </span>
            </div>

            {/* 6. Delivery Challan (Bottom Right) */}
            <div className="hidden sm:flex absolute -bottom-7 -right-6 z-30 items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:bg-white/28 transition-all pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center shadow-2xs">
                <Truck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-wide drop-shadow-2xs">
                Delivery Challan
              </span>
            </div>

            {/* ================= TABLET WINDOW MOCKUP ================= */}
            <div className="w-full bg-white rounded-2xl border border-white/60 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.32)] overflow-hidden text-[#111827]">
              {/* Window Title Bar */}
              <div className="px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                  <span className="ml-2 font-mono text-[10px] text-[#9CA3AF]">
                    erp.tailoringturba.com/station
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#00A86B] bg-[#00A86B]/10 px-2.5 py-0.5 rounded-full">
                  Live Factory Sync
                </span>
              </div>

              {/* Window Internal Navigation Bar */}
              <div className="px-4 py-2 bg-white border-b border-[#ECEEF2] flex items-center gap-3 overflow-x-auto text-[10px] font-semibold text-[#6B7280]">
                <span className="text-[#00A86B] border-b-2 border-[#00A86B] pb-1">
                  Dashboard
                </span>
                <span className="hover:text-[#111827] cursor-pointer">Quotations</span>
                <span className="hover:text-[#111827] cursor-pointer">Products</span>
                <span className="hover:text-[#111827] cursor-pointer">Sales Orders</span>
                <span className="hover:text-[#111827] cursor-pointer">Production</span>
                <span className="hover:text-[#111827] cursor-pointer">Payments</span>
                <span className="hover:text-[#111827] cursor-pointer">Challans</span>
              </div>

              {/* Window Body: 3 Metric Cards */}
              <div className="p-4 space-y-3 bg-[#FAFBFD]">
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Card 1: Total Sale */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#ECEEF2] shadow-2xs">
                    <span className="text-[9px] font-semibold text-[#6B7280] block">
                      Total Sale
                    </span>
                    <span className="text-xs font-bold text-[#111827] block mt-0.5">
                      ₹ 6,00,000
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[8px] text-[#00A86B] font-bold">
                      <span>+ ₹ 1,00,000</span>
                    </div>
                    {/* Mini Green Bar Chart */}
                    <div className="flex items-end gap-1 h-6 mt-2 pt-1">
                      <span className="w-1.5 h-3 bg-[#00A86B]/40 rounded-xs"></span>
                      <span className="w-1.5 h-4 bg-[#00A86B]/60 rounded-xs"></span>
                      <span className="w-1.5 h-2 bg-[#00A86B]/30 rounded-xs"></span>
                      <span className="w-1.5 h-5 bg-[#00A86B] rounded-xs"></span>
                      <span className="w-1.5 h-3 bg-[#00A86B]/50 rounded-xs"></span>
                      <span className="w-1.5 h-6 bg-[#00A86B] rounded-xs"></span>
                    </div>
                  </div>

                  {/* Card 2: Purchases */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#ECEEF2] shadow-2xs">
                    <span className="text-[9px] font-semibold text-[#6B7280] block">
                      Purchases (Net)
                    </span>
                    <span className="text-xs font-bold text-[#111827] block mt-0.5">
                      ₹ 2,87,012
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[8px] text-[#2563EB] font-bold">
                      <span>Total Invoiced</span>
                    </div>
                    {/* Mini Blue Bar Chart */}
                    <div className="flex items-end gap-1 h-6 mt-2 pt-1">
                      <span className="w-1.5 h-5 bg-[#2563EB] rounded-xs"></span>
                      <span className="w-1.5 h-3 bg-[#2563EB]/40 rounded-xs"></span>
                      <span className="w-1.5 h-4 bg-[#2563EB]/70 rounded-xs"></span>
                      <span className="w-1.5 h-2 bg-[#2563EB]/30 rounded-xs"></span>
                      <span className="w-1.5 h-5 bg-[#2563EB]/90 rounded-xs"></span>
                      <span className="w-1.5 h-4 bg-[#2563EB]/60 rounded-xs"></span>
                    </div>
                  </div>

                  {/* Card 3: Expenses / Jobs */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#ECEEF2] shadow-2xs">
                    <span className="text-[9px] font-semibold text-[#6B7280] block">
                      Expenses (Net)
                    </span>
                    <span className="text-xs font-bold text-[#111827] block mt-0.5">
                      ₹ 4,846
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      {/* CSS Donut Chart */}
                      <div className="w-7 h-7 rounded-full border-3 border-[#F59E0B] border-t-[#00A86B] border-r-[#2563EB] border-b-[#EC4899]"></div>
                      <span className="text-[8px] text-[#9CA3AF] font-mono">
                        3 Categories
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Rows: Sales vs Purchase Outstanding Progress */}
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="p-2 bg-white rounded-lg border border-[#ECEEF2]">
                    <div className="flex justify-between font-semibold text-[#4B5563] mb-1">
                      <span>Sales Outstanding</span>
                      <span className="font-bold text-[#111827]">₹ 11,27,149</span>
                    </div>
                    <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#00A86B] h-full w-[72%]"></div>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-[#ECEEF2]">
                    <div className="flex justify-between font-semibold text-[#4B5563] mb-1">
                      <span>Purchase Outstanding</span>
                      <span className="font-bold text-[#111827]">₹ 2,04,424</span>
                    </div>
                    <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#2563EB] h-full w-[45%]"></div>
                    </div>
                  </div>
                </div>

                {/* Overlapping Pop-up Card on Bottom Right */}
                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-lg mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#111827] block">
                      Monthly Invoicing Summary
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[8px] text-[#4B5563]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]"></span> Sale
                      </span>
                      <span className="flex items-center gap-1 text-[8px] text-[#4B5563]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span> Purchase
                      </span>
                    </div>
                  </div>

                  {/* Micro-grouped Bars */}
                  <div className="flex items-end gap-1.5 h-7">
                    <div className="flex items-end gap-0.5">
                      <span className="w-1 h-3 bg-[#00A86B] rounded-xs"></span>
                      <span className="w-1 h-4 bg-[#2563EB] rounded-xs"></span>
                    </div>
                    <div className="flex items-end gap-0.5">
                      <span className="w-1 h-5 bg-[#00A86B] rounded-xs"></span>
                      <span className="w-1 h-3 bg-[#2563EB] rounded-xs"></span>
                    </div>
                    <div className="flex items-end gap-0.5">
                      <span className="w-1 h-4 bg-[#00A86B] rounded-xs"></span>
                      <span className="w-1 h-6 bg-[#2563EB] rounded-xs"></span>
                    </div>
                    <div className="flex items-end gap-0.5">
                      <span className="w-1 h-6 bg-[#00A86B] rounded-xs"></span>
                      <span className="w-1 h-5 bg-[#2563EB] rounded-xs"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Pills Strip (Visible only on mobile screens) */}
        <div className="relative z-10 flex sm:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white shrink-0">
            Proforma & Quotation
          </span>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white shrink-0">
            Payment Receipt
          </span>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white shrink-0">
            Delivery Challan
          </span>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white shrink-0">
            GST Reports
          </span>
        </div>

        {/* Bottom Tagline on Green Canvas */}
        <div className="relative z-10 text-[11px] text-emerald-100 hidden lg:block">
          Trusted by apparel manufacturers, screen printers, and garment brands across India.
        </div>
      </div>

      {/* ================= RIGHT FORM SECTION ================= */}
      <div className="w-full lg:w-[48%] xl:w-[46%] bg-white flex flex-col justify-between px-6 py-10 sm:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto">
          {/* Brand Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F8F9FB] border border-[#ECEEF2] flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                <Image
                  src="/turba-logo-mark.png"
                  alt="Tailoring Turba"
                  width={24}
                  height={24}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#111827]">
                Tailoring Turba
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#00A86B]/10 text-[#00A86B] border border-[#00A86B]/20">
                OPS STATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-3 tracking-tight">
              Employee Login
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Enter the User ID and password provided by factory management.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: User ID / Employee Code */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                User ID / Employee Code<span className="text-red-500">*</span>
              </label>

              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter employee User ID (e.g. TT001, TT004)"
                  autoComplete="username"
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Quick Profile Select Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[#9CA3AF]">Quick select:</span>
                {[
                  { label: "Neeraj (Founder)", id: "TT001", pw: "turba@neeraj123" },
                  { label: "Sanjay", id: "TT002", pw: "turba@sanjay123" },
                  { label: "Pratik", id: "TT003", pw: "turba@pratik123" },
                  { label: "Mahesh (Worker)", id: "TT004", pw: "worker@mahesh123" },
                  { label: "Ajay (Worker)", id: "TT005", pw: "worker@ajay123" },
                ].map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUserId(u.id);
                      setPassword(u.pw);
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#F4F6F9] hover:bg-emerald-50 text-[10px] font-semibold text-[#4B5563] hover:text-[#00A86B] border border-[#E5E7EB] transition-colors"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#374151]">
                  Password<span className="text-red-500">*</span>
                </label>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3.5 pr-10 py-2.5 text-xs sm:text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#4B5563]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D1D5DB] text-[#00A86B] focus:ring-[#00A86B] cursor-pointer"
                />
                <span>Remember me on this device</span>
              </label>

              <span className="text-[11px] text-[#9CA3AF]">
                Internal Station Access
              </span>
            </div>

            {/* Action Button: Emerald Green Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[140px] px-8 py-2.5 rounded-lg bg-[#00A86B] hover:bg-[#00925d] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Supervisor / Admin Assistance Note */}
          <div className="mt-8 p-3 rounded-xl bg-[#F9FAFB] border border-[#ECEEF2] text-xs text-[#6B7280] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#374151]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>Operator Credentials Notice</span>
            </div>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              Station accounts are issued exclusively by factory administration. If you have forgotten your password or need a new station login, contact your floor supervisor.
            </p>
          </div>

          {/* Back to Website Link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A86B] hover:text-[#008754] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to TailoringTurba.com</span>
            </Link>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="w-full text-center text-[11px] text-[#9CA3AF] mt-10 pt-4 border-t border-[#F3F4F6]">
          Copyright © 2026 Tailoring Turba - Apparel Manufacturing & Operations Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function OpsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-[#9CA3AF] text-xs font-sans">
          Loading Station Login...
        </div>
      }
    >
      <OpsLoginForm />
    </Suspense>
  );
}
