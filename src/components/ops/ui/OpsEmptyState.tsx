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
  icon = <FolderOpen className="w-8 h-8 text-[#829386]" />,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#c8c5bc] rounded-md bg-[#FAF9F5]/70 ${className}`}
    >
      <div className="p-3.5 bg-white rounded-full mb-3 border border-[#e2e0d8] shadow-xs">{icon}</div>
      <h4 className="text-sm font-bold text-[#171916] font-mono">{title}</h4>
      <p className="text-xs text-[#829386] max-w-sm mt-1 mb-4 font-sans">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
