"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import {
  HelpCircle,
  BookOpen,
  Layers,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Search,
  Zap,
} from "lucide-react";

const STAGE_GUIDES = [
  {
    step: 1,
    key: "NEW_ORDER",
    name: "New Order Intake",
    department: "Sales & E-Commerce",
    description: "Initial order creation through website checkout, Turba AI Concierge, or manual quotation upload.",
    exitCriteria: "Customer specifications captured, size breakdown confirmed, invoice draft generated.",
    accent: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    step: 2,
    key: "ORDER_CONFIRMED",
    name: "Order Confirmed",
    department: "Accounts & Management",
    description: "Advance payment (50% or full 100%) successfully captured via Razorpay or direct bank transfer.",
    exitCriteria: "Payment transaction verified, order moved into manufacturing queue.",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    step: 3,
    key: "RESOURCE_FABRIC",
    name: "Resource & Fabric Allocation",
    department: "Procurement & Store",
    description: "Sourcing and allocating specified fabric roll (Single Jersey, French Terry, Pique) and GSM verification.",
    exitCriteria: "Fabric quantity measured, color lot verified, ready on cutting table.",
    accent: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    step: 4,
    key: "CUTTING",
    name: "Fabric Cutting",
    department: "Cutting Floor",
    description: "Master pattern layout, layering, and precision cutting of sleeves, fronts, backs, and ribs.",
    exitCriteria: "Bundles sorted by size (S/M/L/XL/XXL) with size tags attached.",
    accent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    step: 5,
    key: "STITCHING",
    name: "Stitching & Assembly",
    department: "Tailoring Floor",
    description: "Overlock assembly, neckband attachment, double-needle hem stitching, and seam inspection.",
    exitCriteria: "Complete garment assembled according to spec sheet measurements.",
    accent: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    step: 6,
    key: "BRANDING_PRINTING",
    name: "Branding & Printing",
    department: "Printing Studio",
    description: "Direct-to-Film (DTF), screen printing, vinyl heat-press, or embroidery execution per customer artwork.",
    exitCriteria: "Print position, scale, and color match approved mockup. Curing complete.",
    accent: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    step: 7,
    key: "QUALITY_CHECK",
    name: "Quality Check (QC)",
    department: "QC Inspector",
    description: "Rigorous measurement tolerance audit (±0.5 inch), loose thread trimming, and print wash test.",
    exitCriteria: "Passed 100% of QC checks. If defects found, flag for rework.",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    step: 8,
    key: "PACKING",
    name: "Garment Packing",
    department: "Packing Station",
    description: "Steam pressing, folding, brand hang-tag insertion, and polybagging with barcode labels.",
    exitCriteria: "Individual polybags sealed, master carton packed with packing slip.",
    accent: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    step: 9,
    key: "READY_FOR_DISPATCH",
    name: "Ready for Dispatch",
    department: "Logistics Desk",
    description: "Final carton weighing, dimension measurement, shipping label generation via Bigship Courier.",
    exitCriteria: "AWB generated, shipping label affixed to box, handover manifest printed.",
    accent: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    step: 10,
    key: "DISPATCHED",
    name: "Dispatched",
    department: "Logistics Desk",
    description: "Carton handed over to courier partner (Bluedart, Delhivery, Smartr) with tracking active.",
    exitCriteria: "AWB in-transit status received, customer tracking SMS/email dispatched.",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    step: 11,
    key: "CLOSED",
    name: "Closed & Reconciled",
    department: "Finance & Support",
    description: "Final order delivery confirmed, remaining 50% balance reconciled, invoice finalized.",
    exitCriteria: "Order archived in production history.",
    accent: "bg-gray-100 text-gray-700 border-gray-300",
  },
];

