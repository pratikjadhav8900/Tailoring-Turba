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
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          rows={3}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note (visible only to team)..."
          className="w-full bg-[#0b0d13] border border-[#1e2230] focus:border-amber-500 rounded p-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none resize-none transition-colors"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
            />
            <Pin className="w-3 h-3 text-amber-400" />
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
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 flex flex-col items-center gap-1">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <span>No internal notes yet.</span>
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded border text-xs ${
                n.isPinned
                  ? "bg-amber-500/[0.05] border-amber-500/30 text-slate-200"
                  : "bg-[#0b0d13] border-[#1e2230] text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  {n.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  <span>{n.employeeName}</span>
                </div>
                <span>
                  {new Date(n.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
                {n.note}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
