import React from "react";
import type { OpsProductionStage, OpsStageStatus, OpsPriority } from "@/types/ops";
import { STAGE_DISPLAY_NAMES } from "@/lib/ops/workflow";

interface OpsBadgeProps {
  stage?: OpsProductionStage | null;
  status?: OpsStageStatus;
  priority?: OpsPriority;
  source?: string | null;
  text?: string;
  size?: "sm" | "md";
  className?: string;
}

export const OpsBadge: React.FC<OpsBadgeProps> = ({
  stage,
  status,
  priority,
  source,
  text,
  size = "md",
  className = "",
}) => {
  let label = text || "";
  let bg = "#F4F6F9";
  let border = "#E5E8ED";
  let color = "#4B5563";

  if (source) {
    const s = source.toUpperCase();
    switch (s) {
      case "WHATSAPP":
        label = "WhatsApp";
        bg = "#ECFDF5";
        border = "#A7F3D0";
        color = "#059669";
        break;
      case "NATURAL":
      case "WALK_IN":
      case "DIRECT":
        label = "Natural / Direct";
        bg = "#EFF6FF";
        border = "#BFDBFE";
        color = "#2563EB";
        break;
      case "WEBSITE":
        label = "Website";
        bg = "#F3F4F6";
        border = "#E5E7EB";
        color = "#4B5563";
        break;
      case "PHONE":
      case "CALL":
        label = "Phone Call";
        bg = "#FFFBEB";
        border = "#FDE68A";
        color = "#D97706";
        break;
      case "INSTAGRAM":
      case "SOCIAL":
        label = "Instagram";
        bg = "#FDF2F8";
        border = "#FBCFE8";
        color = "#DB2777";
        break;
      case "REFERRAL":
        label = "Referral";
        bg = "#F5F3FF";
        border = "#DDD6FE";
        color = "#7C3AED";
        break;
      case "TURBA_AI":
        label = "Turba AI";
        bg = "#F0FDF4";
        border = "#BBF7D0";
        color = "#16A34A";
        break;
      case "MANUAL_OPS":
        label = "Manual Intake";
        bg = "#F8FAFC";
        border = "#E2E8F0";
        color = "#475569";
        break;
      default:
        label = source;
        bg = "#F4F6F9";
        border = "#E5E8ED";
        color = "#4B5563";
        break;
    }
  } else if (stage) {
    label = STAGE_DISPLAY_NAMES[stage] || stage;
    switch (stage) {
      case "NEW_ORDER":
        bg = "#F4F6F9";
        border = "#E5E8ED";
        color = "#4B5563";
        break;
      case "ORDER_CONFIRMED":
      case "RESOURCE_FABRIC":
      case "CUTTING":
      case "STITCHING":
      case "BRANDING_PRINTING":
        bg = "#E6F7F0";
        border = "#B3E8D3";
        color = "#00A86B";
        break;
      case "QUALITY_CHECK":
        bg = "#FEF2F2";
        border = "#FECACA";
        color = "#EF4444";
        break;
      case "PACKING":
      case "READY_FOR_DISPATCH":
      case "DISPATCHED":
      case "CLOSED":
        bg = "#ECFDF5";
        border = "#A7F3D0";
        color = "#059669";
        break;
    }
  } else if (status) {
    label = status === "FLAGGED_REWORK" ? "Rework" : status === "COMPLETED" ? "Success" : status === "PENDING" ? "Pending" : "In Progress";
    switch (status) {
      case "PENDING":
        bg = "#FFFBEB";
        border = "#FDE68A";
        color = "#D97706";
        break;
      case "IN_PROGRESS":
        bg = "#E6F7F0";
        border = "#B3E8D3";
        color = "#00A86B";
        break;
      case "COMPLETED":
        bg = "#ECFDF5";
        border = "#A7F3D0";
        color = "#059669";
        break;
      case "FLAGGED_REWORK":
        bg = "#FEF2F2";
        border = "#FECACA";
        color = "#DC2626";
        break;
    }
  } else if (priority) {
    label = priority;
    switch (priority) {
      case "NORMAL":
        bg = "#F4F6F9";
        border = "#E5E8ED";
        color = "#6B7280";
        break;
      case "URGENT":
        bg = "#FFFBEB";
        border = "#FDE68A";
        color = "#D97706";
        break;
      case "RUSH":
        bg = "#FEF2F2";
        border = "#FECACA";
        color = "#EF4444";
        break;
    }
  }

  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${
        isSmall ? "px-2.5 py-0.5 text-[11px]" : "px-3.5 py-1 text-xs"
      } ${className}`}
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: "1px",
        borderStyle: "solid",
        color,
      }}
    >
      {status === "FLAGGED_REWORK" && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
      )}
      {label}
    </span>
  );
};
