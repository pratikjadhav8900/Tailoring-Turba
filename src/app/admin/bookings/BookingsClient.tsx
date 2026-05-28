"use client";

import { useState, useTransition } from "react";
import { Calendar, Clock, CheckCheck, Ban, Check, Download } from "lucide-react";
import styles from "../page.module.css";

type Booking = {
  id: string;
  status: string;
  date: string;
  timeSlot: string;
  notes: string | null;
  user: { name: string | null; email: string; phone: string | null };
};

export default function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredBookings = bookings.filter(b => {
    if (!startDate && !endDate) return true;
    const bDate = new Date(b.date).getTime();
    const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : -Infinity;
    const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
    return bDate >= start && bDate <= end;
  });

  const exportToCSV = () => {
    const headers = ["Customer Name", "Phone", "Email", "Booking Date", "Time Slot", "Notes", "Status"];
    const rows = filteredBookings.map(b => [
      `"${(b.user.name || "Guest").replace(/"/g, '""')}"`,
      b.user.phone || "",
      b.user.email || "",
      new Date(b.date).toLocaleDateString("en-IN"),
      b.timeSlot,
      `"${(b.notes || "").replace(/"/g, '""')}"`,
      b.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    let filename = "Tailoring_Turba_Bookings.csv";
    if (startDate && endDate) {
      filename = `Tailoring_Turba_Bookings_${startDate}_to_${endDate}.csv`;
    } else if (startDate) {
      filename = `Tailoring_Turba_Bookings_from_${startDate}.csv`;
    } else if (endDate) {
      filename = `Tailoring_Turba_Bookings_until_${endDate}.csv`;
    }
    
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* Filters & Export Bar */}
      <div style={{ 
        background: "white", 
        padding: "16px 24px", 
        borderRadius: "4px", 
        border: "1px solid var(--tth-beige-light, #e7e5e4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} color="var(--tth-text-muted, #78716c)" />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--tth-black, #1c1917)" }}>Filter Period:</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "4px", 
                border: "1px solid var(--tth-beige-light, #e7e5e4)", 
                fontSize: "0.85rem", 
                outline: "none", 
                minWidth: "140px",
                color: "var(--tth-black, #1c1917)",
                backgroundColor: "white"
              }}
            />
            <span style={{ color: "var(--tth-text-muted, #78716c)", fontSize: "0.85rem" }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "4px", 
                border: "1px solid var(--tth-beige-light, #e7e5e4)", 
                fontSize: "0.85rem", 
                outline: "none", 
                minWidth: "140px",
                color: "var(--tth-black, #1c1917)",
                backgroundColor: "white"
              }}
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(""); setEndDate(""); }}
                style={{ fontSize: "0.8rem", color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={exportToCSV}
          disabled={filteredBookings.length === 0}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            padding: "8px 16px", 
            background: "var(--tth-olive-dark, #435b43)", 
            color: "white", 
            borderRadius: "4px", 
            border: "none", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            cursor: filteredBookings.length === 0 ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
            opacity: filteredBookings.length === 0 ? 0.4 : 1
          }}
        >
          <Download size={16} />
          {startDate || endDate ? "Export Filtered to Excel (CSV)" : "Export All to Excel (CSV)"}
        </button>
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
              {filteredBookings.map((booking) => {
                const cfg = statusConfig[booking.status] || statusConfig.REQUESTED;
                const isLoading = loadingId === booking.id;

                return (
                  <tr key={booking.id}>
                    <td>
                      <div className={styles.customerName}>{booking.user.name || "Guest"}</div>
                      <div className={styles.customerEmail}>{booking.user.email}</div>
                      {booking.user.phone && (
                        <div style={{ fontSize: "0.82rem", color: "var(--tth-text-muted)", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ opacity: 0.7 }}>📞</span> {booking.user.phone}
                        </div>
                      )}
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
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--tth-text-muted)" }}>
                    No bookings found.
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
