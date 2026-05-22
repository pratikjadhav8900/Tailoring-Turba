"use client";

import { useState } from "react";
import { RefreshCw, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ResendInvoiceButton({ orderId }: { orderId: string }) {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedType, setSelectedType] = useState<"proforma" | "tax">("proforma");

  const resendInvoice = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-invoice?type=${selectedType}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, message: data.error || "Failed to resend invoice" });
      }
    } catch (err) {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-[#435b43]" />
        <h2 className="text-xl font-semibold">Resend Invoice</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Re-generate and email the invoice to the customer using the latest template.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as "proforma" | "tax")}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#435b43] focus:border-transparent"
        >
          <option value="proforma">Pro Forma Invoice</option>
          <option value="tax">Tax Invoice</option>
        </select>

        <button
          onClick={resendInvoice}
          disabled={isSending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#435b43] text-white rounded-lg text-sm font-bold hover:bg-[#2d3d2d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Regenerate & Send
            </>
          )}
        </button>
      </div>

      {result && (
        <div
          className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
            result.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {result.message}
        </div>
      )}
    </div>
  );
}
