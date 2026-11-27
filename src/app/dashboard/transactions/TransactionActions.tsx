"use client";
import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Row = {
  id: string;
  orderNumber: number | null;
  createdAt: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
};

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export function InvoiceButton({ orderId, orderNumber, className }: { orderId: string; orderNumber: number | null; className?: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadBlob(`/api/orders/${orderId}/invoice`, `Invoice-${orderNumber ?? orderId.slice(-8)}.pdf`);
    } catch {
      toast.error("Couldn't download the invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <button className={className} onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : "Invoice"}
    </button>
  );
}

export function ExportCsvButton({ rows, className, children }: { rows: Row[]; className?: string; children?: ReactNode }) {
  const handleExport = () => {
    const header = ["Date", "Order #", "Reference ID", "Status", "Total Amount (INR)", "Amount Paid (INR)", "Balance Due (INR)"];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          new Date(r.createdAt).toLocaleDateString("en-IN"),
          r.orderNumber ?? "",
          r.id.slice(-8).toUpperCase(),
          r.status,
          r.totalAmount,
          r.amountPaid,
          r.remainingAmount,
        ].map(escape).join(",")
      ),
    ];
    // Leading BOM so Excel opens the UTF-8 file (₹ etc.) correctly instead of mangling it.
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tailoring-turba-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <button className={className} onClick={handleExport}>
      {children ?? "Export CSV"}
    </button>
  );
}
