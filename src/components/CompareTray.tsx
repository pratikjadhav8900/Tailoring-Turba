"use client";
import { useState } from "react";

import { useCompare } from "@/context/CompareContext";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRightLeft, XCircle } from "lucide-react";

export default function CompareTray() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const [isMinimized, setIsMinimized] = useState(false);

  if (compareItems.length === 0) return null;

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        style={{
          position: "fixed",
          bottom: "32px",
          left: "24px",
          zIndex: 9998,
          background: "var(--tth-olive-dark, #435b43)",
          color: "white",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          padding: "12px",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          animation: "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <ArrowRightLeft size={18} />
        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Compare ({compareItems.length})</span>
      </button>
    );
  }

  return (
    <div className="compare-tray" style={{
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9998,
      background: "white",
      borderRadius: "20px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
      padding: "16px 24px",
      border: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      gap: "24px",
      animation: "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      maxWidth: "calc(100vw - 48px)",
      width: "max-content"
    }}>
      <button 
        onClick={() => setIsMinimized(true)}
        style={{
          position: "absolute",
          top: "-12px",
          right: "24px",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "4px 12px",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#64748b",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
        }}
      >
        Minimize
      </button>

      <div className="compare-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ background: "#f1f5f9", padding: "8px", borderRadius: "10px", color: "var(--tth-olive-dark)" }}>
          <ArrowRightLeft size={20} />
        </div>
        <div className="hide-mobile">
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>Compare Items</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{compareItems.length} products</div>
        </div>
      </div>

      <div className="compare-divider" style={{ height: "40px", width: "1px", background: "#e2e8f0" }} />

      <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "4px" }}>
        {compareItems.map(item => (
          <div key={item.id} style={{ position: "relative", width: "50px", height: "50px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
            <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="50px" />
            <button 
              onClick={() => removeFromCompare(item.id)}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: "rgba(255,255,255,0.9)",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444"
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button 
          onClick={clearCompare}
          className="hide-mobile"
          style={{ 
            background: "none", 
            border: "none", 
            color: "#64748b", 
            fontSize: "0.8rem", 
            fontWeight: 600, 
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <XCircle size={14} /> Clear
        </button>
        <Link 
          href="/compare" 
          style={{ 
            background: "var(--tth-olive-dark, #435b43)", 
            color: "white", 
            textDecoration: "none", 
            padding: "10px 20px", 
            borderRadius: "10px", 
            fontSize: "0.85rem", 
            fontWeight: 700,
            transition: "opacity 0.2s",
            whiteSpace: "nowrap"
          }}
        >
          Compare
        </Link>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @media (max-width: 640px) {
          .compare-tray {
            gap: 12px !important;
            padding: 12px 16px !important;
            bottom: 100px !important; /* Move up to avoid WhatsApp button */
          }
          .hide-mobile {
            display: none !important;
          }
          .compare-divider {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
