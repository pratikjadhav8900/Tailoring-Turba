"use client";

import { useState } from "react";
import { Loader2, ExternalLink, Download, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import styles from "../page.module.css";
import BigShipShipmentModal from "./BigShipShipmentModal";
import LocalShipmentModal from "./LocalShipmentModal";

type Order = any;

const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: "#fffbeb", color: "#d97706" },
  PROCESSING: { bg: "#eff6ff", color: "#2563eb" },
  SHIPPED:    { bg: "#f5f3ff", color: "#7c3aed" },
  DELIVERED:  { bg: "#f0fdf4", color: "#16a34a" },
  CANCELLED:  { bg: "#fef2f2", color: "#dc2626" },
};

export default function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedForBigShip, setSelectedForBigShip] = useState<Order | null>(null);
  const [selectedForLocalShip, setSelectedForLocalShip] = useState<any>(null);
  const [resendingInvoice, setResendingInvoice] = useState<string | null>(null);

  const resendInvoice = async (orderId: string) => {
    setResendingInvoice(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-invoice?type=proforma`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ ${data.error || "Failed to resend invoice"}`);
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setResendingInvoice(null);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string, extraPayload: any = {}) => {
    setIsUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraPayload }),
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!startDate && !endDate) return true;
    const orderDate = new Date(order.createdAt).getTime();
    const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : -Infinity;
    const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
    return orderDate >= start && orderDate <= end;
  });

  const exportToCSV = () => {
    const headers = ["Order No", "Customer Name", "Email", "Phone", "Total Amount", "Status", "Date", "Items"];
    const rows = filteredOrders.map(o => [
      o.orderNumber || o.id,
      `"${(o.user?.name || "Guest").replace(/"/g, '""')}"`,
      o.user?.email || "",
      o.user?.phone || "",
      o.totalAmount,
      o.status,
      new Date(o.createdAt).toLocaleDateString("en-IN"),
      o.items?.length || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Tailoring_Turba_Orders_${startDate || 'all'}_to_${endDate || 'now'}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Filter Orders:</span>
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
          disabled={filteredOrders.length === 0}
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
            cursor: filteredOrders.length === 0 ? "not-allowed" : "pointer",
            opacity: filteredOrders.length === 0 ? 0.5 : 1
          }}
        >
          <Download size={18} />
          Export Orders to CSV
        </button>
      </div>

      <div className={styles.tableBlock}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const cfg = statusColors[order.status] || statusColors.PENDING;
                return (
                  <tr key={order.id}>
                    <td>
                      <span className={styles.mono} style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "bold" }}>
                        #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className={styles.customerName}>{order.user?.name || "Guest"}</div>
                      <div className={styles.customerEmail}>{order.user?.email}</div>
                      {order.user?.phone && (
                        <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600, marginTop: "2px" }}>
                          📞 {order.user.phone}
                        </div>
                      )}
                      {order.feedback && (
                        <div style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px", 
                          fontSize: "0.72rem", 
                          background: "#f0fdf4", 
                          color: "#16a34a", 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          fontWeight: 600,
                          marginTop: "6px",
                          border: "1px solid #16a34a30"
                        }}>
                          ★ Reviewed: {(
                            (order.feedback.serviceOverall +
                              order.feedback.serviceProfessionalism +
                              order.feedback.serviceTimeline +
                              order.feedback.easeOrdering +
                              order.feedback.easeCommunication +
                              order.feedback.easeProcess +
                              order.feedback.fabricQuality +
                              order.feedback.fabricExpectations +
                              order.feedback.fabricStitching +
                              order.feedback.printingLogo +
                              order.feedback.printingAccuracy) /
                            11
                          ).toFixed(1)}/5
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--tth-text-muted)" }}>
                      {order.items?.length ?? 0} item(s)
                    </td>
                    <td className={styles.amount}>₹{order.totalAmount.toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ 
                          fontSize: "0.7rem", 
                          fontWeight: 800, 
                          padding: "4px 10px", 
                          borderRadius: "20px", 
                          background: cfg.bg, 
                          color: cfg.color,
                          width: "fit-content",
                          letterSpacing: "0.05em"
                        }}>
                          {order.status}
                        </span>
                        
                        <div style={{ display: "flex", gap: "4px" }}>
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => updateStatus(order.id, "PROCESSING")}
                              disabled={isUpdating === order.id}
                              style={{ padding: "4px 8px", background: "#eff6ff", color: "#2563eb", border: "1px solid #2563eb40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              Process
                            </button>
                          )}
                          {order.status === "PROCESSING" && (
                            <>
                              <button
                                onClick={() => setSelectedForLocalShip(order)}
                                style={{ padding: "4px 8px", background: "#f5f3ff", color: "#7c3aed", border: "1px solid #7c3aed40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Ship
                              </button>
                              <button
                                onClick={() => setSelectedForBigShip(order)}
                                style={{ padding: "4px 8px", background: "#fdf4ff", color: "#a21caf", border: "1px solid #a21caf40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                BigShip
                              </button>
                            </>
                          )}
                          {order.status === "SHIPPED" && (
                            <button
                              onClick={() => updateStatus(order.id, "DELIVERED")}
                              disabled={isUpdating === order.id}
                              style={{ padding: "4px 8px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #16a34a40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              Deliver
                            </button>
                          )}
                          {(order.status === "PENDING" || order.status === "PROCESSING") && (
                            <button
                              onClick={() => updateStatus(order.id, "CANCELLED")}
                              disabled={isUpdating === order.id}
                              style={{ padding: "4px 8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #dc262640", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                          )}
                          {isUpdating === order.id && <Loader2 size={12} className="animate-spin" />}
                        </div>
                      </div>
                    </td>
                    <td className={styles.date}>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          title="View Full Order & Download Assets"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                            background: "#435b43",
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={13} />
                          Details
                        </Link>
                        <button
                          onClick={() => resendInvoice(order.id)}
                          disabled={resendingInvoice === order.id}
                          title="Re-generate & resend invoice with new template"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #2563eb40",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: resendingInvoice === order.id ? "not-allowed" : "pointer",
                            opacity: resendingInvoice === order.id ? 0.6 : 1,
                          }}
                        >
                          {resendingInvoice === order.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RefreshCw size={13} />
                          )}
                          Resend
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "var(--tth-text-muted)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📦</div>
                    <div style={{ fontWeight: 600, marginBottom: "6px" }}>No orders found</div>
                    <div style={{ fontSize: "0.85rem" }}>Try adjusting your filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      
      {selectedForBigShip && (
        <BigShipShipmentModal 
          order={selectedForBigShip} 
          onClose={() => setSelectedForBigShip(null)}
          onSuccess={(trackingId) => {
            setOrders(orders.map(o => o.id === selectedForBigShip.id ? { ...o, status: "SHIPPED", bigshipTrackingId: trackingId } : o));
            setSelectedForBigShip(null);
            alert(`Shipment booked successfully! Tracking ID: ${trackingId}`);
          }}
        />
      )}

      {selectedForLocalShip && (
        <LocalShipmentModal
          order={selectedForLocalShip}
          onClose={() => setSelectedForLocalShip(null)}
          onSubmit={async (courierName, trackingId) => {
            await updateStatus(selectedForLocalShip.id, "SHIPPED", {
              bigshipCourierName: courierName || undefined,
              bigshipTrackingId: trackingId || undefined
            });
            setSelectedForLocalShip(null);
          }}
        />
      )}
    </div>
  );
}
