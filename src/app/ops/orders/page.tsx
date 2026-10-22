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
import { CreateOrderModal } from "@/components/ops/orders/CreateOrderModal";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsOrder, OpsProductionStage } from "@/types/ops";
import {
  Search,
  Kanban,
  Table,
  RefreshCw,
  Plus,
  MessageCircle,
  Building2,
  X,
  FileText,
  ExternalLink,
} from "lucide-react";

function OpsOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isKanban = searchParams.get("view") === "kanban";
  const stageFilter = (searchParams.get("stage") as OpsProductionStage | "ALL" | "ACTIVE") || "ALL";
  const priorityFilter = searchParams.get("priority") || "ALL";
  const sourceFilter = searchParams.get("source") || "ALL";
  const initialSearch = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mobileTableView, setMobileTableView] = useState<"cards" | "table">("cards");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter && stageFilter !== "ALL") params.set("stage", stageFilter);
      if (priorityFilter && priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (sourceFilter && sourceFilter !== "ALL") params.set("source", sourceFilter);
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

  // Live search debounce (300ms) so typing filters immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchOrders();
  }, [stageFilter, priorityFilter, sourceFilter, page, isKanban]);

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

  const handleSourceChange = (source: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (source === "ALL") {
      params.delete("source");
    } else {
      params.set("source", source);
    }
    params.set("page", "1");
    router.push(`/ops/orders?${params.toString()}`);
  };

  return (
    <OpsLayout
      pageTitle="Orders Directory"
      headerAction={
        <OpsButton
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Order
        </OpsButton>
      }
    >
      <div className="space-y-4 w-full">
        {/* Filter and Control Bar */}
        <div className="p-3.5 bg-white border border-[#ECEEF2] rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
          {/* Search Input with Clear Button */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by company (e.g. Kone Elevators), TT-..., customer, phone..."
              className="w-full bg-[#F8F9FB] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl pl-10 pr-9 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] outline-none font-sans transition-all shadow-2xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#E5E7EB] text-[#9CA3AF] hover:text-[#111827] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Filter Dropdowns and Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Filters Row: 3 equal columns on mobile, auto-width on larger screens */}
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-2">
              {/* Lead Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="bg-[#F8F9FB] border border-[#ECEEF2] text-[#111827] text-xs font-semibold rounded-xl px-2.5 py-2 outline-none focus:border-[#00A86B] transition-colors truncate shadow-2xs cursor-pointer hover:border-[#D1D5DB]"
              >
                <option value="ALL">All Sources</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="NATURAL">Walk-in</option>
                <option value="PHONE">Phone</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="MANUAL_OPS">Manual</option>
              </select>

              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e) => handleStageChange(e.target.value)}
                className="bg-[#F8F9FB] border border-[#ECEEF2] text-[#111827] text-xs font-semibold rounded-xl px-2.5 py-2 outline-none focus:border-[#00A86B] transition-colors truncate shadow-2xs cursor-pointer hover:border-[#D1D5DB]"
              >
                <option value="ALL">All Stages</option>
                <option value="ACTIVE">Active</option>
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
                className="bg-[#F8F9FB] border border-[#ECEEF2] text-[#111827] text-xs font-semibold rounded-xl px-2.5 py-2 outline-none focus:border-[#00A86B] transition-colors truncate shadow-2xs cursor-pointer hover:border-[#D1D5DB]"
              >
                <option value="ALL">All Priorities</option>
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="RUSH">Rush</option>
              </select>
            </div>

            {/* View Toggle & Refresh Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <div className="flex items-center p-1 rounded-xl bg-[#F4F6F9] border border-[#ECEEF2]">
                <button
                  onClick={() => handleToggleView("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all font-semibold ${
                    !isKanban
                      ? "bg-white text-[#111827] shadow-xs border border-[#ECEEF2]"
                      : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                  title="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => handleToggleView("kanban")}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all font-semibold ${
                    isKanban
                      ? "bg-white text-[#111827] shadow-xs border border-[#ECEEF2]"
                      : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                  title="Kanban Board View"
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchOrders}
                className="w-9 h-9 flex items-center justify-center text-[#4B5563] hover:text-[#111827] bg-[#F8F9FB] hover:bg-white border border-[#ECEEF2] rounded-xl transition-all shadow-2xs"
                title="Refresh Orders"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
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
              <div className="flex items-center gap-2">
                <OpsButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchInput("");
                    handleStageChange("ALL");
                    handlePriorityChange("ALL");
                    handleSourceChange("ALL");
                  }}
                >
                  Reset Filters
                </OpsButton>
                <OpsButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add First Order
                </OpsButton>
              </div>
            }
          />
        ) : (
          /* Table & Mobile Card View */
          <div className="space-y-3">
            {/* Mobile View Selector Bar (visible on < md:) */}
            <div className="flex md:hidden items-center justify-between px-1 text-xs">
              <span className="font-bold text-[#111827]">
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#F4F6F9] border border-[#ECEEF2]">
                <button
                  type="button"
                  onClick={() => setMobileTableView("cards")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    mobileTableView === "cards"
                      ? "bg-white text-[#111827] shadow-xs"
                      : "text-[#6B7280]"
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTableView("table")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    mobileTableView === "table"
                      ? "bg-white text-[#111827] shadow-xs"
                      : "text-[#6B7280]"
                  }`}
                >
                  Full Table
                </button>
              </div>
            </div>

            {/* 1. Mobile Cards (shown on small screens when "cards" is active) */}
            {mobileTableView === "cards" && (
              <div className="md:hidden space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-white border border-[#ECEEF2] shadow-xs space-y-3"
                  >
                    {/* Header Row: Order ID, PDF tag & Tags */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ops/orders/${order.id}`}
                          className="font-mono font-extrabold text-sm text-[#111827] hover:text-[#00A86B] transition-colors"
                        >
                          {order.formattedOrderNumber}
                        </Link>
                        {order.quotationUrl && (
                          <a
                            href={order.quotationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            title="View Quotation PDF"
                          >
                            <FileText className="w-3 h-3 text-red-500" />
                            <span>PDF</span>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {order.orderSource && (
                          <OpsBadge source={order.orderSource} size="sm" />
                        )}
                        <OpsBadge priority={order.priority} size="sm" />
                      </div>
                    </div>

                    {/* Customer & Garment Item summary */}
                    <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] space-y-1">
                      {order.customer.companyName ? (
                        <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                          <span className="truncate">{order.customer.companyName}</span>
                        </div>
                      ) : (
                        <div className="font-bold text-xs text-[#111827]">
                          {order.customer.name || "Customer"}
                        </div>
                      )}
                      <div className="text-[11px] text-[#4B5563]">
                        {order.customer.companyName && order.customer.name && order.customer.name !== order.customer.companyName
                          ? `${order.customer.name} • ${order.customer.phone || ""}`
                          : order.customer.phone || "-"}
                      </div>
                      <div className="text-xs text-[#111827] font-medium pt-1 border-t border-[#ECEEF2]/60 mt-1">
                        {order.items.map((i) => i.productName).join(", ")}
                      </div>
                    </div>

                    {/* Pipeline Stage & Status Row */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <OpsBadge stage={order.opsStage} size="sm" />
                        <OpsBadge
                          status={
                            order.opsStage === "CLOSED" || order.status === "DELIVERED"
                              ? "COMPLETED"
                              : order.currentExecution?.status || "PENDING"
                          }
                          size="sm"
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#00A86B] bg-[#E6F7F0] border border-[#B3E8D3] px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                        {order.totalQuantity} pcs
                      </span>
                    </div>

                    {/* Footer: Due date + Open Button */}
                    <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                      <div className="text-[11px] text-[#9CA3AF]">
                        Target:{" "}
                        <strong className="text-[#111827]">
                          {order.dueDate
                            ? new Date(order.dueDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })
                            : "No date"}
                        </strong>
                      </div>

                      <Link href={`/ops/orders/${order.id}`}>
                        <OpsButton variant="secondary" size="sm">
                          Open Order &rarr;
                        </OpsButton>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Fluid Horizontal Scrolling Spreadsheet Table (always on md:+, or on mobile when "table" selected) */}
            <div
              className={`${
                mobileTableView === "cards" ? "hidden md:block" : "block"
              } bg-white border border-[#ECEEF2] rounded-2xl shadow-xs overflow-hidden`}
            >
              {/* Mobile swipe indicator banner */}
              <div className="md:hidden px-3.5 py-2 bg-[#F8F9FB] border-b border-[#ECEEF2] flex items-center justify-between text-[11px] text-[#6B7280]">
                <span>← Swipe table left/right to view all columns →</span>
                <span className="font-bold text-[#00A86B] font-mono">{orders.length} orders</span>
              </div>

              <div className="overflow-x-auto scrollbar-thin touch-pan-x">
                <table className="ops-clean-table w-full text-left text-xs min-w-[880px]">
                  <thead>
                    <tr className="border-b border-[#ECEEF2] text-[#9CA3AF] text-[11px] font-semibold uppercase">
                      <th className="py-3 px-3">Order #</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Lead Source</th>
                      <th className="py-3 px-3">Garment Items</th>
                      <th className="py-3 px-3">Quantity</th>
                      <th className="py-3 px-3">Production Stage</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#111827]">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/ops/orders/${order.id}`}
                              className="hover:text-[#00A86B] transition-colors"
                            >
                              {order.formattedOrderNumber}
                            </Link>
                            {order.quotationUrl && (
                              <a
                                href={order.quotationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                title="View Quotation PDF"
                              >
                                <FileText className="w-3 h-3 text-red-500" />
                                <span>PDF</span>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#111827]">
                            {order.customer.companyName ? (
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                                <span>{order.customer.companyName}</span>
                              </span>
                            ) : (
                              order.customer.name || "Customer"
                            )}
                          </div>
                          <div className="text-[10px] text-[#6B7280]">
                            {order.customer.companyName && order.customer.name && order.customer.name !== order.customer.companyName
                              ? `${order.customer.name} • ${order.customer.phone || ""}`
                              : order.customer.phone || "-"}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <OpsBadge source={order.orderSource || "WEBSITE"} size="sm" />
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs text-[#111827] max-w-xs truncate font-medium">
                            {order.items.map((i) => i.productName).join(", ")}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#111827]">
                          {order.totalQuantity} pcs
                        </td>
                        <td className="py-3 px-3">
                          <OpsBadge stage={order.opsStage} size="sm" />
                        </td>
                        <td className="py-3 px-3">
                          <OpsBadge
                            status={
                              order.opsStage === "CLOSED" || order.status === "DELIVERED"
                                ? "COMPLETED"
                                : order.currentExecution?.status || "PENDING"
                            }
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <OpsBadge priority={order.priority} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-xs text-[#6B7280]">
                          {order.dueDate
                            ? new Date(order.dueDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/ops/orders/${order.id}`}>
                            <OpsButton variant="ghost" size="sm">
                              Open &rarr;
                            </OpsButton>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#6B7280] py-2 px-1">
                <div>
                  Showing {orders.length} of {totalCount} total orders
                </div>
                <div className="flex items-center gap-1.5">
                  <OpsButton
                    variant="secondary"
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
                  <span className="px-2 font-mono font-bold text-[#111827]">
                    Page {page} of {totalPages}
                  </span>
                  <OpsButton
                    variant="secondary"
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
            )}
          </div>
        )}

        {/* Create Order Modal */}
        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onOrderCreated={(newOrderId) => {
            fetchOrders();
            if (newOrderId) {
              router.push(`/ops/orders/${newOrderId}`);
            }
          }}
        />
      </div>
    </OpsLayout>
  );
}

export default function OpsOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center text-[#6B7280] text-xs">
          Loading Manufacturing Orders Directory...
        </div>
      }
    >
      <OpsOrdersContent />
    </Suspense>
  );
}
