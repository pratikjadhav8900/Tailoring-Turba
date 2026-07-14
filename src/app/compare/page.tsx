"use client";

import { useCompare } from "@/contexts/CompareContext";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowLeft, ShoppingCart, MessageSquare } from "lucide-react";

export default function ComparePage() {
  const { compareItems, removeFromCompare } = useCompare();

  return (
    <>
      <main style={{ minHeight: "100vh", background: "#f8fafc", paddingTop: "120px", paddingBottom: "80px" }}>
        <div className="container">
          <Link href="/products" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none", fontSize: "0.9rem", marginBottom: "32px" }}>
            <ArrowLeft size={16} /> Back to Catalog
          </Link>

          <div style={{ marginBottom: "48px" }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Compare Products</h1>
            <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Side-by-side comparison to help you choose the best for your brand.</p>
          </div>

          {compareItems.length === 0 ? (
            <div style={{ background: "white", padding: "80px 40px", borderRadius: "24px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🔍</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>No products to compare</h3>
              <p style={{ color: "#64748b", marginBottom: "32px" }}>Add products from our catalog to see them side-by-side.</p>
              <Link href="/products" style={{ 
                background: "var(--tth-olive-dark)", 
                color: "white", 
                padding: "14px 32px", 
                borderRadius: "12px", 
                textDecoration: "none", 
                fontWeight: 700 
              }}>Browse Products</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto", paddingBottom: "20px" }}>
              <table style={{ 
                width: "100%", 
                minWidth: "1000px", 
                borderCollapse: "separate", 
                borderSpacing: "12px 0", // Add spacing between columns for a card feel
                tableLayout: "fixed" // FORCE EQUAL WIDTHS
              }}>
                <thead>
                  <tr>
                    <th style={{ width: "180px", background: "transparent", border: "none" }}></th>
                    {compareItems.map(item => (
                      <th key={item.id} style={{ 
                        background: "white", 
                        padding: "24px", 
                        border: "1px solid #e2e8f0", 
                        borderBottom: "none", 
                        borderRadius: "20px 20px 0 0", 
                        verticalAlign: "top",
                        boxShadow: "0 -4px 20px rgba(0,0,0,0.02)"
                      }}>
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1.2", borderRadius: "12px", overflow: "hidden", marginBottom: "20px", background: "#f8fafc" }}>
                          <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} />
                          <button 
                            onClick={() => removeFromCompare(item.id)}
                            style={{ position: "absolute", top: "10px", right: "10px", background: "white", border: "none", borderRadius: "50%", padding: "6px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 20 }}
                          >
                            <X size={14} color="#ef4444" />
                          </button>
                        </div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px", textAlign: "left", lineHeight: 1.4, height: "2.8em", overflow: "hidden" }}>{item.name}</h3>
                        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--tth-olive-dark)", textAlign: "left" }}>₹{typeof (item as any).price === 'number' ? (item as any).price.toLocaleString('en-IN') : (item as any).price}</div>
                      </th>
                    ))}
                    {Array.from({ length: 4 - compareItems.length }).map((_, i) => (
                      <th key={i} style={{ padding: "24px" }}>
                        <div style={{ width: "100%", aspectRatio: "1/1.2", borderRadius: "20px", border: "2px dashed #cbd5e1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "#94a3b8" }}>
                           <PlusCircle size={32} />
                           <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Add product</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow label="Category" values={compareItems.map(item => item.category)} />
                  <ComparisonRow label="Fabric Type" values={compareItems.map(item => item.type)} />
                  <ComparisonRow label="Color Options" values={compareItems.map(item => `${item.colors} Available`)} />
                  <ComparisonRow label="Description" values={compareItems.map(item => item.description || "N/A")} isSmall />
                  <ComparisonRow label="Features" values={compareItems.map(item => (
                    <ul style={{ padding: 0, margin: 0, listStyle: "none", textAlign: "left" }}>
                      {item.features?.slice(0, 3).map((f, fi) => (
                        <li key={fi} style={{ fontSize: "0.8rem", marginBottom: "4px", color: "#475569" }}>• {f}</li>
                      )) || "N/A"}
                    </ul>
                  ))} />
                  <tr>
                    <td style={{ padding: "24px", border: "none" }}></td>
                    {compareItems.map(item => (
                      <td key={item.id} style={{ 
                        padding: "24px", 
                        background: "white", 
                        border: "1px solid #e2e8f0", 
                        borderTop: "none", 
                        borderRadius: "0 0 20px 20px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <Link href={`/products/${item.id}`} style={{ 
                            background: "var(--tth-olive-dark)", 
                            color: "white", 
                            padding: "12px", 
                            borderRadius: "10px", 
                            textDecoration: "none", 
                            fontWeight: 700, 
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "opacity 0.2s"
                          }}>
                            <ShoppingCart size={16} /> Order Now
                          </Link>
                          <Link href={`/contact?product=${item.name}`} style={{ 
                            background: "white", 
                            color: "#1e293b", 
                            padding: "12px", 
                            borderRadius: "10px", 
                            textDecoration: "none", 
                            fontWeight: 700, 
                            fontSize: "0.85rem",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                          }}>
                            <MessageSquare size={16} /> Inquire
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function ComparisonRow({ label, values, isSmall = false }: { label: string, values: any[], isSmall?: boolean }) {
  return (
    <tr>
      <td style={{ padding: "16px 24px", fontWeight: 700, fontSize: "0.8rem", color: "#64748b", border: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</td>
      {values.map((v, i) => (
        <td key={i} style={{ 
          padding: "20px 24px", 
          background: "white", 
          borderLeft: "1px solid #e2e8f0", 
          borderRight: "1px solid #e2e8f0", 
          borderBottom: "1px solid #f1f5f9",
          fontSize: isSmall ? "0.8rem" : "0.9rem",
          color: "#475569",
          lineHeight: 1.6,
          boxShadow: "4px 0 10px rgba(0,0,0,0.01)"
        }}>
          {v}
        </td>
      ))}
      {Array.from({ length: 4 - values.length }).map((_, i) => (
        <td key={i} style={{ border: "none" }}></td>
      ))}
    </tr>
  );
}

function PlusCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}
