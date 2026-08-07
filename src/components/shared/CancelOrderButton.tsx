"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CancelOrderButton({ 
  orderId, 
  orderNumber, 
  isPaid, 
  isWithin24h 
}: { 
  orderId: string; 
  orderNumber: string; 
  isPaid: boolean; 
  isWithin24h: boolean; 
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    const confirmMsg = isPaid 
      ? `Are you sure you want to cancel Order #${orderNumber || orderId.slice(-8).toUpperCase()}?\n\nSince this order is paid, and it is within 24 hours of placement:\n• You will receive a 75% refund.\n• A 25% cancellation fee will be deducted.\n\nDo you want to proceed?`
      : `Are you sure you want to cancel Order #${orderNumber || orderId.slice(-8).toUpperCase()}?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel order.");
      }

      toast.success("Your order has been cancelled, and the refund is being processed.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      style={{
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fee2e2",
        padding: "10px 20px",
        borderRadius: "6px",
        fontFamily: "var(--font-sans)",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 0.2s"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#fee2e2";
      }}
    >
      {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite", marginRight: "2px" }} />}
      Cancel Order
    </button>
  );
}
