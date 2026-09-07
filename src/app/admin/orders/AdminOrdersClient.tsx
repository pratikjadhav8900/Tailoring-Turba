"use client";

import { useState } from "react";
import { Loader2, ExternalLink, Download, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import styles from "../page.module.css";
import BigShipShipmentModal from "./BigShipShipmentModal";
import LocalShipmentModal from "./LocalShipmentModal";
import toast from "react-hot-toast";

type Order = any;

const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING:       { bg: "#fffbeb", color: "#d97706" },
  CONFIRMED:     { bg: "#e0f2fe", color: "#0369a1" },
  PROCESSING:    { bg: "#eff6ff", color: "#2563eb" },
  IN_PRODUCTION: { bg: "#fef3c7", color: "#b45309" },
  QUALITY_CHECK: { bg: "#f3e8ff", color: "#7e22ce" },
  READY_TO_SHIP: { bg: "#ffedd5", color: "#c2410c" },
  DISPATCHED:    { bg: "#e0e7ff", color: "#4338ca" },
  SHIPPED:       { bg: "#f5f3ff", color: "#7c3aed" },
  DELIVERED:     { bg: "#f0fdf4", color: "#16a34a" },
  CANCELLED:     { bg: "#fef2f2", color: "#dc2626" },
};

export default function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedForBigShip, setSelectedForBigShip] = useState<Order | null>(null);
  const [selectedForLocalShip, setSelectedForLocalShip] = useState<any>(null);
  const [resendingInvoice, setResendingInvoice] = useState<string | null>(null);

  // Dispatch Gating Override State
  const [dispatchGatedState, setDispatchGatedState] = useState<{
    orderId: string;
    targetStatus: string;
    balanceDueRupees: number;
    extraPayload?: any;
  } | null>(null);
  const [overrideReasonInput, setOverrideReasonInput] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const resendInvoice = async (orderId: string) => {
    setResendingInvoice(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-invoice?type=proforma`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Invoice resent successfully");
      } else {
        toast.error(data.error || "Failed to resend invoice");
      }
    } catch {
      toast.error("Network error. Please try again.");
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

      const data = await res.json();

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success(`Status updated to ${newStatus}`);
        setDispatchGatedState(null);
        setOverrideReasonInput("");
      } else if (data.dispatchGated) {
        const balanceDueRupees = Math.round((data.balanceDuePaise || 0) / 100);
        setDispatchGatedState({
          orderId,
          targetStatus: newStatus,
          balanceDueRupees,
          extraPayload,
        });
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsUpdating(null);
      setIsSubmittingOverride(false);
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

                        {order.remainingAmount > 0 && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            background: "#fffbeb",
                            color: "#b45309",
                            border: "1px solid #fde68a",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            width: "fit-content"
                          }}>
                            🔒 Bal: ₹{order.remainingAmount.toLocaleString()}
                          </span>
                        )}
                        
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {order.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(order.id, "CONFIRMED")}
                                disabled={isUpdating === order.id}
                                style={{ padding: "4px 8px", background: "#e0f2fe", color: "#0369a1", border: "1px solid #0369a140", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => updateStatus(order.id, "CANCELLED")}
                                disabled={isUpdating === order.id}
                                style={{ padding: "4px 8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #dc262640", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {order.status === "CONFIRMED" && (
                            <button
                              onClick={() => updateStatus(order.id, "IN_PRODUCTION")}
                              disabled={isUpdating === order.id}
                              style={{ padding: "4px 8px", background: "#fef3c7", color: "#b45309", border: "1px solid #b4530940", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              Start Production
                            </button>
                          )}
                          {order.status === "PROCESSING" && (
                            <>
                              <button
                                onClick={() => updateStatus(order.id, "READY_TO_SHIP")}
                                disabled={isUpdating === order.id}
                                style={{ padding: "4px 8px", background: "#ffedd5", color: "#c2410c", border: "1px solid #c2410c40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Ready to Ship
                              </button>
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
                          {order.status === "IN_PRODUCTION" && (
                            <>
                              <button
                                onClick={() => updateStatus(order.id, "QUALITY_CHECK")}
                                disabled={isUpdating === order.id}
                                style={{ padding: "4px 8px", background: "#f3e8ff", color: "#7e22ce", border: "1px solid #7e22ce40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                QC
                              </button>
                              <button
                                onClick={() => updateStatus(order.id, "READY_TO_SHIP")}
                                disabled={isUpdating === order.id}
                                style={{ padding: "4px 8px", background: "#ffedd5", color: "#c2410c", border: "1px solid #c2410c40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Ready to Ship
                              </button>
                            </>
                          )}
                          {order.status === "QUALITY_CHECK" && (
                            <button
                              onClick={() => updateStatus(order.id, "READY_TO_SHIP")}
                              disabled={isUpdating === order.id}
                              style={{ padding: "4px 8px", background: "#ffedd5", color: "#c2410c", border: "1px solid #c2410c40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              Pass QC & Ready
                            </button>
                          )}
                          {order.status === "READY_TO_SHIP" && (
                            <>
                              <button
                                onClick={() => setSelectedForLocalShip(order)}
                                style={{ padding: "4px 8px", background: "#f5f3ff", color: "#7c3aed", border: "1px solid #7c3aed40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Local Dispatch
                              </button>
                              <button
                                onClick={() => setSelectedForBigShip(order)}
                                style={{ padding: "4px 8px", background: "#fdf4ff", color: "#a21caf", border: "1px solid #a21caf40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                BigShip
                              </button>
                              <button
                                onClick={() => updateStatus(order.id, "DISPATCHED")}
                                disabled={isUpdating === order.id}
                                style={{ padding: "4px 8px", background: "#e0e7ff", color: "#4338ca", border: "1px solid #4338ca40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Dispatch
                              </button>
                            </>
                          )}
                          {(order.status === "SHIPPED" || order.status === "DISPATCHED") && (
                            <button
                              onClick={() => updateStatus(order.id, "DELIVERED")}
                              disabled={isUpdating === order.id}
                              style={{ padding: "4px 8px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #16a34a40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              Deliver
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
            toast.success(`Shipment booked successfully! Tracking ID: ${trackingId}`);
          }}
        />
      )}

      {selectedForLocalShip && (
        <LocalShipmentModal
          order={selectedForLocalShip}
          onClose={() => setSelectedForLocalShip(null)}
          onSubmit={async (courierName, trackingId, overrideReason) => {
            await updateStatus(selectedForLocalShip.id, "SHIPPED", {
              bigshipCourierName: courierName || undefined,
              bigshipTrackingId: trackingId || undefined,
              overrideConfirmed: overrideReason ? true : undefined,
              overrideReason: overrideReason || undefined,
            });
            setSelectedForLocalShip(null);
          }}
        />
      )}

      {dispatchGatedState && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "460px",
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0", background: "#fffbeb" }}>
              <h3 style={{ margin: 0, color: "#92400e", fontSize: "1.1rem", fontWeight: 700 }}>
                ⚠️ Dispatch Gating: Unpaid Balance
              </h3>
              <p style={{ margin: "6px 0 0 0", color: "#78350f", fontSize: "0.85rem" }}>
                This order has an unpaid balance of <strong>₹{dispatchGatedState.balanceDueRupees.toLocaleString('en-IN')}</strong>. 
                Dispatches without full settlement require an audited executive override.
              </p>
            </div>
            <div style={{ padding: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Audited Override Reason (Required):
              </label>
              <textarea
                placeholder="e.g. Approved by Finance: payment received via offline NEFT transfer ref #..."
                value={overrideReasonInput}
                onChange={(e) => setOverrideReasonInput(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  fontFamily: "inherit"
                }}
              />
            </div>
            <div style={{ padding: "16px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setDispatchGatedState(null);
                  setOverrideReasonInput("");
                }}
                disabled={isSubmittingOverride}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingOverride || overrideReasonInput.trim().length < 5}
                onClick={async () => {
                  if (!overrideReasonInput.trim()) return;
                  setIsSubmittingOverride(true);
                  await updateStatus(dispatchGatedState.orderId, dispatchGatedState.targetStatus, {
                    ...dispatchGatedState.extraPayload,
                    overrideConfirmed: true,
                    overrideReason: overrideReasonInput.trim(),
                  });
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#b45309",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: (isSubmittingOverride || overrideReasonInput.trim().length < 5) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: (isSubmittingOverride || overrideReasonInput.trim().length < 5) ? 0.6 : 1,
                }}
              >
                {isSubmittingOverride && <Loader2 size={16} className="animate-spin" />}
                Confirm Audited Override & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
