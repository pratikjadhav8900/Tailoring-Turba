"use client";

import { useState } from "react";
import { Loader2, ExternalLink, Download, Calendar, MessageSquare, PhoneCall, Check } from "lucide-react";
import Link from "next/link";
import styles from "../page.module.css";
import toast from "react-hot-toast";

type Lead = any;

export default function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const updateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setLeads(leads.filter(l => l.id !== orderId));
        toast.success(`Checkout successfully marked as ${newStatus}!`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!startDate && !endDate) return true;
    const leadDate = new Date(lead.createdAt).getTime();
    const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : -Infinity;
    const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
    return leadDate >= start && leadDate <= end;
  });

  const exportToCSV = () => {
    const headers = ["Attempt Date", "Customer Name", "Email", "Phone", "Items Summary", "Total Value", "Shipping Address"];
    const rows = filteredLeads.map(l => {
      const itemsText = (l.items || [])
        .map((i: any) => `${i.quantity}x ${i.product?.name || "Apparel"}`)
        .join(" | ");
      
      const addr = l.shippingAddress 
        ? `"${l.shippingAddress.street}, ${l.shippingAddress.city}, ${l.shippingAddress.state} - ${l.shippingAddress.postalCode}"`
        : "N/A";

      return [
        new Date(l.createdAt).toLocaleDateString("en-IN") + " " + new Date(l.createdAt).toLocaleTimeString("en-IN"),
        `"${(l.user?.name || "Guest").replace(/"/g, '""')}"`,
        l.user?.email || "",
        l.user?.phone || "",
        `"${itemsText.replace(/"/g, '""')}"`,
        l.totalAmount,
        addr
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Tailoring_Turba_Abandoned_Checkouts_${startDate || 'all'}_to_${endDate || 'now'}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getWhatsAppLink = (phone: string, customerName: string, totalAmount: number, items: any[]) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const phoneWithCountry = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const itemsSummary = (items || []).map((i: any) => `${i.quantity}x ${i.product?.name}`).join(", ");
    
    const message = `Hello ${customerName || "there"}, we noticed you initiated a checkout for ${itemsSummary} (Total: ₹${totalAmount.toLocaleString()}) on Tailoring Turba but couldn't complete the payment. Would you like us to assist you with completing your order?`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Filter & Export Bar */}
      <div style={{ 
        background: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} color="#64748b" />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Filter Leads:</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
            />
            <span style={{ color: "#94a3b8" }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(""); setEndDate(""); }}
                style={{ fontSize: "0.8rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={exportToCSV}
          disabled={filteredLeads.length === 0}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            padding: "10px 20px", 
            background: "#435b43", 
            color: "white", 
            borderRadius: "8px", 
            border: "none", 
            fontSize: "0.85rem", 
            fontWeight: 700, 
            cursor: filteredLeads.length === 0 ? "not-allowed" : "pointer",
            opacity: filteredLeads.length === 0 ? 0.5 : 1
          }}
        >
          <Download size={18} />
          Export Leads to Excel/CSV
        </button>
      </div>

      {/* Grid Sheet */}
      <div className={styles.tableBlock}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "15%" }}>Attempt Date</th>
                <th style={{ width: "20%" }}>Customer Detail</th>
                <th style={{ width: "15%" }}>Contact Actions</th>
                <th style={{ width: "20%" }}>Items Attempted</th>
                <th style={{ width: "12%" }}>Total Value</th>
                <th style={{ width: "20%" }}>Shipping Address</th>
                <th style={{ width: "13%" }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const customerName = lead.user?.name || "Guest";
                return (
                  <tr key={lead.id}>
                    {/* 1. Date */}
                    <td className={styles.date}>
                      <div style={{ fontWeight: 600 }}>{new Date(lead.createdAt).toLocaleDateString("en-IN")}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                        {new Date(lead.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* 2. Customer details */}
                    <td>
                      <div className={styles.customerName} style={{ fontWeight: 700 }}>{customerName}</div>
                      <div className={styles.customerEmail} style={{ fontSize: "0.8rem", color: "#64748b" }}>{lead.user?.email}</div>
                    </td>

                    {/* 3. Contact Actions */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {lead.user?.phone ? (
                          <>
                            {/* Click to Call */}
                            <a 
                              href={`tel:${lead.user.phone}`}
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                textDecoration: "none", 
                                color: "#2563eb", 
                                fontSize: "0.8rem", 
                                fontWeight: 600 
                              }}
                            >
                              <PhoneCall size={13} />
                              Call: {lead.user.phone}
                            </a>

                            {/* WhatsApp Direct Message */}
                            <a 
                              href={getWhatsAppLink(lead.user.phone, customerName, lead.totalAmount, lead.items)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "6px", 
                                textDecoration: "none", 
                                color: "#16a34a", 
                                fontSize: "0.8rem", 
                                fontWeight: 600 
                              }}
                            >
                              <MessageSquare size={13} />
                              WhatsApp Client
                            </a>
                          </>
                        ) : (
                          <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic" }}>
                            No Phone Provided
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Items */}
                    <td style={{ fontSize: "0.82rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(lead.items || []).map((i: any) => (
                          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                            <span style={{ color: "#475569" }}>
                              {i.quantity}x <strong>{i.product?.name || "Apparel"}</strong>
                            </span>
                            {i.customStateJson && (
                              <span style={{ color: "#7c3aed", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                [Custom]
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* 5. Total */}
                    <td className={styles.amount} style={{ fontWeight: 800 }}>
                      ₹{lead.totalAmount.toLocaleString("en-IN")}
                    </td>

                    {/* 6. Shipping Address */}
                    <td style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                      {lead.shippingAddress ? (
                        <div>
                          <div>{lead.shippingAddress.name}</div>
                          <div>{lead.shippingAddress.street}</div>
                          <div>{lead.shippingAddress.city}, {lead.shippingAddress.state} - {lead.shippingAddress.postalCode}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No Address Filled</span>
                      )}
                    </td>

                    {/* 7. Admin Actions */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <Link
                          href={`/admin/orders/${lead.id}`}
                          title="View mockups, assets, and design sheets"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            background: "#435b43",
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            width: "fit-content"
                          }}
                        >
                          <ExternalLink size={11} />
                          Details
                        </Link>
                        
                        {/* Mark manually as paid/recovered. PENDING's only valid next
                            states are CONFIRMED/CANCELLED (src/lib/order-state.ts) — this
                            used to send PROCESSING, which is unreachable from PENDING and
                            always 422'd with no explanation. */}
                        <button
                          onClick={() => updateStatus(lead.id, "CONFIRMED")}
                          disabled={isUpdating === lead.id}
                          title="Mark order as paid manually (e.g. cash or direct bank transfer)"
                          style={{ 
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px", 
                            background: "#f0fdf4", 
                            color: "#16a34a", 
                            border: "1px solid #16a34a40", 
                            borderRadius: "6px", 
                            fontSize: "0.72rem", 
                            fontWeight: 700, 
                            cursor: "pointer",
                            width: "fit-content"
                          }}
                        >
                          {isUpdating === lead.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Check size={11} />
                          )}
                          Mark Paid
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🎉</div>
                    <div style={{ fontWeight: 600, marginBottom: "6px" }}>No abandoned checkouts found!</div>
                    <div style={{ fontSize: "0.85rem" }}>All checkouts have been completed or cleared.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
