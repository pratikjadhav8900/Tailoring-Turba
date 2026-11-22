import React from "react";
import type { LeadStage } from "@/types/crm";
import { LEAD_STAGE_LABELS } from "@/types/crm";

const STYLES: Record<LeadStage, { bg: string; border: string; color: string }> = {
  NEW_LEAD: { bg: "#EFF6FF", border: "#BFDBFE", color: "#2563EB" },
  DNP: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706" },
  INTERESTED: { bg: "#ECFDF5", border: "#A7F3D0", color: "#059669" },
  NOT_INTERESTED: { bg: "#F4F6F9", border: "#E5E8ED", color: "#6B7280" },
  CONVERTED: { bg: "#F0FDF4", border: "#86EFAC", color: "#16A34A" },
  CLOSED: { bg: "#F4F6F9", border: "#E5E8ED", color: "#4B5563" },
};

export const LeadStatusBadge: React.FC<{ status: LeadStage; size?: "sm" | "md" }> = ({
  status,
  size = "md",
}) => {
  const style = STYLES[status] || STYLES.NEW_LEAD;
  const isSmall = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap ${
        isSmall ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
      }`}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        borderWidth: 1,
        borderStyle: "solid",
        color: style.color,
      }}
    >
      {LEAD_STAGE_LABELS[status] || status}
    </span>
  );
};
