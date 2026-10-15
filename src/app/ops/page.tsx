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
  const [selectedYear, setSelectedYear] = useState("This Years");

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

  const months = [
    { name: "Jan", height: 45 },
    { name: "Feb", height: 60 },
    { name: "Mar", height: 75 },
    { name: "Apr", height: 65 },
    { name: "May", height: 85 },
    { name: "Jun", height: 70 },
    { name: "Jul", height: 100, active: true },
    { name: "Aug", height: 50 },
    { name: "Sep", height: 65 },
    { name: "Oct", height: 80 },
    { name: "Nov", height: 55 },
    { name: "Dec", height: 70 },
  ];

  // 7x5 heatmap pattern from the reference design
  const heatmapGrid = [
    [0, 0, 1, 0, 0],
    [0, 1, 2, 1, 0],
    [1, 2, 3, 2, 1],
    [0, 1, 3, 1, 0],
    [0, 0, 2, 0, 0],
    [0, 0, 3, 0, 0],
    [0, 0, 0, 0, 0],
  ];

  const getHeatmapColor = (val: number) => {
    switch (val) {
      case 3:
        return "bg-[#00A86B]";
      case 2:
        return "bg-[#34D399]";
      case 1:
        return "bg-[#A7F3D0]";
      default:
        return "bg-[#F3F4F6]";
    }
  };

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
                    ₹{stats?.grossRevenue ? stats.grossRevenue.toLocaleString("en-IN") : "3,54,100"}
                  </span>
                </div>
                <div className="text-[11px] text-[#9CA3AF] font-medium">
                  Total factory order volume
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
                    ₹{stats?.avgOrderValue ? stats.avgOrderValue.toLocaleString("en-IN") : "8,750"}
                  </span>
                </div>
                <div className="text-[11px] text-[#9CA3AF] font-medium">
                  Average bulk transaction size
                </div>
              </div>

              {/* Card 3: Total Order */}
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
                    {stats?.totalOrdersCount ?? stats?.totalActiveOrders ?? 401}
                  </span>
                  <span className="ml-1.5 text-sm font-semibold text-[#6B7280]">orders</span>
                </div>
                <div className="text-[11px] text-[#9CA3AF] font-medium">
                  {stats?.totalActiveOrders ? `${stats.totalActiveOrders} in active production` : "All production batches"}
                </div>
              </div>
            </div>

            {/* 2. MIDDLE ROW: Transaction Activity Bar Chart & Sale Performance Gauge */}
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
                      ₹{stats?.grossRevenue ? stats.grossRevenue.toLocaleString("en-IN") : "3,54,100"}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Legend */}
                    <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-[#6B7280]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00A86B]" />
                        Total Transaction
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
                        Success Transaction
                      </span>
                    </div>

                    {/* Time Filter Pill */}
                    <button className="px-3.5 py-1.5 rounded-full bg-[#F4F6F9] border border-[#ECEEF2] text-xs font-semibold text-[#111827] flex items-center gap-1.5 shadow-2xs">
                      <span>{selectedYear}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                    </button>
                  </div>
                </div>

                {/* Custom Hatched Bar Chart */}
                <div className="relative pt-8 pb-2 overflow-x-auto scrollbar-none -mx-2 px-2">
                  <div className="min-w-[460px] sm:min-w-0 relative">
                    {/* Dotted Average Line */}
                    <div className="absolute top-16 left-8 right-0 border-b border-dashed border-[#D1D5DB] flex items-center">
                      <span className="absolute -top-3.5 left-0 px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">
                        Avg. ₹25.3k
                      </span>
                    </div>

                    {/* Y Axis Grid Labels */}
                    <div className="flex items-end justify-between h-48 gap-2 px-2">
                      {months.map((m) => (
                        <div key={m.name} className="flex-1 flex flex-col items-center h-full justify-end group">
                          <div className="w-full max-w-[28px] flex flex-col justify-end items-center h-full">
                            <div
                              style={{ height: `${m.height}%` }}
                              className={`w-full transition-all duration-300 ${
                                m.active
                                  ? "bg-[#00A86B] rounded-xl shadow-md shadow-[#00A86B]/30"
                                  : "hatched-bar hover:opacity-80"
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

              {/* Sale Performance Radial Semi-Gauge (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Sale Performance
                  </h3>
                </div>

                {/* Radial Gauge SVG */}
                <div className="relative flex flex-col items-center justify-center my-4">
                  <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
                    {/* Background Hatched/Gray Arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="22"
                      strokeLinecap="round"
                    />
                    {/* Active Vibrant Emerald Arc (76%) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 155 45"
                      fill="none"
                      stroke="#00A86B"
                      strokeWidth="22"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute top-14 flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-[#111827]">
                      76%
                    </span>
                    <span className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                      Since yesterday
                    </span>
                  </div>
                </div>

                {/* Legend Bottom */}
                <div className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs text-[#6B7280] font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1.5 rounded-full bg-[#00A86B]" />
                    <span>Total Sales per day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1.5 rounded-full bg-[#A7F3D0]" />
                    <span>Average Sale</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BOTTOM ROW: Active User Heatmap & Recent Transactions Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Active User Heatmap (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Active User
                  </h3>
                  <div className="text-2xl font-extrabold text-[#111827] mt-1">
                    1.428 <span className="text-xs font-semibold text-[#10B981]">+2.4%</span>
                  </div>
                </div>

                <div className="my-4">
                  <div className="grid grid-cols-5 gap-1.5 max-w-[200px]">
                    {heatmapGrid.map((row, rIdx) =>
                      row.map((cell, cIdx) => (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`w-7 h-7 rounded-lg ${getHeatmapColor(cell)}`}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6B7280] font-medium pt-2 border-t border-[#F3F4F6]">
                  <span>Low activity</span>
                  <span>High activity</span>
                </div>
              </div>

              {/* Recent Transactions Table (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-[#ECEEF2] rounded-[22px] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#111827]">
                    Recent Transaction
                  </h3>
                  <Link
                    href="/ops/orders"
                    className="text-xs font-semibold text-[#00A86B] hover:underline"
                  >
                    See all
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
                        <th>ID</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th className="text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length > 0 ? (
                        recentOrders.slice(0, 4).map((order) => (
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
                              {order.items[0]?.productName || "Vintage T-shirt"}
                            </td>
                            <td className="font-medium text-xs text-[#6B7280]">
                              {order.totalQuantity}
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              ₹{order.totalAmount ? Number(order.totalAmount).toLocaleString("en-IN") : "44,000"}
                            </td>
                            <td className="text-right">
                              <OpsBadge
                                status={
                                  order.currentExecution?.status || "COMPLETED"
                                }
                                size="sm"
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td>
                              <input
                                type="checkbox"
                                className="rounded border-[#D1D5DB] text-[#00A86B] focus:ring-0"
                              />
                            </td>
                            <td className="font-mono text-xs font-semibold text-[#6B7280]">
                              #847-392
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              Vintage T-shirt
                            </td>
                            <td className="font-medium text-xs text-[#6B7280]">
                              11
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              ₹44,000
                            </td>
                            <td className="text-right">
                              <OpsBadge status="COMPLETED" text="Success" size="sm" />
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <input
                                type="checkbox"
                                className="rounded border-[#D1D5DB] text-[#00A86B] focus:ring-0"
                              />
                            </td>
                            <td className="font-mono text-xs font-semibold text-[#6B7280]">
                              #732-293
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              Black T-shirt
                            </td>
                            <td className="font-medium text-xs text-[#6B7280]">
                              3
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              ₹8,000
                            </td>
                            <td className="text-right">
                              <OpsBadge status="PENDING" text="Pending" size="sm" />
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <input
                                type="checkbox"
                                className="rounded border-[#D1D5DB] text-[#00A86B] focus:ring-0"
                              />
                            </td>
                            <td className="font-mono text-xs font-semibold text-[#6B7280]">
                              #732-328
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              White Polo
                            </td>
                            <td className="font-medium text-xs text-[#6B7280]">
                              4
                            </td>
                            <td className="font-semibold text-xs text-[#111827]">
                              ₹10,200
                            </td>
                            <td className="text-right">
                              <OpsBadge status="COMPLETED" text="Success" size="sm" />
                            </td>
                          </tr>
                        </>
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
