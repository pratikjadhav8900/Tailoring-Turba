"use client";

import React, { useState } from "react";
import { Pin, Send, MessageSquare } from "lucide-react";
import type { OpsInternalOrderNote } from "@/types/ops";
import { OpsButton } from "../ui/OpsButton";

interface InternalNotesPanelProps {
  orderId: string;
  initialNotes?: OpsInternalOrderNote[];
}

export const InternalNotesPanel: React.FC<InternalNotesPanelProps> = ({
  orderId,
  initialNotes = [],
}) => {
  const [notes, setNotes] = useState<OpsInternalOrderNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ops/orders/${orderId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote.trim(), isPinned }),
      });

      if (res.ok) {
        const data = await res.json();
        // Prepending unconditionally used to jump an unpinned note above existing pinned
        // ones until the next reload — GET /api/ops/orders/[id]/notes orders by
        // [isPinned desc, createdAt desc], so keep that contract here too.
        setNotes((prev) =>
          [data.note, ...prev].sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
        );
        setNewNote("");
        setIsPinned(false);
      }
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Note input form */}
      <form onSubmit={handleAddNote} className="space-y-2.5">
        <textarea
          rows={3}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note (visible only to team)..."
          className="w-full bg-[#F8F9FA] border border-[#ECEEF2] focus:border-[#00A86B] focus:bg-white rounded-xl p-3 text-xs text-[#111827] placeholder:text-[#9CA3AF] outline-none resize-none transition-all font-sans"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-[#4B5563] cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded border-[#D1D5DB] text-[#00A86B] focus:ring-[#00A86B] focus:ring-offset-0 cursor-pointer"
            />
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            <span>Pin note to top</span>
          </label>
          <button
            type="submit"
            disabled={loading || !newNote.trim()}
            className="px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <Send className="w-3 h-3" />
            <span>Add Note</span>
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#6B7280] flex flex-col items-center gap-1.5 bg-[#F8F9FB] rounded-xl border border-[#ECEEF2]">
            <MessageSquare className="w-5 h-5 text-[#9CA3AF]" />
            <span className="font-medium">No internal notes yet.</span>
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-xl border text-xs shadow-xs transition-all ${
                n.isPinned
                  ? "bg-amber-50/70 border-amber-200 text-[#111827]"
                  : "bg-[#F8F9FB] border-[#ECEEF2] text-[#374151]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#6B7280]">
                <div className="flex items-center gap-1.5 font-bold text-[#111827] font-sans">
                  {n.isPinned && <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />}
                  <span>{n.employeeName}</span>
                </div>
                <span className="font-mono text-[10px] text-[#9CA3AF]">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-[#111827] font-sans">
                {n.note}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
