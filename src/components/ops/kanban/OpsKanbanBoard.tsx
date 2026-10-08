"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsOrder, OpsProductionStage } from "@/types/ops";
import { OpsBadge } from "../ui/OpsBadge";
import { StageActionModal } from "../stages/StageActionModal";
import { ChevronRight, Clock, AlertTriangle } from "lucide-react";

interface OpsKanbanBoardProps {
  orders: OpsOrder[];
  onRefresh: () => void;
}

export const OpsKanbanBoard: React.FC<OpsKanbanBoardProps> = ({
  orders,
  onRefresh,
}) => {
  const [selectedOrderForStage, setSelectedOrderForStage] = useState<OpsOrder | null>(null);

  // Group orders by stage (orders with null stage go into NEW_ORDER or an unassigned pile)
  const columns = STAGE_SEQUENCE.map((stage) => {
    const stageOrders = orders.filter((o) => o.opsStage === stage);
    const totalQty = stageOrders.reduce((sum, o) => sum + o.totalQuantity, 0);
    return {
      stage,
      title: STAGE_DISPLAY_NAMES[stage],
      orders: stageOrders,
      totalQty,
    };
  });

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-170px)] select-none">
        {columns.map(({ stage, title, orders: stageOrders, totalQty }) => (
          <div
            key={stage}
            className="w-72 shrink-0 bg-[#0e1017] border border-[#1e2230] rounded-lg flex flex-col h-full overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-3 bg-[#12141e] border-b border-[#1e2230] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 tracking-tight">
                  {title}
                </h4>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {stageOrders.length} orders • {totalQty} pcs
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.05]">
                {stageOrders.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {stageOrders.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-[#1e2230]/60 rounded">
                  No orders in {title.split(" ")[0]}
                </div>
              ) : (
                stageOrders.map((order) => {
                  const isRework =
                    order.currentExecution?.status === "FLAGGED_REWORK";

                  return (
                    <div
                      key={order.id}
                      className={`p-3 rounded border bg-[#131520] transition-all hover:border-amber-500/50 hover:bg-[#161825] group ${
                        isRework
                          ? "border-red-500/50 bg-red-500/[0.03]"
                          : "border-[#1e2230]"
                      }`}
                    >
                      {/* Top Row: Order Tag & Priority */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <Link
                          href={`/ops/orders/${order.id}`}
                          className="ops-order-tag text-xs text-slate-200 hover:text-amber-400"
                        >
                          {order.formattedOrderNumber}
                        </Link>
                        <OpsBadge priority={order.priority} size="sm" />
                      </div>

                      {/* Rework Alert Banner */}
                      {isRework && (
                        <div className="mb-2 p-1.5 rounded bg-red-500/15 border border-red-500/30 text-[10px] text-red-300 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                          <span className="truncate">
                            Rework #{order.currentExecution?.iteration}
                          </span>
                        </div>
                      )}

                      {/* Customer & Product Summary */}
                      <Link href={`/ops/orders/${order.id}`} className="block">
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {order.customer.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {order.items[0]?.productName || "Garment"}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </div>
                      </Link>

                      {/* Footer: Qty, Due Date & Quick Advance */}
                      <div className="mt-3 pt-2 border-t border-[#1e2230] flex items-center justify-between text-[11px] text-slate-400">
                        <div className="font-mono font-bold text-slate-300">
                          {order.totalQuantity} pcs
                        </div>

                        <div className="flex items-center gap-2">
                          {order.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(order.dueDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => setSelectedOrderForStage(order)}
                            title="Advance Stage"
                            className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Advance Stage Modal */}
      {selectedOrderForStage && (
        <StageActionModal
          orderId={selectedOrderForStage.id}
          orderNumber={selectedOrderForStage.orderNumber}
          currentStage={selectedOrderForStage.opsStage}
          isOpen={!!selectedOrderForStage}
          onClose={() => setSelectedOrderForStage(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};
