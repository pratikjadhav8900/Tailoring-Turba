import React from "react";
import {
  Clock,
  CheckCircle2,
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
      <div className="text-center py-6 text-xs text-slate-500">
        No recorded activity yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "OPS_STAGE_REWORK_FLAGGED":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case "OPS_STAGE_TRANSITION":
      case "OPS_STAGE_OVERRIDDEN":
        return <ArrowRight className="w-3.5 h-3.5 text-amber-400" />;
      case "OPS_INTERNAL_NOTE_ADDED":
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case "DISPATCHED":
      case "SHIPMENT_BOOKED":
        return <Truck className="w-3.5 h-3.5 text-emerald-400" />;
      case "OPS_ORDER_CREATED":
        return <PlusCircle className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1e2230]">
      {events.map((event) => {
        const isRework = event.eventType === "OPS_STAGE_REWORK_FLAGGED";

        return (
          <div key={event.id} className="relative group text-xs">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border ${
                isRework
                  ? "bg-red-500/10 border-red-500/40"
                  : "bg-[#11131a] border-[#2a3044]"
              }`}
            >
              {getEventIcon(event.eventType)}
            </div>

            {/* Content Card */}
            <div
              className={`p-2.5 rounded border ${
                isRework
                  ? "bg-red-500/[0.05] border-red-500/30 text-red-200"
                  : "bg-[#0b0d13] border-[#1e2230] text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-100">
                  {event.title}
                </span>
                <span className="text-slate-500">
                  {new Date(event.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {event.description && (
                <p className="text-xs text-slate-300 leading-relaxed mb-1.5">
                  {event.description}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-white/[0.04]">
                <span>
                  Actor: <strong className="text-slate-400 font-medium">{event.actorName}</strong> ({event.actorRole})
                </span>
                {event.metadata && typeof event.metadata === "object" && (
                  <span className="font-mono text-slate-400">
                    {Object.keys(event.metadata).length > 0 &&
                      "metadata recorded"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
