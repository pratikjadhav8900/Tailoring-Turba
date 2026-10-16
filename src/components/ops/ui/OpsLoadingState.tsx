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
      className={`flex flex-col items-center justify-center p-12 text-[#6B7280] gap-3 ${className}`}
    >
      <Loader2 className="w-7 h-7 animate-spin text-[#00A86B]" />
      <span className="text-xs font-sans font-semibold tracking-wide text-[#374151]">{message}</span>
    </div>
  );
};
