import React from "react";
import { FolderOpen } from "lucide-react";

interface OpsEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const OpsEmptyState: React.FC<OpsEmptyStateProps> = ({
  title = "No records found",
  description = "No data available matching your criteria.",
  icon = <FolderOpen className="w-8 h-8 text-slate-500" />,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#1e2230] rounded-lg bg-[#0b0d13]/50 ${className}`}
    >
      <div className="p-3 bg-white/[0.03] rounded-full mb-3">{icon}</div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
