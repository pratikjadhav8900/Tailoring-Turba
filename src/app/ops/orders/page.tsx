"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsKanbanBoard } from "@/components/ops/kanban/OpsKanbanBoard";
import { OpsBadge } from "@/components/ops/ui/OpsBadge";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { OpsEmptyState } from "@/components/ops/ui/OpsEmptyState";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsOrder, OpsProductionStage } from "@/types/ops";
import {
  Search,
  Filter,
  Kanban,
  Table,
  Plus,
  Clock,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";

function OpsOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isKanban = searchParams.get("view") === "kanban";
  const stageFilter = (searchParams.get("stage") as OpsProductionStage | "ALL" | "ACTIVE") || "ALL";
  const priorityFilter = searchParams.get("priority") || "ALL";
  const initialSearch = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(initialSearch);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter && stageFilter !== "ALL") params.set("stage", stageFilter);
      if (priorityFilter && priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (searchInput.trim()) params.set("search", searchInput.trim());
      params.set("page", String(page));
      params.set("limit", isKanban ? "100" : "25");

      const res = await fetch(`/api/ops/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      }
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [stageFilter, priorityFilter, page, isKanban]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleToggleView = (view: "table" | "kanban") => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "kanban") {
      params.set("view", "kanban");
    } else {
      params.delete("view");
    }
    router.push(`/ops/orders?${params.toString()}`);
  };

  const handleStageChange = (stage: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (stage === "ALL") {
      params.delete("stage");
    } else {
      params.set("stage", stage);
    }
    params.set("page", "1");
    router.push(`/ops/orders?${params.toString()}`);
  };

  const handlePriorityChange = (priority: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (priority === "ALL") {
      params.delete("priority");
    } else {
      params.set("priority", priority);
    }
    params.set("page", "1");
    router.push(`/ops/orders?${params.toString()}`);
  };

  return (
    <OpsLayout pageTitle="Orders Directory">
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Filter and Control Bar */}
        <div className="p-3 bg-[#10121a] border border-[#1e2230] rounded-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Filter by TT-..., customer, email, phone..."
              className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            />
          </form>

          {/* Filter Dropdowns and View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => handleStageChange(e.target.value)}
              className="bg-[#0b0d13] border border-[#1e2230] text-slate-200 text-xs rounded px-2.5 py-1.5 outline-none"
            >
              <option value="ALL">All Stages</option>
              <option value="ACTIVE">Active (In Pipeline)</option>
              {STAGE_SEQUENCE.map((s) => (
                <option key={s} value={s}>
                  {STAGE_DISPLAY_NAMES[s]}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="bg-[#0b0d13] border border-[#1e2230] text-slate-200 text-xs rounded px-2.5 py-1.5 outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
              <option value="RUSH">Rush</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center p-0.5 rounded bg-[#0b0d13] border border-[#1e2230]">
              <button
                onClick={() => handleToggleView("table")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  !isKanban
                    ? "bg-[#1c202d] text-amber-400 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Table View"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => handleToggleView("kanban")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  isKanban
                    ? "bg-[#1c202d] text-amber-400 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Kanban Board View"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-[#0b0d13] border border-[#1e2230] rounded"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <OpsLoadingState message="Loading manufacturing orders..." />
        ) : isKanban ? (
          <OpsKanbanBoard orders={orders} onRefresh={fetchOrders} />
        ) : orders.length === 0 ? (
          <OpsEmptyState
            title="No orders found"
            description="No manufacturing orders matched your current filters."
            action={
              <OpsButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  handleStageChange("ALL");
                  handlePriorityChange("ALL");
                }}
              >
                Reset Filters
              </OpsButton>
            }
          />
        ) : (
          /* Table View */
          <div className="space-y-3">
            <div className="ops-table-container">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Garment Items</th>
                    <th>Quantity</th>
                    <th>Production Stage</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
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
                        <div className="text-xs font-semibold text-slate-200">
                          {order.customer.name || "Customer"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {order.customer.companyName || order.customer.phone || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-slate-300 max-w-xs truncate">
                          {order.items.map((i) => i.productName).join(", ")}
                        </div>
                      </td>
                      <td className="font-mono text-xs font-bold text-slate-200">
                        {order.totalQuantity} pcs
                      </td>
                      <td>
                        <OpsBadge stage={order.opsStage} size="sm" />
                      </td>
                      <td>
                        <OpsBadge
                          status={order.currentExecution?.status || "PENDING"}
                          size="sm"
                        />
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
                      <td className="text-[11px] text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="text-right">
                        <Link href={`/ops/orders/${order.id}`}>
                          <OpsButton variant="ghost" size="sm">
                            Inspect
                          </OpsButton>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
              <div>
                Showing <strong>{orders.length}</strong> of <strong>{totalCount}</strong> orders
              </div>
              <div className="flex items-center gap-1.5">
                <OpsButton
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(page - 1));
                    router.push(`/ops/orders?${params.toString()}`);
                  }}
                >
                  Previous
                </OpsButton>
                <span className="px-2 font-mono">
                  {page} / {totalPages}
                </span>
                <OpsButton
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(page + 1));
                    router.push(`/ops/orders?${params.toString()}`);
                  }}
                >
                  Next
                </OpsButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </OpsLayout>
  );
}

export default function OpsOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-slate-500 text-xs">
          Loading Turba Ops Orders...
        </div>
      }
    >
      <OpsOrdersContent />
    </Suspense>
  );
}
