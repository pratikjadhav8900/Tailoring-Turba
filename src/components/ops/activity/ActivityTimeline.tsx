import React from "react";
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  FileText,
  Truck,
  PlusCircle,
} from "lucide-react";
import type { OpsActivityEvent } from "@/types/ops";

interface ActivityTimelineProps {
  events: OpsActivityEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-[#829386] bg-[#FAF9F5] rounded border border-[#e2e0d8] font-mono">
        No recorded activity yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "OPS_STAGE_REWORK_FLAGGED":
        return <AlertTriangle className="w-3.5 h-3.5 text-[#8b2020]" />;
      case "OPS_STAGE_TRANSITION":
      case "OPS_STAGE_OVERRIDDEN":
        return <ArrowRight className="w-3.5 h-3.5 text-[#294238]" />;
      case "OPS_INTERNAL_NOTE_ADDED":
        return <FileText className="w-3.5 h-3.5 text-[#c49d32]" />;
      case "DISPATCHED":
      case "SHIPMENT_BOOKED":
        return <Truck className="w-3.5 h-3.5 text-[#3a6b3a]" />;
      case "OPS_ORDER_CREATED":
        return <PlusCircle className="w-3.5 h-3.5 text-[#294238]" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#829386]" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e0d8]">
      {events.map((event) => {
        const isRework = event.eventType === "OPS_STAGE_REWORK_FLAGGED";

        return (
          <div key={event.id} className="relative group text-xs">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border shadow-xs ${
                isRework
                  ? "bg-[#8b2020]/10 border-[#8b2020]/40"
                  : "bg-white border-[#c8c5bc]"
              }`}
            >
              {getEventIcon(event.eventType)}
            </div>

            {/* Content Card */}
            <div
              className={`p-3 rounded border shadow-xs transition-all ${
                isRework
                  ? "bg-[#8b2020]/5 border-[#8b2020]/30 text-[#8b2020]"
                  : "bg-[#FAF9F5] border-[#e2e0d8] text-[#4a4a45]"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-[#171916] font-mono">
                  {event.title}
                </span>
                <span className="text-[#829386] font-mono">
                  {new Date(event.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {event.description && (
                <p className="text-xs text-[#4a4a45] leading-relaxed mb-1.5 font-sans">
                  {event.description}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-[#829386] mt-1 pt-1.5 border-t border-[#e2e0d8] font-mono">
                <span>
                  Operator: <strong className="text-[#171916] font-semibold">{event.actorName}</strong> ({event.actorRole})
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
