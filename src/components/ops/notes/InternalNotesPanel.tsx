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
        setNotes((prev) => [data.note, ...prev]);
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
          className="w-full bg-[#FAF9F5] border border-[#e2e0d8] focus:border-[#294238] focus:bg-white focus:ring-1 focus:ring-[#294238]/20 rounded p-3 text-xs text-[#171916] placeholder:text-[#829386] outline-none resize-none transition-all font-sans"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-[#4a4a45] cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded bg-[#FAF9F5] border-[#c8c5bc] text-[#294238] focus:ring-0"
            />
            <Pin className="w-3.5 h-3.5 text-[#c49d32]" />
            <span>Pin note to top</span>
          </label>
          <OpsButton
            type="submit"
            size="sm"
            variant="primary"
            isLoading={loading}
            rightIcon={<Send className="w-3 h-3" />}
          >
            Add Note
          </OpsButton>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#829386] flex flex-col items-center gap-1.5 bg-[#FAF9F5] rounded border border-[#e2e0d8]">
            <MessageSquare className="w-5 h-5 text-[#829386]/60" />
            <span className="font-medium">No internal notes yet.</span>
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded border text-xs shadow-xs transition-all ${
                n.isPinned
                  ? "bg-[#c49d32]/10 border-[#c49d32]/40 text-[#171916]"
                  : "bg-[#FAF9F5] border-[#e2e0d8] text-[#4a4a45]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#829386]">
                <div className="flex items-center gap-1.5 font-bold text-[#171916] font-mono">
                  {n.isPinned && <Pin className="w-3 h-3 text-[#c49d32] fill-[#c49d32]" />}
                  <span>{n.employeeName}</span>
                </div>
                <span className="font-mono">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-[#171916] font-sans">
                {n.note}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
