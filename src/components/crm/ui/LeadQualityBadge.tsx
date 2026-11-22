import React from "react";
import { getLeadQuality } from "@/types/crm";

const STYLES = {
  HOT: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", label: "Hot" },
  WARM: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", label: "Warm" },
  COLD: { bg: "#EFF6FF", border: "#BFDBFE", color: "#2563EB", label: "Cold" },
};

export const LeadQualityBadge: React.FC<{ score: number; size?: "sm" | "md" }> = ({ score, size = "md" }) => {
  const quality = getLeadQuality(score);
  const style = STYLES[quality];
  const isSmall = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap ${
        isSmall ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
      }`}
      style={{ backgroundColor: style.bg, borderColor: style.border, borderWidth: 1, borderStyle: "solid", color: style.color }}
    >
      {quality === "HOT" && <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />}
      {style.label}
    </span>
  );
};
