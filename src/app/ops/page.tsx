"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsBadge } from "@/components/ops/ui/OpsBadge";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import type { OpsDashboardStats, OpsOrder } from "@/types/ops";
import {
  ArrowUpRight,
  ChevronDown,
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
        fetch("/api/ops/orders?limit=10"),
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
    <OpsLayout
      pageTitle="Dashboard"
      pageSubtitle="Welcome to Analysis dashboard"
    >
      <div className="space-y-6 w-full select-none">
        {loading ? (
          <OpsLoadingState message="Loading analysis dashboard..." />
        ) : (
          <>
            {/* 1. TOP ROW: 3 Large Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Gross Revenue */}
              <div className="bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs relative flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">
                    Gross Revenue
                  </span>
                  <Link
                    href="/ops/orders"
                    className="w-8 h-8 rounded-full bg-[#F4F6F9] hover:bg-[#E5E8ED] text-[#4B5563] flex items-center justify-center transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="my-3 flex items-baseline">
                  <span className="text-3xl font-extrabold tracking-tight text-[#111827]">
                    ₹{(stats?.grossRevenue || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-[11px] text-[#9CA3AF] font-medium">
                  {stats?.totalPieces ? `${stats.totalPieces} pcs across batches` : "Total factory order volume"}
                </div>
              </div>

              {/* Card 2: Avg. Order Value */}
              <div className="bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs relative flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">
                    Avg. Order Value
                  </span>
                  <Link
                    href="/ops/orders"
                    className="w-8 h-8 rounded-full bg-[#F4F6F9] hover:bg-[#E5E8ED] text-[#4B5563] flex items-center justify-center transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="my-3 flex items-baseline">
                  <span className="text-3xl font-extrabold tracking-tight text-[#111827]">
                    ₹{(stats?.avgOrderValue || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-[11px] text-[#9CA3AF] font-medium">
                  Average per order size
                </div>
              </div>

              {/* Card 3: Total Orders */}
              <div className="bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs relative flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">
                    Total Orders
                  </span>
                  <Link
                    href="/ops/orders"
                    className="w-8 h-8 rounded-full bg-[#F4F6F9] hover:bg-[#E5E8ED] text-[#4B5563] flex items-center justify-center transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="my-3 flex items-baseline">
                  <span className="text-3xl font-extrabold tracking-tight text-[#111827]">
                    {stats?.totalOrdersCount ?? 0}
                  </span>
                  <span className="ml-1.5 text-sm font-semibold text-[#6B7280]">orders</span>
                </div>
                <div className="text-[11px] text-[#9CA3AF] font-medium">
                  {stats?.totalActiveOrders ?? 0} in active production
                </div>
              </div>
            </div>

            {/* 2. MIDDLE ROW: Transaction Activity Bar Chart & Task Completion Radial Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Transaction Activity Bar Chart (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-xs font-semibold text-[#6B7280]">
                      Transaction Activity
                    </span>
                    <div className="text-2xl font-extrabold text-[#111827] mt-0.5">
                      ₹{(stats?.grossRevenue || 0).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Legend */}
                    <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-[#6B7280]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00A86B]" />
                        Monthly Invoiced
                      </span>
                    </div>

                    {/* Time Filter Pill */}
                    <div className="px-3 py-1 rounded-full bg-[#F4F6F9] border border-[#ECEEF2] text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                      <span>{new Date().getFullYear()} Batches</span>
                    </div>
                  </div>
                </div>

                {/* Custom Bar Chart from Real Monthly Activity */}
                <div className="relative pt-8 pb-2 overflow-x-auto scrollbar-none -mx-2 px-2">
                  <div className="min-w-[460px] sm:min-w-0 relative">
                    {/* Dotted Average Line */}
                    <div className="absolute top-16 left-8 right-0 border-b border-dashed border-[#D1D5DB] flex items-center">
                      <span className="absolute -top-3.5 left-0 px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">
                        Avg. ₹{Math.round((stats?.selectedYearAverageMonthlyRevenue || 0) / 1000)}k / mo
                      </span>
                    </div>

                    {/* Y Axis Grid Labels */}
                    <div className="flex items-end justify-between h-48 gap-2 px-2">
                      {(stats?.monthlyActivity || []).map((m) => (
                        <div key={m.name} className="flex-1 flex flex-col items-center h-full justify-end group">
                          <div className="w-full max-w-[28px] flex flex-col justify-end items-center h-full relative">
                            {/* Hover Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded-md bg-black text-white text-[9px] font-bold whitespace-nowrap pointer-events-none z-10">
                              ₹{m.revenue.toLocaleString("en-IN")} ({m.orderCount} orders)
                            </div>
                            <div
                              style={{ height: `${m.height}%` }}
                              className={`w-full transition-all duration-300 ${
                                m.revenue > 0
                                  ? "bg-[#00A86B] rounded-xl shadow-md shadow-[#00A86B]/30"
                                  : "bg-[#F3F4F6] rounded-xl hover:bg-[#E5E7EB]"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-[11px] mt-3 font-semibold ${
                              m.active ? "text-[#00A86B] font-bold" : "text-[#9CA3AF]"
                            }`}
                          >
                            {m.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Task Completion Radial Gauge (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#111827]">
                      Production Task Completion
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Real-time
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Floor execution fulfillment rate
                  </p>
                </div>

                {/* Radial Gauge SVG */}
                <div className="relative flex flex-col items-center justify-center my-4">
                  <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
                    {/* Background Hatched/Gray Arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    {/* Active Vibrant Emerald Arc (Real Completion Rate) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#00A86B"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={251.33}
                      strokeDashoffset={
                        251.33 * (1 - (stats?.taskPerformance?.completionRate ?? 0) / 100)
                      }
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>

                  <div className="absolute top-14 flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-[#111827]">
                      {stats?.taskPerformance?.completionRate ?? 0}%
                    </span>
                    <span className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                      {stats?.taskPerformance?.completedTasks ?? 0} of {stats?.taskPerformance?.totalTasks ?? 0} tasks done
                    </span>
                  </div>
                </div>

                {/* Legend Bottom */}
                <div className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs text-[#6B7280] font-medium">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#00A86B]" />
                      <span>Completed Floor Tasks</span>
                    </div>
                    <span className="font-bold text-[#111827]">
                      {stats?.taskPerformance?.completedTasks ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#A7F3D0]" />
                      <span>In Progress Tasks</span>
                    </div>
                    <span className="font-bold text-[#111827]">
                      {stats?.taskPerformance?.inProgressTasks ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BOTTOM ROW: Real Factory Workforce & Recent Transactions Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Factory Floor Workforce Card (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#111827]">
                      Factory Floor Workforce
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Floor
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-[#111827] mt-1">
                    {stats?.workers?.length || 2}{" "}
                    <span className="text-xs font-semibold text-[#6B7280]">
                      Active Workers
                    </span>
                  </div>
                </div>

                <div className="my-3 space-y-2">
                  {stats?.workers && stats.workers.length > 0 ? (
                    stats.workers.map((w) => (
                      <div
                        key={w.id}
                        className="p-2.5 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#00A86B] font-bold text-xs flex items-center justify-center">
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#111827]">{w.name}</div>
                            <div className="text-[10px] text-[#6B7280]">
                              {w.employeeCode} • {w.roleTitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {w.completedTasks} done
                          </span>
                          {w.inProgressTasks > 0 ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                              {w.inProgressTasks} active
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#9CA3AF]">
                              Ready
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#9CA3AF] py-4 text-center">
                      No floor workers found
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#6B7280] font-medium pt-2 border-t border-[#F3F4F6]">
                  <span>Volume: <strong className="text-[#111827]">{stats?.totalPieces || 0} pcs</strong></span>
                  <span>Clients: <strong className="text-[#111827]">{stats?.totalRegisteredClients || 0}</strong></span>
                </div>
              </div>

              {/* Recent Transactions Table (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#111827]">
                    Recent Orders & Transactions
                  </h3>
                  <Link
                    href="/ops/orders"
                    className="text-xs font-semibold text-[#00A86B] hover:underline"
                  >
                    See all ({stats?.totalOrdersCount ?? recentOrders.length})
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="ops-clean-table">
                    <thead>
                      <tr>
                        <th className="w-8">
                          <input
                            type="checkbox"
                            className="rounded border-[#D1D5DB] text-[#00A86B] focus:ring-0"
                          />
                        </th>
                        <th>Order</th>
                        <th>Customer / Items</th>
                        <th>Quantity</th>
                        <th>Total Amount</th>
                        <th className="text-right">Stage / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length > 0 ? (
                        recentOrders.slice(0, 8).map((order) => (
                          <tr key={order.id}>
                            <td>
                              <input
                                type="checkbox"
                                className="rounded border-[#D1D5DB] text-[#00A86B] focus:ring-0"
                              />
                            </td>
                            <td className="font-mono text-xs font-semibold text-[#6B7280]">
                              <Link
                                href={`/ops/orders/${order.id}`}
                                className="hover:text-[#00A86B] transition-colors"
                              >
                                {order.formattedOrderNumber}
                              </Link>
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              <div>{order.customer?.name || "Customer"}</div>
                              <div className="text-[10px] text-[#9CA3AF] font-normal">
                                {order.items[0]?.productName || "Custom Apparel"}
                              </div>
                            </td>
                            <td className="font-medium text-xs text-[#6B7280]">
                              {order.totalQuantity} pcs
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              ₹{order.totalAmount ? Number(order.totalAmount).toLocaleString("en-IN") : "0"}
                            </td>
                            <td className="text-right">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  order.status === "DELIVERED"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                }`}
                              >
                                {order.opsStage ? order.opsStage.replace(/_/g, " ") : order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[#9CA3AF]">
                            No orders found in database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center text-[#9CA3AF] text-xs font-mono">
          Loading Analysis Dashboard...
        </div>
      }
    >
      <OpsDashboardContent />
    </Suspense>
  );
}
