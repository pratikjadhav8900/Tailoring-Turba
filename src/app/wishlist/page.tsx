"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowRightLeft, Check } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function WishlistPage() {
  const { wishlistItems, toggleWishlist, clearWishlist } = useWishlist();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "#f8fafc", paddingTop: "120px", paddingBottom: "80px" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Your Shortlist</h1>
              <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Review your saved picks for bulk ordering.</p>
            </div>
            {wishlistItems.length > 0 && (
              <button 
                onClick={clearWishlist}
                style={{ background: "none", border: "none", color: "#94a3b8", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Trash2 size={16} /> Clear All
              </button>
            )}
          </div>

          {wishlistItems.length === 0 ? (
            <div style={{ background: "white", padding: "80px 40px", borderRadius: "24px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>❤️</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Your shortlist is empty</h3>
              <p style={{ color: "#64748b", marginBottom: "32px" }}>Browse our catalog and tap the heart to save items here.</p>
              <Link href="/products" style={{ 
                background: "var(--tth-olive-dark)", 
                color: "white", 
                padding: "14px 32px", 
                borderRadius: "12px", 
                textDecoration: "none", 
                fontWeight: 700 
              }}>Explore Catalog</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "32px" }}>
              {wishlistItems.map(item => (
                <div key={item.id} style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", transition: "transform 0.2s" }} className="wishlist-card">
                  <div style={{ position: "relative", height: "320px", background: "#f1f5f9" }}>
                    <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} />
                    <button 
                      onClick={() => toggleWishlist(item)}
                      style={{ position: "absolute", top: "16px", right: "16px", background: "white", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10 }}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </button>
                  </div>
                  <div style={{ padding: "24px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{item.category}</div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>{item.name}</h3>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--tth-olive-dark)", marginBottom: "20px" }}>{item.price}</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                        gap: "6px"
                      }}>
                        <ShoppingCart size={16} /> View
                      </Link>
                      <button 
                        onClick={() => isInCompare(item.id) ? removeFromCompare(item.id) : addToCompare(item as any)}
                        style={{ 
                          background: "white", 
                          color: "#1e293b", 
                          padding: "12px", 
                          borderRadius: "10px", 
                          border: "1px solid #e2e8f0",
                          fontWeight: 700, 
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          cursor: "pointer"
                        }}
                      >
                        {isInCompare(item.id) ? <Check size={16} color="#10b981" /> : <ArrowRightLeft size={16} />}
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style>{`
        .wishlist-card:hover { transform: translateY(-8px); }
      `}</style>
    </>
  );
}
