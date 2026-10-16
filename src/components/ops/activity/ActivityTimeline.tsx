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
      <div className="text-center py-6 text-xs text-[#6B7280] bg-[#F8F9FB] rounded-xl border border-[#ECEEF2] font-sans">
        No recorded activity yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "OPS_STAGE_REWORK_FLAGGED":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
      case "OPS_STAGE_TRANSITION":
      case "OPS_STAGE_OVERRIDDEN":
        return <ArrowRight className="w-3.5 h-3.5 text-[#00A86B]" />;
      case "OPS_INTERNAL_NOTE_ADDED":
        return <FileText className="w-3.5 h-3.5 text-amber-500" />;
      case "DISPATCHED":
      case "SHIPMENT_BOOKED":
        return <Truck className="w-3.5 h-3.5 text-[#00A86B]" />;
      case "OPS_ORDER_CREATED":
        return <PlusCircle className="w-3.5 h-3.5 text-[#00A86B]" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#6B7280]" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ECEEF2]">
      {events.map((event) => {
        const isRework = event.eventType === "OPS_STAGE_REWORK_FLAGGED";

        return (
          <div key={event.id} className="relative group text-xs">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border shadow-xs ${
                isRework
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-[#ECEEF2]"
              }`}
            >
              {getEventIcon(event.eventType)}
            </div>

            {/* Content Card */}
            <div
              className={`p-3 rounded-xl border shadow-xs transition-all ${
                isRework
                  ? "bg-red-50/60 border-red-200 text-red-900"
                  : "bg-[#F8F9FB] border-[#ECEEF2] text-[#374151]"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-[#111827] font-sans">
                  {event.title}
                </span>
                <span className="text-[#9CA3AF] font-mono text-[10px]">
                  {new Date(event.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {event.description && (
                <p className="text-xs text-[#4B5563] leading-relaxed mb-1.5 font-sans">
                  {event.description}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-[#6B7280] mt-1 pt-1.5 border-t border-[#ECEEF2] font-sans">
                <span>
                  Operator: <strong className="text-[#111827] font-semibold">{event.actorName}</strong> ({event.actorRole})
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
