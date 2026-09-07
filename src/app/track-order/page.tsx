"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import OrderTracking from "@/components/shared/OrderTracking";
import { 
  Search, 
  Truck, 
  Package, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Loader2
} from "lucide-react";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || searchParams.get("orderId") || searchParams.get("awb") || "";
  const initialContact = searchParams.get("contact") || searchParams.get("email") || "";

  const [orderIdentifier, setOrderIdentifier] = useState(initialOrder);
  const [contactInfo, setContactInfo] = useState(initialContact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any | null>(null);

  const fetchTracking = async (id: string, contact: string) => {
    if (!id.trim() || !contact.trim()) {
      setError("Please provide both your Order ID and the Email/Phone used at checkout.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/track-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIdentifier: id.trim(),
          contactInfo: contact.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order not found. Please verify your details.");
      }

      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || "Failed to find order details.");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder && initialContact) {
      fetchTracking(initialOrder, initialContact);
    }
  }, [initialOrder, initialContact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderIdentifier, contactInfo);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fcfbf9", color: "#1c1917" }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #2b3a2b 0%, #1e291e 100%)",
        color: "white",
        padding: "60px 24px 80px",
        textAlign: "center",
        position: "relative",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#bbf7d0",
            marginBottom: "12px",
          }}>
            <ShieldCheck size={16} /> Live Real-Time Fulfillment Tracking
          </span>
          <h1 style={{
            fontFamily: "var(--font-ui, serif)",
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: "16px",
          }}>
            Track Your Custom Apparel Order
          </h1>
          <p style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "1rem",
            lineHeight: 1.6,
          }}>
            Enter your Order Number and the Email or Phone used during checkout to inspect live production milestones and courier transit updates.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: "960px",
        margin: "-40px auto 80px",
        padding: "0 20px",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Lookup Card */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.08)",
          border: "1px solid #e7e5e4",
        }}>
          <form onSubmit={handleSubmit} style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr)) auto",
            gap: "16px",
            alignItems: "end",
          }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "6px" }}>
                Order Number / AWB
              </label>
              <input
                type="text"
                placeholder="e.g. TT-2026-001 or 12345678"
                value={orderIdentifier}
                onChange={(e) => setOrderIdentifier(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #d6d3d1",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "6px" }}>
                Billing Email or Phone
              </label>
              <input
                type="text"
                placeholder="e.g. john@example.com or 9876543210"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #d6d3d1",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#435b43",
                color: "white",
                padding: "13px 28px",
                borderRadius: "8px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(67, 91, 67, 0.25)",
                minHeight: "48px",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Tracking...
                </>
              ) : (
                <>
                  <Search size={18} /> Track Order
                </>
              )}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: "20px",
              padding: "14px 18px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#b91c1c",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Tracking Details View */}
        {trackingData && (
          <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header Status Card */}
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "28px 32px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #e7e5e4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#78716c", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                  Order Overview
                </span>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1c1917", margin: "4px 0" }}>
                  Order #{trackingData.orderNumber}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "#78716c" }}>
                  Placed on {new Date(trackingData.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <span style={{
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background: "#e0f2fe",
                  color: "#0369a1",
                }}>
                  {trackingData.currentStage.label}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#78716c" }}>
                  {trackingData.currentStage.description}
                </span>
              </div>
            </div>

            {/* 7-Stage Synchronized Pipeline */}
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #e7e5e4",
            }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#292524", marginBottom: "20px" }}>
                Fulfillment Pipeline (7 Stages)
              </h3>
              <OrderTracking currentStageKey={trackingData.currentStage.key} status={trackingData.status} />
            </div>

            {/* Amber Pending Balance Settlement Notice */}
            {trackingData.ledger.canPayBalance && (
              <div style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ background: "#fef3c7", padding: "10px", borderRadius: "10px", color: "#b45309" }}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#92400e" }}>
                      Balance Payment Required: ₹{trackingData.ledger.balanceDueRupees.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#78350f", marginTop: "2px" }}>
                      Your garments are currently advancing through production. Clear the balance to unlock instant carrier dispatch.
                    </div>
                  </div>
                </div>

                <Link
                  href={`/checkout/pay-balance?orderId=${trackingData.orderId}`}
                  style={{
                    background: "#b45309",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 6px rgba(180, 83, 9, 0.25)",
                  }}
                >
                  Pay Balance Now <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* Paid in Full Badge */}
            {trackingData.ledger.isPaidInFull && (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#15803d",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}>
                <CheckCircle2 size={18} />
                Payment: Paid in Full (₹{trackingData.ledger.totalAmount.toLocaleString("en-IN")}) — Unrestricted dispatch authorized.
              </div>
            )}

            {/* Courier Shipment Details Card */}
            {trackingData.shipment && (
              <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "28px 32px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                border: "1px solid #e7e5e4",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px", borderRadius: "10px" }}>
                      <Truck size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#1c1917" }}>
                        Courier & Logistics Details
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "#78716c", margin: "2px 0 0" }}>
                        Carrier: <strong>{trackingData.shipment.carrier}</strong> | Tracking AWB: <strong>{trackingData.shipment.awbNumber}</strong>
                      </p>
                    </div>
                  </div>

                  {trackingData.shipment.awbNumber && (
                    <a
                      href={trackingData.shipment.awbNumber.startsWith("http") ? trackingData.shipment.awbNumber : `https://app.bigship.in/track_order`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#435b43",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      Real-Time Carrier Tracking <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {/* Checkpoints History */}
                {trackingData.shipment.checkpoints && trackingData.shipment.checkpoints.length > 0 ? (
                  <div style={{ marginTop: "20px", borderTop: "1px solid #f5f5f4", paddingTop: "20px" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#78716c", marginBottom: "16px" }}>
                      Logistics Transit History
                    </h4>
                    <div style={{ position: "relative", paddingLeft: "24px", borderLeft: "2px solid #e7e5e4", display: "flex", flexDirection: "column", gap: "16px" }}>
                      {trackingData.shipment.checkpoints.map((cp: any, idx: number) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <div style={{
                            position: "absolute",
                            left: "-31px",
                            top: "2px",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: idx === 0 ? "#16a34a" : "#cbd5e1",
                            border: "2px solid white",
                          }} />
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1c1917" }}>
                            {cp.activity || cp.status || "In Transit"}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#78716c" }}>
                            {cp.location ? `${cp.location} • ` : ""}{cp.date || cp.time || ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "#78716c", marginTop: "12px" }}>
                    Package manifest created. Real-time carrier transit scans update automatically as the package moves across distribution hubs.
                  </div>
                )}
              </div>
            )}

            {/* Order Items Summary */}
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "28px 32px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              border: "1px solid #e7e5e4",
            }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c1917", marginBottom: "16px" }}>
                Items in This Order ({trackingData.items?.length || 0})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {trackingData.items.map((item: any) => (
                  <div key={item.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "10px 14px",
                    background: "#fafaf9",
                    borderRadius: "8px",
                    border: "1px solid #f5f5f4",
                  }}>
                    <div style={{ width: "42px", height: "42px", position: "relative", borderRadius: "6px", overflow: "hidden", background: "#e7e5e4", flexShrink: 0 }}>
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#292524", flex: 1 }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#78716c", fontWeight: 500 }}>
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} className="animate-spin text-[#435b43]" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
