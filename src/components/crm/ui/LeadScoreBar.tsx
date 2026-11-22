import React from "react";

function colorForScore(score: number) {
  if (score >= 8) return "#10B981";
  if (score >= 5) return "#FF6A39";
  if (score >= 3) return "#F59E0B";
  return "#D1D5DB";
}

export const LeadScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.max(0, Math.min(10, score));
  const segments = 6;
  const filled = Math.round((clamped / 10) * segments);
  const color = colorForScore(clamped);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-3.5 rounded-sm"
            style={{ backgroundColor: i < filled ? color : "#E5E7EB" }}
          />
        ))}
      </div>
      <span className="text-[11px] font-semibold text-[#4B5563] bg-[#F4F6F9] border border-[#E5E8ED] rounded-md px-1.5 py-0.5 shrink-0">
        {clamped}/10
      </span>
    </div>
  );
};
