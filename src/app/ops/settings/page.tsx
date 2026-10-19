"use client";

import React, { useState, useEffect } from "react";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Check,
  Save,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface OpsUserSettings {
  soundEnabled: boolean;
  soundVolume: number;
  alertNewOrders: boolean;
  alertUrgentOrders: boolean;
  alertRework: boolean;
  alertDispatchReady: boolean;
  pollIntervalSec: number;
  tableDensity: "compact" | "comfortable";
  defaultOrdersView: "list" | "kanban";
  defaultTaskFilter: "my" | "all";
}

const DEFAULT_SETTINGS: OpsUserSettings = {
  soundEnabled: true,
  soundVolume: 80,
  alertNewOrders: true,
  alertUrgentOrders: true,
  alertRework: true,
  alertDispatchReady: true,
  pollIntervalSec: 15,
  tableDensity: "comfortable",
  defaultOrdersView: "list",
  defaultTaskFilter: "my",
};

export default function OpsSettingsPage() {
  const [settings, setSettings] = useState<OpsUserSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("turba_ops_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.warn("Could not load stored ops settings", e);
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("turba_ops_settings", JSON.stringify(settings));
      toast.success("Preferences saved successfully!");
    } catch (e) {
      toast.error("Failed to save preferences.");
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem("turba_ops_settings");
      toast.success("Settings reset to factory defaults.");
    } catch (e) {
      // ignore
    }
  };

  const playTestChime = () => {
    if (!settings.soundEnabled) {
      toast.error("Sound alerts are currently muted!");
      return;
    }
    setIsTestingSound(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        toast.error("AudioContext not supported by your browser");
        setIsTestingSound(false);
        return;
      }
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const volumeScale = (settings.soundVolume / 100) * 0.15;
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(volumeScale, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);

      toast.success("Chime played successfully! 🔔");
    } catch (err) {
      console.error(err);
      toast.error("Audio blocked by browser. Click anywhere on page first.");
    } finally {
      setTimeout(() => setIsTestingSound(false), 500);
    }
  };

  if (!mounted) return null;

  return (
    <OpsLayout
      pageTitle="Operations Settings"
      pageSubtitle="Audio alerts, notification filters, display preferences, and workstation defaults"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Save Bar */}
        <div className="flex items-center justify-between bg-white border border-[#ECEEF2] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Station Configuration</h2>
              <p className="text-[11px] text-[#6B7280]">
                All preferences are saved to your browser session and applied immediately.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OpsButton
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </OpsButton>
            <OpsButton
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Preferences
            </OpsButton>
          </div>
        </div>

        {/* Section 1: Sound & Audio Alerts */}
        <OpsCard
          title="Sound & Audio Alerts"
          subtitle="Configure audio bells when new orders arrive or urgent floor tasks are flagged"
        >
          <div className="space-y-5">
            {/* Master Sound Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-[#ECEEF2]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    settings.soundEnabled ? "bg-[#ECFDF5] text-[#00A86B]" : "bg-[#F3F4F6] text-[#9CA3AF]"
                  }`}
                >
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111827]">Audio Chimes</div>
                  <div className="text-[11px] text-[#6B7280]">
                    Play synthetic chime on high-priority manufacturing alerts
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <OpsButton
                  variant="outline"
                  size="sm"
                  onClick={playTestChime}
                  isLoading={isTestingSound}
                >
                  🔔 Test Chime
                </OpsButton>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.soundEnabled ? "bg-[#00A86B]" : "bg-[#D1D5DB]"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.soundEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Volume Slider */}
            {settings.soundEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[#374151]">
                  <span>Alert Volume</span>
                  <span className="font-mono text-[#00A86B]">{settings.soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.soundVolume}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, soundVolume: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-[#00A86B] cursor-pointer"
                />
              </div>
            )}
          </div>
        </OpsCard>

        {/* Section 2: Notification Triggers */}
        <OpsCard
          title="Notification Triggers"
          subtitle="Choose which manufacturing events trigger broadcast badges and popup banners"
        >
          <div className="divide-y divide-[#ECEEF2]">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#111827]">New Customer Orders</div>
                <div className="text-[11px] text-[#6B7280]">
                  Emit alert when order advance payment is verified via Razorpay
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({ ...s, alertNewOrders: !s.alertNewOrders }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.alertNewOrders ? "bg-[#00A86B]" : "bg-[#D1D5DB]"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.alertNewOrders ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#111827]">Urgent & Rush Orders (24h/48h)</div>
                <div className="text-[11px] text-[#6B7280]">
                  High priority alerts for orders flagged with urgent due dates
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({ ...s, alertUrgentOrders: !s.alertUrgentOrders }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.alertUrgentOrders ? "bg-[#00A86B]" : "bg-[#D1D5DB]"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.alertUrgentOrders ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#111827]">QC Rework Flagged</div>
                <div className="text-[11px] text-[#6B7280]">
                  Instant floor warning when a garment fails quality inspection
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({ ...s, alertRework: !s.alertRework }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.alertRework ? "bg-[#00A86B]" : "bg-[#D1D5DB]"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.alertRework ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#111827]">Ready for Dispatch</div>
                <div className="text-[11px] text-[#6B7280]">
                  Alert packing station when all manufacturing items are boxed
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({ ...s, alertDispatchReady: !s.alertDispatchReady }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.alertDispatchReady ? "bg-[#00A86B]" : "bg-[#D1D5DB]"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.alertDispatchReady ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </OpsCard>

        {/* Section 3: Workstation Defaults */}
        <OpsCard
          title="Floor Interface Defaults"
          subtitle="Customize default layouts and view modes for your workstation"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#111827] block mb-2">
                Default Orders View Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, defaultOrdersView: "list" }))
                  }
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    settings.defaultOrdersView === "list"
                      ? "border-[#00A86B] bg-[#E6F7F0]/30 text-[#111827]"
                      : "border-[#ECEEF2] bg-white text-[#6B7280] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <List className="w-4 h-4 text-[#00A86B]" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Orders Table</div>
                    <div className="text-[10px] text-[#9CA3AF]">Compact rows with search & filters</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, defaultOrdersView: "kanban" }))
                  }
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    settings.defaultOrdersView === "kanban"
                      ? "border-[#00A86B] bg-[#E6F7F0]/30 text-[#111827]"
                      : "border-[#ECEEF2] bg-white text-[#6B7280] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-[#00A86B]" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Kanban Pipeline</div>
                    <div className="text-[10px] text-[#9CA3AF]">Drag & drop 11-stage floor view</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECEEF2]">
              <label className="text-xs font-bold text-[#111827] block mb-2">
                Default Task Station Filter
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, defaultTaskFilter: "my" }))
                  }
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    settings.defaultTaskFilter === "my"
                      ? "border-[#00A86B] bg-[#E6F7F0]/30 text-[#111827]"
                      : "border-[#ECEEF2] bg-white text-[#6B7280]"
                  }`}
                >
                  <span className="text-xs font-bold">My Tasks Only</span>
                  {settings.defaultTaskFilter === "my" && <Check className="w-3.5 h-3.5 text-[#00A86B]" />}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, defaultTaskFilter: "all" }))
                  }
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    settings.defaultTaskFilter === "all"
                      ? "border-[#00A86B] bg-[#E6F7F0]/30 text-[#111827]"
                      : "border-[#ECEEF2] bg-white text-[#6B7280]"
                  }`}
                >
                  <span className="text-xs font-bold">All Floor Tasks</span>
                  {settings.defaultTaskFilter === "all" && <Check className="w-3.5 h-3.5 text-[#00A86B]" />}
                </button>
              </div>
            </div>
          </div>
        </OpsCard>
      </div>
    </OpsLayout>
  );
}
