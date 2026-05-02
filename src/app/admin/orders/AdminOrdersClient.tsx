"use client";

import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import styles from "../page.module.css";

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

  const updateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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


  return (
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
            {orders.map((order) => {
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
                          <button
                            onClick={() => updateStatus(order.id, "SHIPPED")}
                            disabled={isUpdating === order.id}
                            style={{ padding: "4px 8px", background: "#f5f3ff", color: "#7c3aed", border: "1px solid #7c3aed40", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            Ship
                          </button>
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
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "var(--tth-text-muted)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📦</div>
                  <div style={{ fontWeight: 600, marginBottom: "6px" }}>No orders yet</div>
                  <div style={{ fontSize: "0.85rem" }}>Orders placed by customers will appear here.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

