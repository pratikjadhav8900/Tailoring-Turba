"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <main style={{ 
        minHeight: "80vh", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
        background: "#f8fafc"
      }}>
        <div style={{
          background: "white",
          padding: "60px 40px",
          borderRadius: "24px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
          maxWidth: "500px",
          width: "100%",
          border: "1px solid #e2e8f0"
        }}>
          <h1 style={{ 
            fontSize: "6rem", 
            fontWeight: 900, 
            color: "var(--tth-olive-dark, #435b43)",
            lineHeight: 1,
            marginBottom: "16px",
            fontFamily: "'Outfit', sans-serif"
          }}>
            404
          </h1>
          <h2 style={{ 
            fontSize: "1.75rem", 
            fontWeight: 800, 
            color: "#0f172a",
            marginBottom: "16px",
            fontFamily: "'Outfit', sans-serif"
          }}>
            Page Not Found
          </h2>
          <p style={{ 
            color: "#64748b", 
            fontSize: "1.1rem",
            marginBottom: "40px",
            lineHeight: 1.6
          }}>
            The product or page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
          <Link href="/products" style={{
            display: "inline-block",
            background: "var(--tth-olive-dark, #435b43)",
            color: "white",
            padding: "16px 32px",
            borderRadius: "12px",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "1rem",
            transition: "transform 0.2s, opacity 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            Return to Catalogue
          </Link>
        </div>
      </main>
    </>
  );
}
