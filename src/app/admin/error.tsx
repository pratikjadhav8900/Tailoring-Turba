"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin dashboard runtime telemetry error:", error);
  }, [error]);

  return (
    <div className="bg-white border border-[#E2E0D8] rounded-[2px] p-8 max-w-lg mx-auto my-16 text-center" role="alert">
      <div className="w-10 h-10 bg-[#FDF3ED] border border-[#EBDCD3] rounded-full flex items-center justify-center mx-auto mb-4 text-[#B88970]">
        <AlertTriangle size={18} />
      </div>
      <div className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-[#829386] mb-1.5">
        TELEMETRY STATUS // SYSTEM INTERRUPTION
      </div>
      <h2 className="text-lg font-bold text-[#171916] mb-2 font-['General_Sans',sans-serif]">
        Unable to load operations data
      </h2>
      <p className="text-xs text-[#4A4A45] mb-6 font-['General_Sans',sans-serif] max-w-sm mx-auto leading-relaxed">
        A transient connection failure occurred while querying live database records.
        {error?.message ? ` (${error.message})` : ""}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 h-8 bg-[#294238] hover:bg-[#1F332A] text-white text-xs font-semibold rounded-[2px] transition-colors focus-visible:outline-2 focus-visible:outline-[#294238]"
      >
        <RotateCcw size={13} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
