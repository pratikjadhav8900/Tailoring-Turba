import React from "react";
import type { OpsProductionStage, OpsStageStatus, OpsPriority } from "@/types/ops";
import { STAGE_DISPLAY_NAMES } from "@/lib/ops/workflow";

interface OpsBadgeProps {
  stage?: OpsProductionStage | null;
  status?: OpsStageStatus;
  priority?: OpsPriority;
  text?: string;
  variant?: "stage" | "status" | "priority" | "neutral" | "warning" | "danger" | "success";
  size?: "sm" | "md";
  className?: string;
}

export const OpsBadge: React.FC<OpsBadgeProps> = ({
  stage,
  status,
  priority,
  text,
  variant,
  size = "md",
  className = "",
}) => {
  let label = text || "";
  let bg = "rgba(148, 163, 184, 0.1)";
  let border = "rgba(148, 163, 184, 0.25)";
  let color = "#cbd5e1";

  if (stage) {
    label = STAGE_DISPLAY_NAMES[stage] || stage;
    switch (stage) {
      case "NEW_ORDER":
        bg = "rgba(148, 163, 184, 0.12)";
        border = "rgba(148, 163, 184, 0.3)";
        color = "#e2e8f0";
        break;
      case "ORDER_CONFIRMED":
        bg = "rgba(14, 165, 233, 0.12)";
        border = "rgba(14, 165, 233, 0.3)";
        color = "#38bdf8";
        break;
      case "RESOURCE_FABRIC":
        bg = "rgba(217, 119, 6, 0.12)";
        border = "rgba(217, 119, 6, 0.3)";
        color = "#fbbf24";
        break;
      case "CUTTING":
        bg = "rgba(234, 88, 12, 0.12)";
        border = "rgba(234, 88, 12, 0.3)";
        color = "#fb923c";
        break;
      case "STITCHING":
        bg = "rgba(59, 130, 246, 0.12)";
        border = "rgba(59, 130, 246, 0.3)";
        color = "#60a5fa";
        break;
      case "BRANDING_PRINTING":
        bg = "rgba(168, 85, 247, 0.12)";
        border = "rgba(168, 85, 247, 0.3)";
        color = "#c084fc";
        break;
      case "QUALITY_CHECK":
        bg = "rgba(244, 63, 94, 0.12)";
        border = "rgba(244, 63, 94, 0.3)";
        color = "#fb7185";
        break;
      case "PACKING":
        bg = "rgba(20, 184, 166, 0.12)";
        border = "rgba(20, 184, 166, 0.3)";
        color = "#2dd4bf";
        break;
      case "READY_FOR_DISPATCH":
        bg = "rgba(16, 185, 129, 0.12)";
        border = "rgba(16, 185, 129, 0.3)";
        color = "#34d399";
        break;
      case "DISPATCHED":
        bg = "rgba(16, 185, 129, 0.2)";
        border = "rgba(16, 185, 129, 0.4)";
        color = "#10b981";
        break;
      case "CLOSED":
        bg = "rgba(100, 116, 139, 0.15)";
        border = "rgba(100, 116, 139, 0.3)";
        color = "#94a3b8";
        break;
    }
  } else if (status) {
    label = status === "FLAGGED_REWORK" ? "Rework Flagged" : status.replace("_", " ");
    switch (status) {
      case "PENDING":
        bg = "rgba(148, 163, 184, 0.12)";
        border = "rgba(148, 163, 184, 0.25)";
        color = "#94a3b8";
        break;
      case "IN_PROGRESS":
        bg = "rgba(59, 130, 246, 0.12)";
        border = "rgba(59, 130, 246, 0.3)";
        color = "#60a5fa";
        break;
      case "COMPLETED":
        bg = "rgba(16, 185, 129, 0.12)";
        border = "rgba(16, 185, 129, 0.3)";
        color = "#34d399";
        break;
      case "FLAGGED_REWORK":
        bg = "rgba(239, 68, 68, 0.15)";
        border = "rgba(239, 68, 68, 0.4)";
        color = "#f87171";
        break;
    }
  } else if (priority) {
    label = priority;
    switch (priority) {
      case "NORMAL":
        bg = "rgba(148, 163, 184, 0.08)";
        border = "rgba(148, 163, 184, 0.2)";
        color = "#94a3b8";
        break;
      case "URGENT":
        bg = "rgba(245, 158, 11, 0.15)";
        border = "rgba(245, 158, 11, 0.35)";
        color = "#fbbf24";
        break;
      case "RUSH":
        bg = "rgba(239, 68, 68, 0.18)";
        border = "rgba(239, 68, 68, 0.45)";
        color = "#f87171";
        break;
    }
  }

  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded ${
        isSmall ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${className}`}
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: "1px",
        borderStyle: "solid",
        color,
        letterSpacing: "0.01em",
      }}
    >
      {status === "FLAGGED_REWORK" && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      )}
      {label}
    </span>
  );
};
