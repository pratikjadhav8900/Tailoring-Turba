import React from "react";
import { Loader2 } from "lucide-react";

interface OpsLoadingStateProps {
  message?: string;
  className?: string;
}

export const OpsLoadingState: React.FC<OpsLoadingStateProps> = ({
  message = "Loading...",
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-[#829386] gap-3 ${className}`}
    >
      <Loader2 className="w-6 h-6 animate-spin text-[#294238]" />
      <span className="text-xs font-mono font-medium tracking-wide">{message}</span>
    </div>
  );
};
