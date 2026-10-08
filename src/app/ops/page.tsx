"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsBadge } from "@/components/ops/ui/OpsBadge";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsDashboardStats, OpsOrder } from "@/types/ops";
import {
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCcw,
  Kanban,
  ArrowRight,
  Plus,
} from "lucide-react";

function OpsDashboardContent() {
  const [stats, setStats] = useState<OpsDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OpsOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/ops/dashboard/stats"),
        fetch("/api/ops/orders?limit=10&stage=ACTIVE"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.orders || []);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <OpsLayout pageTitle="Operations Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Factory Production Overview
            </h2>
            <p className="text-xs text-slate-400">
              Live floor status across all manufacturing stages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/ops/orders?view=kanban">
              <OpsButton
                variant="secondary"
                size="sm"
                leftIcon={<Kanban className="w-4 h-4" />}
              >
                Production Board
              </OpsButton>
            </Link>
            <Link href="/ops/orders">
              <OpsButton
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View All Orders
              </OpsButton>
            </Link>
          </div>
        </div>

        {loading ? (
          <OpsLoadingState message="Loading factory metrics..." />
        ) : (
          <>
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <OpsCard padding="sm" className="bg-[#11131c]">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Orders</span>
                  <Boxes className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-2">
                  {stats?.totalActiveOrders || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">In pipeline</div>
              </OpsCard>

              <OpsCard padding="sm" className="bg-[#11131c]">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Urgent Orders</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
                  {stats?.urgentOrdersCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">High priority</div>
              </OpsCard>

              <OpsCard padding="sm" className="bg-[#11131c]">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Due in 48h</span>
                  <Clock className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-orange-400 mt-2">
                  {stats?.dueSoonCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Upcoming deadline</div>
              </OpsCard>

              <OpsCard padding="sm" className="bg-[#11131c]">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Rework Flagged</span>
                  <RefreshCcw className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-red-400 mt-2">
                  {stats?.reworkCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Defects returned</div>
              </OpsCard>

              <OpsCard padding="sm" className="bg-[#11131c] col-span-2 md:col-span-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Completed Today</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                  {stats?.completedTodayCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Dispatched/closed</div>
              </OpsCard>
            </div>

            {/* Pipeline Stage Distribution Matrix */}
            <OpsCard title="Production Stage Pipeline">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {STAGE_SEQUENCE.filter((s) => s !== "CLOSED").map((stage) => {
                  const count = stats?.stageCounts?.[stage] || 0;
                  return (
                    <Link
                      key={stage}
                      href={`/ops/orders?stage=${stage}`}
                      className="p-3 rounded bg-[#0b0d13] border border-[#1e2230] hover:border-amber-500/50 hover:bg-white/[0.02] transition-colors flex flex-col justify-between min-h-[76px]"
                    >
                      <div className="text-[11px] font-medium text-slate-400 leading-tight">
                        {STAGE_DISPLAY_NAMES[stage]}
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-lg font-bold font-mono text-slate-100">
                          {count}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">
                          Orders
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </OpsCard>

            {/* Active Floor Orders Table */}
            <OpsCard
              title="Active Production Jobs"
              subtitle="Latest orders on the manufacturing floor"
              headerAction={
                <Link
                  href="/ops/orders"
                  className="text-xs text-amber-500 hover:text-amber-400 font-medium"
                >
                  View full list →
                </Link>
              }
            >
              {recentOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No active production orders currently in the pipeline.
                </div>
              ) : (
                <div className="ops-table-container">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Stage</th>
                        <th>Status</th>
                        <th>Quantity</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <Link
                              href={`/ops/orders/${order.id}`}
                              className="ops-order-tag text-slate-200 hover:text-amber-400 transition-colors"
                            >
                              {order.formattedOrderNumber}
                            </Link>
                          </td>
                          <td>
                            <div className="text-xs font-medium text-slate-200">
                              {order.customer.name || "Customer"}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {order.customer.companyName || order.customer.phone || "-"}
                            </div>
                          </td>
                          <td>
                            <OpsBadge stage={order.opsStage} size="sm" />
                          </td>
                          <td>
                            <OpsBadge
                              status={order.currentExecution?.status || "IN_PROGRESS"}
                              size="sm"
                            />
                          </td>
                          <td className="font-mono text-xs">
                            {order.totalQuantity} pcs
                          </td>
                          <td>
                            <OpsBadge priority={order.priority} size="sm" />
                          </td>
                          <td className="text-xs text-slate-400">
                            {order.dueDate
                              ? new Date(order.dueDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "—"}
                          </td>
                          <td className="text-right">
                            <Link href={`/ops/orders/${order.id}`}>
                              <OpsButton variant="ghost" size="sm">
                                Open
                              </OpsButton>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </OpsCard>
          </>
        )}
      </div>
    </OpsLayout>
  );
}

export default function OpsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-500 text-xs">
          Loading Operations Dashboard...
        </div>
      }
    >
      <OpsDashboardContent />
    </Suspense>
  );
}
