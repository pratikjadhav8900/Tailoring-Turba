"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Mail, Building2, Package, MoreVertical, ExternalLink } from "lucide-react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  quantity: number;
  requirements: string;
  status: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "#fef2f2", text: "#dc2626" },
  CONTACTED: { bg: "#fff7ed", text: "#ea580c" },
  QUOTED: { bg: "#eff6ff", text: "#2563eb" },
  SAMPLE_SENT: { bg: "#f5f3ff", text: "#7c3aed" },
  CONVERTED: { bg: "#ecfdf5", text: "#059669" },
  CLOSED: { bg: "#f8fafc", text: "#64748b" },
};

export default function InquiryTable({ initialInquiries }: { initialInquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setInquiries(prev => 
          prev.map(iq => iq.id === id ? { ...iq, status: newStatus } : iq)
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Customer</th>
            <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Requirements</th>
            <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Date</th>
            <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Status</th>
            <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                No inquiries found yet.
              </td>
            </tr>
          ) : (
            inquiries.map(iq => (
              <tr key={iq.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={e => (e.currentTarget.style.background = "#fcfcfd")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "20px 24px" }}>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{iq.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    <Mail size={12} /> {iq.email}
                  </div>
                  {iq.companyName && (
                    <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <Building2 size={12} /> {iq.companyName}
                    </div>
                  )}
                </td>
                <td style={{ padding: "20px 24px", maxWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--tth-olive-dark)", fontWeight: 700, marginBottom: "4px" }}>
                    <Package size={14} /> {iq.quantity} units
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {iq.requirements}
                  </div>
                </td>
                <td style={{ padding: "20px 24px", fontSize: "0.85rem", color: "#64748b" }}>
                  {format(new Date(iq.createdAt), "MMM d, yyyy")}
                </td>
                <td style={{ padding: "20px 24px" }}>
                  <span style={{ 
                    padding: "4px 10px", 
                    borderRadius: "999px", 
                    fontSize: "0.7rem", 
                    fontWeight: 700, 
                    background: STATUS_COLORS[iq.status]?.bg || "#f1f5f9", 
                    color: STATUS_COLORS[iq.status]?.text || "#64748b" 
                  }}>
                    {iq.status}
                  </span>
                </td>
                <td style={{ padding: "20px 24px" }}>
                  <select 
                    value={iq.status} 
                    disabled={updatingId === iq.id}
                    onChange={(e) => updateStatus(iq.id, e.target.value)}
                    style={{ 
                      padding: "6px 10px", 
                      borderRadius: "6px", 
                      border: "1px solid #e2e8f0", 
                      fontSize: "0.8rem", 
                      background: "white", 
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    {Object.keys(STATUS_COLORS).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
