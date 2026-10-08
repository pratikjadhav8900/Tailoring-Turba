import React from "react";
import {
  STAGE_SEQUENCE,
  STAGE_DISPLAY_NAMES,
} from "@/lib/ops/workflow";
import type { OpsProductionStage, OpsStageStatus } from "@/types/ops";
import { AlertTriangle, Check } from "lucide-react";

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
  const currentIndex = currentStage ? STAGE_SEQUENCE.indexOf(currentStage) : -1;
  const isRework = currentStatus === "FLAGGED_REWORK";

  return (
    <div className="w-full bg-[#10121a] border border-[#1e2230] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Production Progress:</span>
          <span className="font-bold text-slate-100">
            {currentStage ? STAGE_DISPLAY_NAMES[currentStage] : "Not In Pipeline"}
          </span>
          {isRework && (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Rework Iteration #{iteration}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Step {currentIndex >= 0 ? currentIndex + 1 : 0} of {STAGE_SEQUENCE.length}
        </span>
      </div>

      {/* Horizontal step bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGE_SEQUENCE.map((stage, idx) => {
          const isCurrent = stage === currentStage;
          const isPassed = currentIndex > idx;
          const isPending = currentIndex < idx;

          let stepBg = "bg-[#1c202d]";
          let stepBorder = "border-[#2a3044]";
          let stepTextColor = "text-slate-500";

          if (isCurrent) {
            if (isRework) {
              stepBg = "bg-red-500/20";
              stepBorder = "border-red-500/60";
              stepTextColor = "text-red-300";
            } else {
              stepBg = "bg-amber-500/20";
              stepBorder = "border-amber-500/60";
              stepTextColor = "text-amber-300";
            }
          } else if (isPassed) {
            stepBg = "bg-emerald-500/15";
            stepBorder = "border-emerald-500/40";
            stepTextColor = "text-emerald-400";
          }

          return (
            <div
              key={stage}
              className={`flex-1 min-w-[70px] p-2 rounded border text-center transition-all ${stepBg} ${stepBorder}`}
              title={STAGE_DISPLAY_NAMES[stage]}
            >
              <div className="flex items-center justify-center mb-1">
                {isPassed ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <span className={`text-[10px] font-mono font-bold ${stepTextColor}`}>
                    {idx + 1}
                  </span>
                )}
              </div>
              <div className={`text-[10px] font-medium truncate ${stepTextColor}`}>
                {STAGE_DISPLAY_NAMES[stage].split(" ")[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
