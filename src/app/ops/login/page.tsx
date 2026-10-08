"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scissors, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { OpsButton } from "@/components/ops/ui/OpsButton";

function OpsLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/ops";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        setError("Invalid employee email or password.");
        setLoading(false);
        return;
      }

      // Check if user has employee access
      const sessionRes = await fetch("/api/ops/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          router.push(callbackUrl);
          router.refresh();
          return;
        }
      }

      setError("Your account does not have active Turba Ops credentials.");
      setLoading(false);
    } catch (err: any) {
      setError("An unexpected authentication error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="ops-root min-h-screen bg-[#090a0f] flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-sm">
        {/* Brand Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-3 shadow-lg shadow-amber-500/5">
            <Scissors className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
            TURBA OPS
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Tailoring Turba Manufacturing Control
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#10121a] border border-[#1e2230] rounded-lg p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-100 mb-1">
            Employee Sign In
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Enter your individual employee credentials to access production ops.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@tailoringturba.com"
                  className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <OpsButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full mt-2"
            >
              Sign In to Ops
            </OpsButton>
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6 text-[11px] text-slate-500">
          Tailoring Turba Internal Production System • All operations are logged.
        </div>
      </div>
    </div>
  );
}

export default function OpsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-500 text-xs">
          Loading Turba Ops Login...
        </div>
      }
    >
      <OpsLoginForm />
    </Suspense>
  );
}
