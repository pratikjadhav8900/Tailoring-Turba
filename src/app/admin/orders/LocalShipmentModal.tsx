"use client";
import React, { useState } from "react";
import { X, Truck, Loader2 } from "lucide-react";

interface LocalShipmentModalProps {
  order: any;
  onClose: () => void;
  onSubmit: (courierName: string, trackingId: string) => Promise<void>;
}

export default function LocalShipmentModal({ order, onClose, onSubmit }: LocalShipmentModalProps) {
  const [courierName, setCourierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(courierName, trackingId);
    } catch (err) {
      console.error(err);
      alert("Failed to update tracking info");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
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
        maxWidth: "450px",
        overflow: "hidden",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Truck size={20} />
            Ship Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px" }}>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 20px 0" }}>
              Marking this order as shipped. You can provide local delivery details (like Porter, Uber, etc.) or leave them blank.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Courier Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Porter, Uber, Local Driver"
                value={courierName}
                onChange={e => setCourierName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Tracking Link or ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. https://porter.in/track/..."
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem"
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "16px 20px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px"
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#435b43",
                color: "white",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Mark as Shipped
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
