"use client";

import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { CrmLeadTag } from "@/types/crm";

interface Props {
  leadId: string;
  assignedTags: { tag: CrmLeadTag }[];
  onChange: () => void;
}

export const LeadTagEditor: React.FC<Props> = ({ leadId, assignedTags, onChange }) => {
  const [allTags, setAllTags] = useState<CrmLeadTag[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const loadTags = () => {
    fetch("/api/crm/tags")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAllTags(d.tags || []));
  };

  useEffect(() => {
    loadTags();
  }, []);

  const assignedIds = new Set(assignedTags.map((a) => a.tag.id));
  const availableTags = allTags.filter((t) => !assignedIds.has(t.id));

  const addTag = async (tagId: string) => {
    const res = await fetch(`/api/crm/leads/${leadId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    if (!res.ok) {
      toast.error("Failed to add tag");
      return;
    }
    setAdding(false);
    onChange();
  };

  const createAndAddTag = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch("/api/crm/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName.trim() }),
    });
    if (!res.ok) {
      toast.error("Failed to create tag");
      return;
    }
    const data = await res.json();
    setNewTagName("");
    loadTags();
    await addTag(data.tag.id);
  };

  const removeTag = async (tagId: string) => {
    const res = await fetch(`/api/crm/leads/${leadId}/tags?tagId=${tagId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to remove tag");
      return;
    }
    onChange();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assignedTags.map(({ tag }) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: `${tag.color || "#FF6A39"}1A`, color: tag.color || "#FF6A39" }}
        >
          {tag.name}
          <button onClick={() => removeTag(tag.id)} className="hover:opacity-70">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#9CA3AF] border border-dashed border-[#D1D5DB] hover:border-[#FF6A39] hover:text-[#FF6A39]"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addTag(tag.id)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#E5E8ED] text-[#6B7280] hover:border-[#FF6A39] hover:text-[#FF6A39]"
            >
              {tag.name}
            </button>
          ))}
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createAndAddTag())}
            placeholder="New tag..."
            className="w-24 px-2 py-1 rounded-full text-[11px] border border-[#D1D5DB] outline-none focus:border-[#FF6A39]"
          />
          <button onClick={() => setAdding(false)} className="text-[#9CA3AF] hover:text-[#111827]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
