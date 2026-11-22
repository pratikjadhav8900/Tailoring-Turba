"use client";

import React, { useState } from "react";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import { LEAD_STAGE_ORDER } from "@/types/crm";
import { LeadStatusBadge } from "@/components/crm/ui/LeadStatusBadge";
import { LeadQualityBadge } from "@/components/crm/ui/LeadQualityBadge";
import { Target, ListChecks, UserX, CheckCircle2 } from "lucide-react";

const STAGE_NOTES: Record<string, string> = {
  NEW_LEAD: "Just entered the pipeline — from an ad, the website, a referral, or manual entry. Claim it and make first contact.",
  DNP: "You tried calling/WhatsApping but they Did Not Pick. Set a follow-up task to try again.",
  INTERESTED: "They picked up and are interested — keep working the conversation toward a sale.",
  NOT_INTERESTED: "Not interested, for now or permanently. Jot a quick reason if you know it, but it's optional.",
  CONVERTED: "Order confirmed — this unlocks the 'Convert to Customer' button, which creates/links a real customer account.",
  CLOSED: "The deal is fully wrapped up after conversion (order complete). A terminal stage — nothing more to do here.",
};

const FAQS = [
  {
    q: "What's the difference between Stage and Quality?",
    a: "Stage is where the deal is in the sales process (New Lead, Interested, Converted...). Quality (Hot/Warm/Cold) is how promising the lead is, based on its 0–10 score. A brand New Lead can still be Hot if it looks very promising.",
  },
  {
    q: "What does DNP mean?",
    a: "Did Not Pick — you called or messaged and they didn't respond. It's different from Not Interested, which means you actually spoke and they said no.",
  },
  {
    q: "What's the difference between an Activity and a Task?",
    a: "An Activity is a record of something that already happened (you called, you sent an email). A Task is something that still needs to be done, with a due date — it'll show up in Tasks & Follow-ups until you complete it.",
  },
  {
    q: "A duplicate warning showed up when I added a lead — what do I do?",
    a: "Someone already has a lead with that phone or email. Open the existing one instead of creating a copy, unless you're sure this is a genuinely separate inquiry — then you can continue anyway.",
  },
  {
    q: "How do I turn a lead into a real customer?",
    a: "Move the lead to 'Converted', then click 'Convert to Customer' on the lead page. This creates (or links to) a real customer account used for orders.",
  },
];

export default function CrmHelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <CrmLayout pageTitle="Help Center" pageSubtitle="How the Sales CRM pipeline works">
      <div className="space-y-6 max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-br from-[#FF6A39] to-[#E0481C] text-white p-6">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 mb-2">SALES PLAYBOOK</span>
          <h2 className="text-xl font-bold">Working a lead, start to finish</h2>
          <p className="text-sm text-orange-50 mt-1.5 max-w-xl">
            Every lead moves through the stages below. Log every call, WhatsApp, or email as an Activity, and set a
            Task whenever there's a next step with a date attached.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-4">
            <Target className="w-4 h-4 text-[#FF6A39] mb-2" />
            <h3 className="text-xs font-bold text-[#111827]">Stage vs. Quality</h3>
            <p className="text-[11px] text-[#6B7280] mt-1">Stage is where the deal is. Quality is how good it looks.</p>
          </div>
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-4">
            <ListChecks className="w-4 h-4 text-[#FF6A39] mb-2" />
            <h3 className="text-xs font-bold text-[#111827]">Tasks keep you honest</h3>
            <p className="text-[11px] text-[#6B7280] mt-1">If there's a next step, it should be a Task with a due date — not just a memory.</p>
          </div>
          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-4">
            <UserX className="w-4 h-4 text-[#FF6A39] mb-2" />
            <h3 className="text-xs font-bold text-[#111827]">DNP vs. Not Interested</h3>
            <p className="text-[11px] text-[#6B7280] mt-1">DNP = they didn't pick up. Not Interested = you spoke, and they said no.</p>
          </div>
        </div>

        <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#111827] mb-1">The 6 pipeline stages</h3>
          <p className="text-xs text-[#9CA3AF] mb-4">Set from the Stage dropdown on any lead's detail page.</p>
          <div className="space-y-2.5">
            {LEAD_STAGE_ORDER.map((stage) => (
              <div key={stage} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F9FB]">
                <LeadStatusBadge status={stage} size="sm" />
                <p className="text-xs text-[#4B5563] flex-1">{STAGE_NOTES[stage]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#111827] mb-1">Lead quality (Hot / Warm / Cold)</h3>
          <p className="text-xs text-[#9CA3AF] mb-4">Set with the Score slider — this is separate from the stage.</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F9FB]">
              <LeadQualityBadge score={9} />
              <span className="text-xs text-[#4B5563]">Score 8–10 · prioritize these first</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F9FB]">
              <LeadQualityBadge score={5} />
              <span className="text-xs text-[#4B5563]">Score 4–7 · worth pursuing</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F8F9FB]">
              <LeadQualityBadge score={2} />
              <span className="text-xs text-[#4B5563]">Score 0–3 · low priority</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ECEEF2] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#111827] mb-4">Frequently asked</h3>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-[#ECEEF2] rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#111827] hover:bg-[#F8F9FB]"
                >
                  {faq.q}
                  <span className="text-[#9CA3AF] text-xs">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <div className="px-4 pb-3 text-xs text-[#6B7280] leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF1EB] border border-[#FFE1D1]">
          <CheckCircle2 className="w-4 h-4 text-[#FF6A39] shrink-0 mt-0.5" />
          <p className="text-xs text-[#9A4A2A]">
            Need something the CRM doesn't do yet (quotations, team reports, automation)? That's on the roadmap — flag it to your manager.
          </p>
        </div>
      </div>
    </CrmLayout>
  );
}
