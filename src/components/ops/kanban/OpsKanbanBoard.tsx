"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsOrder } from "@/types/ops";
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
      <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-200px)] select-none touch-pan-x scrollbar-thin">
        {columns.map(({ stage, title, orders: stageOrders, totalQty }) => (
          <div
            key={stage}
            className="w-72 shrink-0 bg-[#F4F6F9]/80 border border-[#ECEEF2] rounded-[20px] flex flex-col h-full overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-4 bg-white border-b border-[#ECEEF2] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#111827] tracking-tight">
                  {title}
                </h4>
                <div className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                  {stageOrders.length} orders • {totalQty} pcs
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F4F6F9] text-[#111827] border border-[#ECEEF2]">
                {stageOrders.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {stageOrders.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-[#9CA3AF] border border-dashed border-[#D1D5DB] rounded-xl bg-white/50">
                  No orders in {title.split(" ")[0]}
                </div>
              ) : (
                stageOrders.map((order) => {
                  const isRework =
                    order.currentExecution?.status === "FLAGGED_REWORK";

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-[16px] border bg-white transition-all hover:border-[#00A86B] hover:shadow-md group ${
                        isRework
                          ? "border-[#EF4444]/40 bg-[#FEF2F2]/30"
                          : "border-[#ECEEF2]"
                      }`}
                    >
                      {/* Top Row: Order Tag & Priority & Lead Source */}
                      <div className="flex items-center justify-between gap-1 mb-2.5">
                        <Link
                          href={`/ops/orders/${order.id}`}
                          className="font-mono text-xs font-bold text-[#111827] hover:text-[#00A86B] transition-colors"
                        >
                          {order.formattedOrderNumber}
                        </Link>
                        <div className="flex items-center gap-1">
                          {order.orderSource && <OpsBadge source={order.orderSource} size="sm" />}
                          <OpsBadge priority={order.priority} size="sm" />
                        </div>
                      </div>

                      {/* Rework Alert Banner */}
                      {isRework && (
                        <div className="mb-2 p-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[10px] text-[#DC2626] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[#EF4444] shrink-0" />
                          <span className="truncate">
                            Rework #{order.currentExecution?.iteration}
                          </span>
                        </div>
                      )}

                      {/* Customer & Product Summary */}
                      <Link href={`/ops/orders/${order.id}`} className="block">
                        <div className="text-xs font-bold text-[#111827] truncate">
                          {order.customer.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate mt-0.5">
                          {order.items[0]?.productName || "Garment"}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </div>
                      </Link>

                      {/* Footer: Qty, Due Date & Quick Advance */}
                      <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
                        <div className="font-bold text-[#111827]">
                          {order.totalQuantity} pcs
                        </div>

                        <div className="flex items-center gap-2">
                          {order.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
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
                            className="p-1.5 rounded-full bg-[#F4F6F9] hover:bg-[#00A86B] text-[#4B5563] hover:text-white transition-all shadow-xs"
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
          totalAmount={selectedOrderForStage.totalAmount}
          amountPaid={selectedOrderForStage.amountPaid}
          isOpen={!!selectedOrderForStage}
          onClose={() => setSelectedOrderForStage(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};
