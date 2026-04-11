"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{
      background: "#0a0a0a",
      color: "#e2e8f0",
      paddingTop: "64px",
      paddingBottom: "32px",
      marginTop: "80px",
      borderTop: "1px solid rgba(255,255,255,0.06)"
    }}>
      <div className="container">
        {/* Top Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
          gap: "48px",
          paddingBottom: "56px",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}>
          {/* Brand Column */}
          <div>
            <div style={{ marginBottom: "24px" }}>
              <Image src="/logo.svg" alt="Tailoring Turba" width={160} height={32} style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }} />
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "280px" }}>
              India's premium corporate gifting & custom apparel platform. From bulk gift sets to bespoke teamwear — we have it all.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              {["twitter", "linkedin", "instagram"].map(platform => (
                <a key={platform} href="#" style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.08)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  textDecoration: "none", fontSize: "0.75rem",
                  color: "#94a3b8", transition: "background 0.2s"
                }}>
                  {platform[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: "20px", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Explore
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Design Studio", href: "/customizer" },
                { label: "Products", href: "/products" },
                { label: "Full Catalogue", href: "/products/catalogue" },
                { label: "Book Showroom", href: "/booking" },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Corporate */}
          <div>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: "20px", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Corporate
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Bulk Orders", href: "/contact" },
                { label: "Gift Sets", href: "/products/catalogue/combo-gift-sets" },
                { label: "A5 Notebooks", href: "/products/catalogue/a5-notebooks" },
                { label: "Pens & Branded Sets", href: "/products/catalogue/promotional-metal-pens" },
              ].map(link => (
                <Link key={link.label} href={link.href} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: "20px", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Contact
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
              <span>📧 hello@tailoringturba.in</span>
              <span>📞 +91 98765 43210</span>
              <span>📍 Mumbai, Maharashtra, India</span>
            </div>
            <Link href="/contact" style={{
              display: "inline-block", marginTop: "20px",
              padding: "10px 20px", borderRadius: "8px",
              background: "rgba(255,255,255,0.1)", color: "white",
              textDecoration: "none", fontSize: "0.85rem",
              fontWeight: 600, transition: "background 0.2s",
              border: "1px solid rgba(255,255,255,0.12)"
            }}>
              Get In Touch →
            </Link>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          color: "#475569",
          fontSize: "0.8rem"
        }}>
          <span>© {new Date().getFullYear()} Tailoring Turba. All rights reserved.</span>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="#" style={{ color: "#475569", textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="#" style={{ color: "#475569", textDecoration: "none" }}>Terms of Service</Link>
            <Link href="#" style={{ color: "#475569", textDecoration: "none" }}>GST: 27XXXXX000X1ZX</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