export default function OpsHelpCenterPage() {
  const [selectedStage, setSelectedStage] = useState(STAGE_GUIDES[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStages = STAGE_GUIDES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <OpsLayout
      pageTitle="Operations Help Center"
      pageSubtitle="Standard operating procedures, stage exit criteria, quality rework rules, and authority guidelines"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#0F172A] text-white rounded-[24px] p-6 sm:p-8 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#00A86B] text-white uppercase tracking-wider">
              Factory Operating Standard
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight font-sans">
              Tailoring Turba Manufacturing Rulebook
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Standardized production workflow for the 5 core team members. Master each stage&apos;s quality gates, rollback rework protocols, and dispatch checklists.
            </p>
          </div>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <OpsCard padding="sm" className="bg-white border-[#ECEEF2]">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E6F7F0] text-[#00A86B] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#111827]">Equal Operational Authority</h3>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  All 5 team members have full authorization to transition stages or perform sequencing overrides with a mandatory audit note.
                </p>
              </div>
            </div>
          </OpsCard>

          <OpsCard padding="sm" className="bg-white border-[#ECEEF2]">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#111827]">Audit-Logged Rework</h3>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  Defective items trigger automatic iteration counters (`iteration + 1`) and rollback to the responsible station without losing order data.
                </p>
              </div>
            </div>
          </OpsCard>

          <OpsCard padding="sm" className="bg-white border-[#ECEEF2]">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#111827]">Priority Protocols</h3>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  Rush (24h) and Urgent (48h) orders display pulsing badges and must be prioritized at the cutting and printing stations.
                </p>
              </div>
            </div>
          </OpsCard>
        </div>

        {/* Interactive 11-Stage Manufacturing Pipeline */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111827]">11-Stage Production Pipeline</h2>
              <p className="text-xs text-[#6B7280]">
                Click on any manufacturing stage to review operational responsibilities and exit gates
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stage or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#ECEEF2] focus:border-[#00A86B] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Stage Stepper List */}
            <div className="lg:col-span-1 space-y-2">
              {filteredStages.map((stage) => {
                const isSelected = selectedStage.key === stage.key;
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => setSelectedStage(stage)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#00A86B] text-white border-[#00A86B] shadow-sm"
                        : "bg-white text-[#111827] border-[#ECEEF2] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white/20 text-white" : "bg-[#F4F6F9] text-[#6B7280]"
                        }`}
                      >
                        {stage.step}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{stage.name}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? "text-white/80" : "text-[#9CA3AF]"
                          }`}
                        >
                          {stage.department}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-white" : "text-[#9CA3AF]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Right: Selected Stage Deep-Dive */}
            <div className="lg:col-span-2">
              <OpsCard
                title={`Stage ${selectedStage.step}: ${selectedStage.name}`}
                subtitle={`Responsible Station: ${selectedStage.department}`}
                className="h-full"
              >
                <div className="space-y-6 text-xs text-[#374151]">
                  <div>
                    <h4 className="font-bold text-[#111827] uppercase text-[10px] tracking-wider mb-2">
                      Overview & Description
                    </h4>
                    <p className="text-xs text-[#4B5563] leading-relaxed bg-[#F8F9FB] p-4 rounded-xl border border-[#ECEEF2]">
                      {selectedStage.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#111827] uppercase text-[10px] tracking-wider mb-2">
                      Mandatory Exit Criteria
                    </h4>
                    <div className="flex items-start gap-2.5 bg-[#ECFDF5] p-4 rounded-xl border border-[#A7F3D0] text-[#065F46]">
                      <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" />
                      <span className="font-medium">{selectedStage.exitCriteria}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl border border-[#ECEEF2]">
                      <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block">
                        QC Checkpoints
                      </span>
                      <p className="text-[11px] text-[#111827] mt-1 font-medium">
                        Verify counts against job card bundle before advancing.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#ECEEF2]">
                      <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block">
                        Audit Logging
                      </span>
                      <p className="text-[11px] text-[#111827] mt-1 font-medium">
                        Records actor ID, timestamp, and duration automatically.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#ECEEF2] flex items-center justify-between">
                    <span className="text-[11px] text-[#9CA3AF]">
                      Ready to manage orders in this stage?
                    </span>
                    <Link href={`/ops/orders?stage=${selectedStage.key}`}>
                      <OpsButton variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                        Filter Orders by this Stage
                      </OpsButton>
                    </Link>
                  </div>
                </div>
              </OpsCard>
            </div>
          </div>
        </div>

        {/* Quality Control & Rework Guide */}
        <OpsCard
          title="QC & Rework Workflow"
          subtitle="Handling manufacturing deviations and garment defects cleanly"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-2">
              <span className="w-7 h-7 rounded-lg bg-red-100 text-red-600 font-bold flex items-center justify-center text-xs">
                1
              </span>
              <h4 className="font-bold text-[#111827]">Flag During QC</h4>
              <p className="text-[11px] text-[#6B7280]">
                If defects are discovered (e.g. stitching seam skip, misaligned print), click &quot;Flag for Rework&quot; on the order modal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h4 className="font-bold text-[#111827]">Input Audit Reason</h4>
              <p className="text-[11px] text-[#6B7280]">
                Select the target rollback stage (e.g. Stitching or Branding) and provide a concise defect note describing the defect.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h4 className="font-bold text-[#111827]">Iteration Tracking</h4>
              <p className="text-[11px] text-[#6B7280]">
                The system automatically increments to Iteration 2 and dispatches an alert to the station worker to rectify the piece.
              </p>
            </div>
          </div>
        </OpsCard>

        {/* Internal Contact & Escalation Directory */}
        <OpsCard
          title="Factory Team Escalation Directory"
          subtitle="Direct contacts for the 5 Tailoring Turba operational staff"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "Neeraj Shingavi", code: "TT001", role: "Founder", phone: "9822000001" },
              { name: "Sanjay Shingavi", code: "TT002", role: "Co-Founder", phone: "9822000002" },
              { name: "Pratik Jadhav", code: "TT003", role: "Sales & Tech", phone: "9822000003" },
              { name: "Mahesh Ghavale", code: "TT004", role: "Floor Lead", phone: "9822000004" },
              { name: "Ajay", code: "TT005", role: "Floor Lead", phone: "9822000005" },
            ].map((member) => (
              <div
                key={member.code}
                className="p-3.5 rounded-xl border border-[#ECEEF2] bg-[#FDFDFE] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <span>{member.name}</span>
                    <span className="text-[10px] font-mono text-[#00A86B] font-bold">({member.code})</span>
                  </div>
                  <div className="text-[10px] text-[#6B7280]">{member.role}</div>
                </div>
                <a
                  href={`tel:${member.phone}`}
                  className="p-2 rounded-lg bg-[#E6F7F0] text-[#00A86B] hover:bg-[#00A86B] hover:text-white transition-colors"
                  title={`Call ${member.name}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </OpsCard>
      </div>
    </OpsLayout>
  );
}
