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
      <main style={{ 
        minHeight: "100vh", 
        paddingTop: "140px", 
        paddingBottom: "100px",
        backgroundImage: "url('/premium_textile_texture_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative"
      }}>
        {/* Soft Overlay for Readability */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(250, 250, 248, 0.85)", zIndex: 0 }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "60px" }}>
            <div style={{ maxWidth: "600px" }}>
              <h1 style={{ 
                fontFamily: "var(--tth-serif, serif)", 
                fontSize: "3.5rem", 
                fontWeight: 500, 
                color: "#1a1a1a", 
                marginBottom: "16px",
                letterSpacing: "-0.02em"
              }}>My Shortlist</h1>
              <p style={{ color: "var(--tth-text-muted, #64748b)", fontSize: "1.2rem", lineHeight: 1.6 }}>
                Your curated collection of premium apparel. Ready for bulk procurement.
              </p>
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
            <div style={{ 
              background: "rgba(255, 255, 255, 0.4)", 
              backdropFilter: "blur(20px)",
              padding: "100px 40px", 
              borderRadius: "32px", 
              textAlign: "center", 
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.05)"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "32px", opacity: 0.8 }}>✨</div>
              <h3 style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Your Shortlist Awaits</h3>
              <p style={{ color: "#64748b", marginBottom: "48px", fontSize: "1.1rem" }}>Tap the heart on any product to begin curating your collection.</p>
              <Link href="/products" style={{ 
                background: "var(--tth-olive-dark)", 
                color: "white", 
                padding: "16px 48px", 
                borderRadius: "14px", 
                textDecoration: "none", 
                fontWeight: 700,
                fontSize: "1.05rem",
                boxShadow: "0 10px 30px rgba(67, 91, 67, 0.3)"
              }}>Explore Collections</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "40px" }}>
              {wishlistItems.map(item => (
                <div key={item.id} style={{ 
                  background: "rgba(255, 255, 255, 0.5)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: "24px", 
                  border: "1px solid rgba(255, 255, 255, 0.4)", 
                  overflow: "hidden", 
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 15px 45px rgba(0,0,0,0.05)" 
                }} className="wishlist-card">
                  <div style={{ position: "relative", height: "380px", background: "#f1f5f9" }}>
                    <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} />
                    <button 
                      onClick={() => toggleWishlist(item)}
                      style={{ 
                        position: "absolute", 
                        top: "20px", 
                        right: "20px", 
                        background: "rgba(255, 255, 255, 0.9)", 
                        border: "none", 
                        borderRadius: "50%", 
                        padding: "10px", 
                        cursor: "pointer", 
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)", 
                        zIndex: 10,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </button>
                    <div style={{ 
                      position: "absolute", 
                      bottom: "0", 
                      left: "0", 
                      right: "0", 
                      padding: "30px", 
                      background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end"
                    }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{item.price}</div>
                    </div>
                  </div>
                  <div style={{ padding: "30px" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--tth-olive-dark)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>{item.category}</div>
                    <h3 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "24px", fontFamily: "var(--tth-serif)" }}>{item.name}</h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <Link href={`/products/${item.id}`} style={{ 
                        background: "var(--tth-olive-dark)", 
                        color: "white", 
                        padding: "14px", 
                        borderRadius: "12px", 
                        textDecoration: "none", 
                        fontWeight: 700, 
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 4px 15px rgba(67, 91, 67, 0.2)"
                      }}>
                        <ShoppingCart size={18} /> View Product
                      </Link>
                      <button 
                        onClick={() => isInCompare(item.id) ? removeFromCompare(item.id) : addToCompare(item as any)}
                        style={{ 
                          background: "white", 
                          color: "#1e293b", 
                          padding: "14px", 
                          borderRadius: "12px", 
                          border: "1px solid #e2e8f0",
                          fontWeight: 700, 
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {isInCompare(item.id) ? <Check size={18} color="#10b981" /> : <ArrowRightLeft size={18} />}
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
