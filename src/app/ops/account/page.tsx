"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { OpsBadge } from "@/components/ops/ui/OpsBadge";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileText,
  Save,
  ArrowRight,
  ExternalLink,
  Award,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface EmployeeAccountData {
  profile: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    phone: string;
    roleTitle: string;
    systemRole: string;
    isActive: boolean;
    createdAt: string;
  };
  stats: {
    activeTasksCount: number;
    completedTasksCount: number;
    notesCount: number;
    totalActionsCount: number;
  };
  activeTasks: Array<{
    id: string;
    stage: string;
    status: string;
    iteration: number;
    orderId: string;
    orderNumber: number;
    companyName?: string | null;
    customerName?: string | null;
    priority: string;
    dueDate?: string | null;
    totalQuantity: number;
    startedAt?: string | null;
    notes?: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    stage: string;
    status: string;
    orderId: string;
    orderNumber: number;
    companyName?: string | null;
    createdAt: string;
    completedAt?: string | null;
  }>;
}

export default function OpsAccountPage() {
  const [data, setData] = useState<EmployeeAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAccount = async () => {
    try {
      const res = await fetch("/api/ops/account");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setPhoneInput(json.profile?.phone || "");
        setNameInput(json.profile?.name || "");
      } else {
        toast.error("Failed to load account details");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/ops/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneInput,
          name: nameInput,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        fetchAccount();
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      toast.error("Error saving changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OpsLayout pageTitle="Employee Profile" pageSubtitle="Account & Production Authority">
        <OpsLoadingState message="Loading Employee Profile..." />
      </OpsLayout>
    );
  }

  const profile = data?.profile;
  const stats = data?.stats;
  const activeTasks = data?.activeTasks || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <OpsLayout
      pageTitle="Staff Account & Identity"
      pageSubtitle="Authenticated employee credentials, production statistics, and operational authority"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Profile Banner Card */}
        <div className="bg-white border border-[#ECEEF2] rounded-[24px] p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden">
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E6F7F0]/60 via-transparent to-transparent pointer-events-none rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Employee Avatar Badge */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-lg shadow-[#00A86B]/20 shrink-0">
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "TT"}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#111827] font-sans">
                    {profile?.name}
                  </h2>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F7F0] text-[#00A86B] border border-[#00A86B]/20">
                    {profile?.employeeCode}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4F6F9] text-[#4B5563] border border-[#ECEEF2]">
                    {profile?.roleTitle}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-[#6B7280] flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>{profile?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>
                      Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "2026"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link href="/ops/tasks">
                <OpsButton variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Go to My Tasks
                </OpsButton>
              </Link>
              <Link href="/ops/orders?view=kanban">
                <OpsButton variant="outline" size="sm">
                  Floor Pipeline
                </OpsButton>
              </Link>
            </div>
          </div>

          {/* Equal Operational Authority Notice */}
          <div className="mt-6 pt-5 border-t border-[#ECEEF2] flex items-start gap-3 bg-[#F8FDF9] p-3.5 rounded-xl border-[#D1F2E5]">
            <ShieldCheck className="w-5 h-5 text-[#00A86B] shrink-0 mt-0.5" />
            <div className="text-xs text-[#374151]">
              <span className="font-bold text-[#065F46]">Equal Operational Authority:</span> All 5 Tailoring Turba team members (Neeraj, Sanjay, Pratik, Mahesh, Ajay) possess full execution authorization across all 11 production stages. Every stage transition is recorded with your employee code ({profile?.employeeCode}) and timestamp for complete audit integrity.
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <OpsCard padding="sm" className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block">
                  Active Tasks
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1 block">
                  {stats?.activeTasksCount ?? 0}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">Stages currently in-flight</p>
          </OpsCard>

          <OpsCard padding="sm" className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block">
                  Completed Stages
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#00A86B] mt-1 block">
                  {stats?.completedTasksCount ?? 0}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#00A86B] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">Punched done on floor</p>
          </OpsCard>

          <OpsCard padding="sm" className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block">
                  Internal Notes
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1 block">
                  {stats?.notesCount ?? 0}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">Production logs & updates</p>
          </OpsCard>

          <OpsCard padding="sm" className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block">
                  Station Status
                </span>
                <span className="text-sm font-bold text-[#00A86B] mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                  Active Station
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F4F6F9] text-[#4B5563] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-[#00A86B]" />
              </div>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">Verified Employee ID</p>
          </OpsCard>
        </div>

        {/* Two Column Layout: Profile Form & Active Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Editable Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <OpsCard title="Account Credentials" subtitle="Manage your contact information">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.employeeCode || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F9] border border-[#ECEEF2] text-xs font-mono text-[#4B5563] cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Unique immutable station identifier</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#ECEEF2] focus:border-[#00A86B] text-xs text-[#111827] focus:outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F9] border border-[#ECEEF2] text-xs text-[#4B5563] cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Managed via NextAuth credentials</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 9822000001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#ECEEF2] focus:border-[#00A86B] text-xs text-[#111827] focus:outline-hidden transition-colors"
                  />
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Used for urgent floor broadcasts</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                    Role Title
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.roleTitle || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6F9] border border-[#ECEEF2] text-xs text-[#4B5563] cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <OpsButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    isLoading={saving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Changes
                  </OpsButton>
                </div>
              </form>
            </OpsCard>
          </div>

          {/* Right Column: Live Assigned Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <OpsCard
              title="Assigned In-Flight Tasks"
              subtitle={`You currently have ${activeTasks.length} active production stage(s) assigned`}
              headerAction={
                <Link href="/ops/tasks" className="text-xs font-bold text-[#00A86B] hover:underline flex items-center gap-1">
                  <span>View All In Tasks</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              }
            >
              {activeTasks.length === 0 ? (
                <div className="py-12 text-center text-[#9CA3AF] space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-[#00A86B]/40" />
                  <p className="text-xs font-semibold text-[#4B5563]">You have no pending assigned tasks!</p>
                  <p className="text-[11px] text-[#9CA3AF]">All stages assigned to your station have been executed.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#ECEEF2]">
                  {activeTasks.map((task) => (
                    <div key={task.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/ops/orders/${task.orderId}`}
                            className="text-xs font-bold text-[#111827] hover:text-[#00A86B] transition-colors"
                          >
                            Order #{task.orderNumber}
                          </Link>
                          {task.companyName && (
                            <span className="text-[11px] text-[#6B7280] font-medium truncate">
                              • {task.companyName}
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                              task.priority === "RUSH"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : task.priority === "URGENT"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                          <span className="font-semibold text-[#00A86B] flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {task.stage.replace(/_/g, " ")}
                          </span>
                          <span>Qty: {task.totalQuantity} pcs</span>
                          {task.iteration > 1 && (
                            <span className="text-amber-600 font-bold">Iter {task.iteration}</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Link href={`/ops/orders/${task.orderId}`}>
                          <OpsButton variant="outline" size="sm">
                            Inspect
                          </OpsButton>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </OpsCard>

            {/* Recent Manufacturing Activity */}
            <OpsCard title="Recent Activity Log" subtitle="Last 10 stage transitions logged by your account">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] py-4 text-center">No recent activity logged yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#00A86B] shrink-0" />
                        <span className="font-semibold text-[#111827]">
                          Stage {act.stage.replace(/_/g, " ")}
                        </span>
                        <span className="text-[#6B7280] truncate">
                          for Order #{act.orderNumber} ({act.companyName || "Direct"})
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] shrink-0">
                        {new Date(act.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </OpsCard>
          </div>
        </div>
      </div>
    </OpsLayout>
  );
}
