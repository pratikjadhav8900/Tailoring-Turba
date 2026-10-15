"use client";

import React, { useState } from "react";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsProductionStage, OpsStageStatus } from "@/types/ops";
import { AlertTriangle, Check, ChevronDown, ChevronUp } from "lucide-react";

interface StageProgressBarProps {
  currentStage: OpsProductionStage | null;
  currentStatus?: OpsStageStatus;
  iteration?: number;
}

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  currentStatus,
  iteration = 1,
}) => {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);
  const currentIndex = currentStage ? STAGE_SEQUENCE.indexOf(currentStage) : -1;
  const isRework = currentStatus === "FLAGGED_REWORK";
  const progressPercent =
    currentIndex >= 0
      ? Math.round(((currentIndex + 1) / STAGE_SEQUENCE.length) * 100)
      : 0;

  const nextStage =
    currentIndex >= 0 && currentIndex < STAGE_SEQUENCE.length - 1
      ? STAGE_SEQUENCE[currentIndex + 1]
      : null;

  return (
    <div className="w-full bg-white border border-[#ECEEF2] rounded-2xl p-3.5 sm:p-5 shadow-xs">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Pipeline:
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#111827]">
            {currentStage ? STAGE_DISPLAY_NAMES[currentStage] : "Not In Pipeline"}
          </span>
          {isRework && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              Rework #{iteration}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#6B7280]">
            Step {currentIndex >= 0 ? currentIndex + 1 : 0} of {STAGE_SEQUENCE.length}
          </span>
          <span className="hidden sm:inline-block text-[11px] font-bold text-[#00A86B] bg-[#E6F7F0] px-2.5 py-0.5 rounded-full border border-[#B3E8D3]">
            {progressPercent}%
          </span>
          {/* Mobile expand / collapse toggle */}
          <button
            type="button"
            onClick={() => setIsExpandedMobile(!isExpandedMobile)}
            className="sm:hidden flex items-center gap-1 text-[11px] font-semibold text-[#00A86B] hover:text-[#00925d] px-2 py-0.5 rounded-lg bg-[#E6F7F0] transition-colors"
          >
            <span>{isExpandedMobile ? "Compact" : "View all"}</span>
            {isExpandedMobile ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* --- MOBILE COMPACT VIEW (< sm) --- */}
      <div className="sm:hidden space-y-2.5">
        {/* Progress Bar Track */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden border border-[#E5E7EB]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isRework
                  ? "bg-red-500"
                  : "bg-gradient-to-r from-[#00A86B] to-[#10B981]"
              }`}
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-0.5">
            <span>{progressPercent}% completed</span>
            {nextStage && (
              <span className="text-[#374151] font-medium truncate max-w-[180px]">
                Next: {STAGE_DISPLAY_NAMES[nextStage]}
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Swipeable Stage Rail (compact, zero vertical clustering) */}
        {!isExpandedMobile && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
            {STAGE_SEQUENCE.map((stage, idx) => {
              const isCurrent = stage === currentStage;
              const isPassed = currentIndex > idx;

              if (isCurrent) {
                return (
                  <div
                    key={stage}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[#00A86B] text-white flex items-center gap-2 shadow-xs border border-[#00A86B]"
                  >
                    <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold whitespace-nowrap">
                      {STAGE_DISPLAY_NAMES[stage]}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                );
              }

              if (isPassed) {
                return (
                  <div
                    key={stage}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-[11px] whitespace-nowrap text-emerald-900">
                      {STAGE_DISPLAY_NAMES[stage]}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={stage}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB] flex items-center gap-1.5 text-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-[#E5E7EB] text-[#6B7280] flex items-center justify-center text-[9px] font-bold font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] whitespace-nowrap text-[#6B7280]">
                    {STAGE_DISPLAY_NAMES[stage]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Optional Expanded 2-Column Grid on Mobile (only if toggled open) */}
        {isExpandedMobile && (
          <div className="grid grid-cols-2 gap-1.5 pt-1 animate-fadeIn">
            {STAGE_SEQUENCE.map((stage, idx) => {
              const isCurrent = stage === currentStage;
              const isPassed = currentIndex > idx;

              return (
                <div
                  key={stage}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center justify-between gap-1 transition-all ${
                    isCurrent
                      ? "bg-[#00A86B] text-white border-[#00A86B] shadow-xs"
                      : isPassed
                      ? "bg-emerald-50/60 text-emerald-900 border-emerald-200"
                      : "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                      isCurrent
                        ? "bg-white/20 text-white"
                        : isPassed
                        ? "bg-emerald-600 text-white"
                        : "bg-[#E5E7EB] text-[#6B7280]"
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3 stroke-[2.5]" /> : idx + 1}
                  </div>
                  <div className="text-[10px] font-semibold leading-tight line-clamp-1">
                    {STAGE_DISPLAY_NAMES[stage]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- DESKTOP / TABLET STEPPER GRID (>= sm) --- */}
      <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGE_SEQUENCE.map((stage, idx) => {
          const isCurrent = stage === currentStage;
          const isPassed = currentIndex > idx;

          let stepBg = "bg-[#FAFAFA]";
          let stepBorder = "border-[#E5E7EB]";
          let stepNumberBg = "bg-[#E5E7EB] text-[#4B5563]";
          let stepTextColor = "text-[#6B7280]";

          if (isCurrent) {
            if (isRework) {
              stepBg = "bg-red-50";
              stepBorder = "border-red-300";
              stepNumberBg = "bg-red-600 text-white";
              stepTextColor = "text-red-700 font-bold";
            } else {
              stepBg = "bg-[#00A86B]";
              stepBorder = "border-[#00A86B]";
              stepNumberBg = "bg-white/25 text-white";
              stepTextColor = "text-white font-bold";
            }
          } else if (isPassed) {
            stepBg = "bg-emerald-50/50";
            stepBorder = "border-emerald-200";
            stepNumberBg = "bg-emerald-600 text-white";
            stepTextColor = "text-emerald-800 font-semibold";
          }

          return (
            <div
              key={stage}
              className={`p-2.5 rounded-xl border text-center flex flex-col justify-between items-center transition-all ${stepBg} ${stepBorder} ${
                isCurrent ? "shadow-xs ring-2 ring-[#00A86B]/30" : "hover:border-[#CBD5E1]"
              }`}
              title={STAGE_DISPLAY_NAMES[stage]}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] font-mono font-bold ${stepNumberBg}`}
              >
                {isPassed ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
              </div>
              <div
                className={`text-[11px] font-semibold leading-tight truncate w-full ${stepTextColor}`}
              >
                {STAGE_DISPLAY_NAMES[stage]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
