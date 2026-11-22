"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import toast from "react-hot-toast";
import { Pencil, Save, X, Phone, Mail, Calendar, ShieldCheck, Users, Trophy, XCircle, ListChecks, Camera } from "lucide-react";

interface AccountProfile {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  department: string;
  systemRole: string;
  isActive: boolean;
  image: string | null;
  createdAt: string;
}

interface AccountStats {
  assignedCount: number;
  wonCount: number;
  lostCount: number;
  openTaskCount: number;
  activityCount: number;
  conversionRate: number | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2]">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7280]">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="text-xl font-bold text-[#111827] mt-1">{value}</div>
    </div>
  );
}

export default function CrmSettingsPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchAccount = async () => {
    const res = await fetch("/api/crm/account");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProfile(data.profile);
    setStats(data.stats);
    setNameInput(data.profile.name);
    setPhoneInput(data.profile.phone);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/crm/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput, phone: phoneInput }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success("Profile updated");
      setEditing(false);
      fetchAccount();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/crm/account/avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      toast.success("Photo updated");
      fetchAccount();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <CrmLayout pageTitle="Settings" pageSubtitle="Your sales account">
        <div className="text-sm text-[#9CA3AF]">Loading account...</div>
      </CrmLayout>
    );
  }

  if (!profile) {
    return (
      <CrmLayout pageTitle="Settings" pageSubtitle="Your sales account">
        <div className="text-sm text-[#9CA3AF]">Unable to load account details.</div>
      </CrmLayout>
    );
  }

  return (
    <CrmLayout
      pageTitle="Settings"
      pageSubtitle="Your sales account"
      headerAction={
        !editing ? (
          <button
            onClick={() => setEditing(true)}
            className="h-9 px-4 rounded-full bg-white border border-[#ECEEF2] hover:border-[#D1D5DB] text-[#4B5563] hover:text-[#111827] text-xs font-semibold flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setNameInput(profile.name);
                setPhoneInput(profile.phone);
              }}
              className="h-9 px-3.5 rounded-full bg-white border border-[#ECEEF2] text-[#4B5563] text-xs font-semibold flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-full bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-4xl">
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="relative w-24 h-24 shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#FFF1EB] border-2 border-[#FFE1D1] flex items-center justify-center">
                {profile.image ? (
                  <Image src={profile.image} alt={profile.name} width={96} height={96} className="object-cover w-full h-full" unoptimized />
                ) : (
                  <span className="text-2xl font-bold text-[#FF6A39]">{initials(profile.name)}</span>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoSelected(e.target.files[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Upload photo"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FF6A39] hover:bg-[#E85A2A] text-white flex items-center justify-center shadow-md border-2 border-white disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {editing ? (
              <div className="w-full mt-4">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm font-semibold text-center text-[#111827] focus:border-[#FF6A39] outline-none"
                />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#111827] mt-4">{profile.name}</h2>
                <p className="text-xs text-[#9CA3AF]">{profile.roleTitle}</p>
              </>
            )}

            <div className="flex items-center gap-1.5 mt-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1EB] text-[#FF6A39] border border-[#FFE1D1]">
                {profile.employeeCode}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  profile.isActive ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]" : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                }`}
              >
                {profile.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#111827] uppercase">Contact & Role</h3>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <span className="text-[#9CA3AF] w-28 shrink-0">Email</span>
              <span className="font-medium text-[#111827]">{profile.email}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <span className="text-[#9CA3AF] w-28 shrink-0">Phone</span>
              {editing ? (
                <input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 bg-white border border-[#D1D5DB] rounded-lg px-3 py-1.5 text-sm text-[#111827] focus:border-[#FF6A39] outline-none"
                />
              ) : (
                <span className="font-medium text-[#111827]">{profile.phone || "—"}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <span className="text-[#9CA3AF] w-28 shrink-0">Department</span>
              <span className="font-medium text-[#111827]">{profile.department || "—"}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-[#9CA3AF] shrink-0" />
              <span className="text-[#9CA3AF] w-28 shrink-0">Member Since</span>
              <span className="font-medium text-[#111827]">
                {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6">
            <h3 className="text-xs font-bold text-[#111827] uppercase mb-3.5">Sales Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatTile icon={<Users className="w-3.5 h-3.5" />} label="Leads Assigned" value={stats?.assignedCount ?? 0} color="#2563EB" />
              <StatTile icon={<Trophy className="w-3.5 h-3.5" />} label="Converted" value={stats?.wonCount ?? 0} color="#059669" />
              <StatTile icon={<XCircle className="w-3.5 h-3.5" />} label="Not Interested" value={stats?.lostCount ?? 0} color="#DC2626" />
              <StatTile icon={<ListChecks className="w-3.5 h-3.5" />} label="Open Tasks" value={stats?.openTaskCount ?? 0} color="#D97706" />
              <StatTile
                icon={<Trophy className="w-3.5 h-3.5" />}
                label="Conversion Rate"
                value={stats?.conversionRate != null ? `${stats.conversionRate}%` : "—"}
                color="#FF6A39"
              />
              <StatTile icon={<Users className="w-3.5 h-3.5" />} label="Activities Logged" value={stats?.activityCount ?? 0} color="#7C3AED" />
            </div>
          </div>
        </div>
      </div>
    </CrmLayout>
  );
}
