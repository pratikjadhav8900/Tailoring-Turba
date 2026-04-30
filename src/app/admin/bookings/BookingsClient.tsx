"use client";

import { useState, useTransition } from "react";
import { Calendar, Clock, CheckCheck, Ban, Check } from "lucide-react";
import styles from "../page.module.css";

type Booking = {
  id: string;
  status: string;
  date: string;
  timeSlot: string;
  notes: string | null;
  user: { name: string | null; email: string };
};

export default function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateStatus = (bookingId: string, newStatus: string) => {
    setLoadingId(bookingId);
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
        );
      }
      setLoadingId(null);
    });
  };

  const statusConfig: Record<string, { bg: string; color: string }> = {
    REQUESTED:  { bg: "#fffbeb", color: "#d97706" },
    CONFIRMED:  { bg: "rgba(74, 92, 63, 0.1)", color: "#435b43" },
    COMPLETED:  { bg: "rgba(16, 185, 129, 0.1)", color: "#059669" },
    CANCELLED:  { bg: "#fef2f2", color: "#dc2626" },
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tailoring Visits</h1>
          <p className={styles.sub}>Manage customer bookings and consultations.</p>
        </div>
      </div>

      <div className={styles.tableBlock}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const cfg = statusConfig[booking.status] || statusConfig.REQUESTED;
                const isLoading = loadingId === booking.id;

                return (
                  <tr key={booking.id}>
                    <td>
                      <div className={styles.customerName}>{booking.user.name || "Guest"}</div>
                      <div className={styles.customerEmail}>{booking.user.email}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Calendar size={14} color="var(--tth-text-muted)" />
                        {new Date(booking.date).toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={14} color="var(--tth-text-muted)" />
                        {booking.timeSlot}
                      </div>
                    </td>
                    <td style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.85rem", color: "var(--tth-text-muted)" }}>
                      {booking.notes || "—"}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "4px 8px", borderRadius: "4px", background: cfg.bg, color: cfg.color }}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {booking.status === "REQUESTED" && (
                          <button
                            onClick={() => updateStatus(booking.id, "CONFIRMED")}
                            disabled={isLoading}
                            title="Confirm Appointment"
                            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: "#435b43", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, opacity: isLoading ? 0.6 : 1 }}
                          >
                            <Check size={13} /> Confirm
                          </button>
                        )}
                        {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && (
                          <button
                            onClick={() => updateStatus(booking.id, "COMPLETED")}
                            disabled={isLoading}
                            title="Mark as Completed"
                            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: "#059669", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, opacity: isLoading ? 0.6 : 1 }}
                          >
                            <CheckCheck size={13} /> Done
                          </button>
                        )}
                        {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                          <button
                            onClick={() => updateStatus(booking.id, "CANCELLED")}
                            disabled={isLoading}
                            title="Cancel Appointment"
                            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: "transparent", color: "#dc2626", border: "1px solid #dc2626", borderRadius: "5px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, opacity: isLoading ? 0.6 : 1 }}
                          >
                            <Ban size={13} /> Cancel
                          </button>
                        )}
                        {(booking.status === "COMPLETED" || booking.status === "CANCELLED") && (
                          <span style={{ fontSize: "0.78rem", color: "var(--tth-text-muted)", fontStyle: "italic" }}>No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--tth-text-muted)" }}>
                    No bookings scheduled.
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
