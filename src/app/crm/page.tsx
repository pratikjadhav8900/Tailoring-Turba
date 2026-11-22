"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CrmLayout } from "@/components/crm/layout/CrmLayout";
import { Sparkline } from "@/components/crm/ui/Sparkline";
import { LeadStatusBadge } from "@/components/crm/ui/LeadStatusBadge";
import { ArrowUpRight, ArrowDownRight, Flame, Clock, Target, Trophy } from "lucide-react";
import type { CrmLead } from "@/types/crm";

interface DashboardStats {
  totalLeads: number;
  newLeads: { value: number; changePct: number; sparkline: number[] };
  qualifiedLeads: { value: number; changePct: number };
  hotLeads: { value: number };
  overdueFollowUps: { value: number };
  wonLast30Days: { value: number };
  lostLast30Days: { value: number };
  conversionRate30Days: number | null;
  pipelineValue: number;
  wonValueLast30Days: number;
  avgResponseTimeHours: number | null;
  funnel: { stage: string; label: string; count: number; pct: number }[];
  tasks: { overdue: number; dueToday: number };
}

function formatInr(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

function StatCard({
  label,
  value,
  changePct,
  sparkline,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  changePct?: number;
  sparkline?: number[];
  icon?: React.ReactNode;
}) {
  const positive = (changePct ?? 0) >= 0;
  return (
    <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[#6B7280] text-xs font-semibold">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-[#111827]">{value}</span>
          {changePct !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                positive ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(changePct)}%
            </span>
          )}
        </div>
      </div>
      {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} />}
    </div>
  );
}

export default function CrmDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/dashboard/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/crm/leads?limit=6").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([statsData, leadsData]) => {
        if (statsData) setStats(statsData);
        if (leadsData) setRecentLeads(leadsData.leads || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <CrmLayout
      pageTitle="Dashboard"
      pageSubtitle="Welcome back — here's how the pipeline is moving"
      headerAction={
        <Link
          href="/crm/leads"
          className="h-9 px-4 sm:px-5 rounded-full bg-[#FF6A39] hover:bg-[#E85A2A] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-98"
        >
          View All Leads
        </Link>
      }
    >
      {loading ? (
        <div className="text-sm text-[#9CA3AF]">Loading dashboard...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="New Leads (7d)"
              value={stats?.newLeads.value ?? 0}
              changePct={stats?.newLeads.changePct}
              sparkline={stats?.newLeads.sparkline}
              icon={<Target className="w-3.5 h-3.5" />}
            />
            <StatCard
              label="Qualified Leads"
              value={stats?.qualifiedLeads.value ?? 0}
              changePct={stats?.qualifiedLeads.changePct}
              icon={<Trophy className="w-3.5 h-3.5" />}
            />
            <StatCard
              label="Hot Leads"
              value={stats?.hotLeads.value ?? 0}
              icon={<Flame className="w-3.5 h-3.5 text-[#DC2626]" />}
            />
            <StatCard
              label="Avg Response Time"
              value={
                stats?.avgResponseTimeHours != null
                  ? `${stats.avgResponseTimeHours.toFixed(1)}h`
                  : "—"
              }
              icon={<Clock className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
              <div className="text-xs font-semibold text-[#6B7280] mb-1">Pipeline Value</div>
              <div className="text-2xl font-bold text-[#111827]">{formatInr(stats?.pipelineValue ?? 0)}</div>
            </div>
            <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
              <div className="text-xs font-semibold text-[#6B7280] mb-1">Converted Value (30d)</div>
              <div className="text-2xl font-bold text-[#10B981]">{formatInr(stats?.wonValueLast30Days ?? 0)}</div>
            </div>
            <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
              <div className="text-xs font-semibold text-[#6B7280] mb-1">Conversion Rate (30d)</div>
              <div className="text-2xl font-bold text-[#111827]">
                {stats?.conversionRate30Days != null ? `${stats.conversionRate30Days}%` : "—"}
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                Converted {stats?.wonLast30Days.value ?? 0} · Not Interested {stats?.lostLast30Days.value ?? 0}
              </div>
            </div>
            <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
              <div className="text-xs font-semibold text-[#6B7280] mb-1">Overdue Follow-ups</div>
              <div className="text-2xl font-bold text-[#EF4444]">{stats?.overdueFollowUps.value ?? 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/crm/tasks?view=overdue" className="bg-white border border-[#ECEEF2] rounded-2xl p-5 hover:border-[#FF6A39] transition-colors">
              <div className="text-xs font-semibold text-[#6B7280] mb-1">Overdue Tasks</div>
              <div className="text-2xl font-bold text-[#EF4444]">{stats?.tasks.overdue ?? 0}</div>
            </Link>
            <Link href="/crm/tasks?view=today" className="bg-white border border-[#ECEEF2] rounded-2xl p-5 hover:border-[#FF6A39] transition-colors">
              <div className="text-xs font-semibold text-[#6B7280] mb-1">Due Today</div>
              <div className="text-2xl font-bold text-[#111827]">{stats?.tasks.dueToday ?? 0}</div>
            </Link>
          </div>

          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[#111827] mb-4">Sales Funnel</h2>
            <div className="space-y-2">
              {stats?.funnel.map((f) => (
                <div key={f.stage} className="flex items-center gap-3">
                  <span className="text-xs text-[#4B5563] w-44 shrink-0 truncate">{f.label}</span>
                  <div className="flex-1 bg-[#F1F3F7] rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#FF6A39] flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(f.pct, f.count > 0 ? 4 : 0)}%` }}
                    >
                      {f.count > 0 && <span className="text-[10px] font-bold text-white">{f.count}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF] w-10 text-right shrink-0">{f.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#ECEEF2] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#111827]">Recent Leads</h2>
              <Link href="/crm/leads" className="text-xs font-semibold text-[#FF6A39] hover:text-[#E85A2A]">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {recentLeads.length === 0 && (
                <div className="text-xs text-[#9CA3AF] py-6 text-center">No leads yet.</div>
              )}
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/crm/leads/${lead.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F8F9FB] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#111827] truncate">{lead.name}</div>
                    <div className="text-xs text-[#9CA3AF] truncate">{lead.companyName || lead.phone || lead.email || "—"}</div>
                  </div>
                  <LeadStatusBadge status={lead.status} size="sm" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </CrmLayout>
  );
}
