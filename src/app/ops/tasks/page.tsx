"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { OpsLayout } from "@/components/ops/layout/OpsLayout";
import { OpsCard } from "@/components/ops/ui/OpsCard";
import { OpsButton } from "@/components/ops/ui/OpsButton";
import { OpsLoadingState } from "@/components/ops/ui/OpsLoadingState";
import { PunchDoneModal } from "@/components/ops/tasks/PunchDoneModal";
import type { OpsTaskItem } from "@/types/ops";
import {
  Check,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function WorkerTasksPage() {
  const [tasks, setTasks] = useState<OpsTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState<"my" | "all">("my");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
  const [selectedTaskForDone, setSelectedTaskForDone] = useState<OpsTaskItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWorkerName, setCurrentWorkerName] = useState("");
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [currentEmployeeCode, setCurrentEmployeeCode] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [punchOnBehalf, setPunchOnBehalf] = useState(false);

  const getRoleLabel = (name?: string) => {
    if (!name) return "Worker";
    if (name.includes("Neeraj")) return "Founder";
    if (name.includes("Sanjay")) return "Co-Founder";
    if (name.includes("Pratik")) return "Tech & Ops";
    return "Worker";
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterView === "my") params.set("myTasks", "true");
      params.set("status", statusFilter);

      const res = await fetch(`/api/ops/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setCurrentWorkerName(data.currentEmployeeName || "Operator");
        setCurrentEmployeeId(data.currentEmployeeId || "");
        setCurrentEmployeeCode(data.currentEmployeeCode || "");
        setCurrentUserRole(data.currentUserRole || "");
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterView, statusFilter]);

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.formattedOrderNumber.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.employeeName.toLowerCase().includes(q) ||
      (t.orderCustomer && t.orderCustomer.toLowerCase().includes(q))
    );
  });

  return (
    <OpsLayout
      pageTitle="Worker Production Tasks"
      pageSubtitle={`Active manufacturing queue for ${currentWorkerName}`}
      headerAction={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTasks}
            className="w-9 h-9 rounded-full bg-white border border-[#ECEEF2] text-[#4B5563] hover:text-[#111827] flex items-center justify-center shadow-xs transition-colors"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6 w-full max-w-6xl mx-auto">
        {/* Controls & Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#ECEEF2] flex flex-wrap items-center justify-between gap-4 shadow-xs">
          {/* Tab Selector: My Tasks vs All Factory Tasks */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F4F6F9] border border-[#ECEEF2]">
            <button
              type="button"
              onClick={() => setFilterView("my")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterView === "my"
                  ? "bg-white text-[#111827] shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              My Assigned Tasks
            </button>
            <button
              type="button"
              onClick={() => setFilterView("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterView === "all"
                  ? "bg-white text-[#111827] shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              All Factory Tasks
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: "ACTIVE", label: "In Progress" },
              { id: "COMPLETED", label: "Completed" },
              { id: "ALL", label: "All" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  statusFilter === s.id
                    ? "bg-[#00A86B] text-white shadow-2xs"
                    : "bg-white border border-[#ECEEF2] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex items-center min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order or task..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#ECEEF2] bg-[#F8F9FB] text-xs text-[#111827] outline-none focus:border-[#00A86B]"
            />
          </div>
        </div>

        {/* Task Cards Grid */}
        {loading ? (
          <OpsLoadingState message="Loading assigned production tasks..." />
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#ECEEF2] space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">All Tasks Completed!</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              There are no pending tasks in your queue right now. You will be notified when new tasks are assigned.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const isDone = task.status === "COMPLETED";
              const isRush = task.orderPriority === "RUSH" || task.orderPriority === "URGENT";

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDone
                      ? "bg-white/80 border-[#ECEEF2] opacity-80"
                      : isRush
                      ? "bg-white border-amber-300 ring-2 ring-amber-400/20 shadow-xs"
                      : "bg-white border-[#ECEEF2] shadow-xs hover:border-[#CBD5E1]"
                  }`}
                >
                  {/* Top Bar: Order # and Priority */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/ops/orders/${task.orderId}`}
                        className="font-mono font-extrabold text-sm text-[#111827] hover:text-[#00A86B] flex items-center gap-1 transition-colors"
                      >
                        <span>{task.formattedOrderNumber}</span>
                        <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
                      </Link>
                      {isRush && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 animate-pulse">
                          {task.orderPriority}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#00A86B]" />
                      <span className="text-[#374151]">
                        {task.orderTotalPieces || 1} pcs
                      </span>
                    </div>
                  </div>

                  {/* Task Title & Worker */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#111827]">
                        {task.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isDone ? "✓ Done" : "In Progress"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1 font-semibold text-[#374151]">
                        <User className="w-3.5 h-3.5 text-[#00A86B]" />
                        {getRoleLabel(task.employeeName)}: {task.employeeName}
                      </span>
                      {task.orderCustomer && (
                        <span>• Customer: {task.orderCustomer}</span>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  {task.instructions && (
                    <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#ECEEF2] text-xs text-[#374151] mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-0.5">
                        Instructions:
                      </span>
                      <p className="leading-relaxed">{task.instructions}</p>
                    </div>
                  )}

                  {/* Vendor Details (if completed) */}
                  {task.vendorName && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Done from: <strong>{task.vendorName}</strong>
                        {task.vendorCost ? ` • ₹${task.vendorCost}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Completion Note */}
                  {task.notes && (
                    <p className="text-[11px] text-[#6B7280] italic mb-3">
                      Worker Note: "{task.notes}"
                    </p>
                  )}

                  {/* Bottom Action: Punch Done */}
                  <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#9CA3AF]">
                      {isDone && task.completedAt
                        ? `Completed ${new Date(task.completedAt).toLocaleDateString("en-IN")}`
                        : `Assigned by ${task.assignedBy}`}
                    </span>

                    {!isDone && (
                      <div>
                        {currentEmployeeId && task.employeeId && currentEmployeeId === task.employeeId ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPunchOnBehalf(false);
                              setSelectedTaskForDone(task);
                            }}
                            className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Punch Done</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>Awaiting {task.employeeName}</span>
                            </span>

                            {(currentUserRole === "ADMIN" ||
                              currentUserRole === "SUPER_ADMIN" ||
                              ["TT001", "TT002", "TT003"].includes(currentEmployeeCode) ||
                              currentWorkerName.includes("Pratik") ||
                              currentWorkerName.includes("Neeraj") ||
                              currentWorkerName.includes("Sanjay")) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPunchOnBehalf(true);
                                  setSelectedTaskForDone(task);
                                }}
                                className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6] border border-[#ECEEF2] transition-colors"
                                title={`Record completion on behalf of ${task.employeeName}`}
                              >
                                Punch on Behalf
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Punch Done Modal */}
        {selectedTaskForDone && (
          <PunchDoneModal
            task={selectedTaskForDone}
            isOpen={!!selectedTaskForDone}
            isPunchingOnBehalf={punchOnBehalf}
            onClose={() => {
              setSelectedTaskForDone(null);
              setPunchOnBehalf(false);
            }}
            onSuccess={() => {
              setSelectedTaskForDone(null);
              setPunchOnBehalf(false);
              fetchTasks();
            }}
          />
        )}
      </div>
    </OpsLayout>
  );
}
