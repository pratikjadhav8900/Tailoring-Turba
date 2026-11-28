"use client";

import React, { useState } from "react";
import { Check, Paperclip, Loader2, AlertCircle, FileText, ExternalLink } from "lucide-react";

interface CompleteLeadTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskId: string;
  taskTitle: string;
  taskType: string;
  existingAttachments: string[];
  /** POST multipart/form-data { file } -> { url } */
  uploadEndpoint: string;
  /** PATCH { status: "COMPLETED", completionNotes?, attachments? } */
  patchEndpoint: string;
}

function attachmentFileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.split("/").pop() || "attachment";
  } catch {
    return "attachment";
  }
}

export const CompleteLeadTaskModal: React.FC<CompleteLeadTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskTitle,
  taskType,
  existingAttachments,
  uploadEndpoint,
  patchEndpoint,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const attachmentRequired = taskType === "SEND_QUOTATION" && existingAttachments.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (attachmentRequired && !file) {
      setError("Please attach the quotation file before marking this task complete.");
      return;
    }

    setIsSubmitting(true);
    try {
      let attachments: string[] | undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(uploadEndpoint, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload file.");
        }
        attachments = [uploadData.url];
      }

      const res = await fetch(patchEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          completionNotes: notes.trim() || undefined,
          attachments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete task.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#ECEEF2] flex items-center justify-between shrink-0 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-bold text-[#111827]">Complete: {taskTitle}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {existingAttachments.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Already attached
              </span>
              {existingAttachments.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FB] border border-[#ECEEF2] text-[#374151] hover:text-[#FF6A39] hover:border-[#FFD9C7] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{attachmentFileName(url)}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1.5 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attach file{attachmentRequired ? "" : " (optional)"}</span>
              {attachmentRequired && (
                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
                  Required
                </span>
              )}
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-[#374151] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F4F6F9] file:text-[#374151] hover:file:bg-[#ECEEF2] border border-[#D1D5DB] rounded-xl px-2 py-1.5"
            />
            <p className="text-[10px] text-[#9CA3AF] mt-1">PDF, PNG, JPEG, or WebP — up to 15MB.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Completion notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the requester should know..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-[#ECEEF2]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Mark Complete</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
