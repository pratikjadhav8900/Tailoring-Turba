"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as Lucide from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/customizer" || pathname === "/admin/login") return null;

  const noMarginPages = ["/", "/about", "/cart", "/checkout", "/contact", "/login", "/register", "/wishlist", "/compare", "/booking", "/careers"];
  const isNoMargin = noMarginPages.includes(pathname) || pathname.startsWith("/products");

  return (
    <footer style={{
      background: "#0a0a0a",
      color: "#e2e8f0",
      paddingTop: "64px",
      marginTop: isNoMargin ? "0" : "80px",
      borderTop: "1px solid rgba(255,255,255,0.06)"
    }}>
      <div className="container">
        {/* Top Row */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div>
            <div style={{ marginBottom: "24px" }}>
              <Image src="/brand-logo.png" alt="Tailoring Turba" width={180} height={40} style={{ objectFit: "contain" }} />
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "280px" }}>
              Your trusted manufacturing partner for premium bespoke apparel. We specialize in high-quality uniforms, corporate wear, and custom tailoring solutions designed to elevate your brand.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <a href="#" className="footer-social-link" style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", transition: "all 0.2s ease" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
              <a href="#" className="footer-social-link" style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", transition: "all 0.2s ease" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect width="4" height="12" x="2" y="9"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              <a href="#" className="footer-social-link" style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", transition: "all 0.2s ease" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
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
                { label: "Track Your Order", href: "/track-order" },
                { label: "Our Story", href: "/about" },
                { label: "Full Catalogue", href: "/products/catalogue" },
                { label: "Book Showroom", href: "/booking" },
                { label: "Careers", href: "/careers" },
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Lucide.Mail size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
                <span>tailoringturba@gmail.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Lucide.Phone size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
                <span>+91 90225 53346</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <Lucide.MapPin size={15} style={{ flexShrink: 0, marginTop: "3px", opacity: 0.7 }} />
                <span style={{ maxWidth: "240px" }}>321/1, Jawaharlal Nehru Road, Mahatma Phule Peth, near HDFC Bank, Pune, Maharashtra 411042, India</span>
              </div>
            </div>
            <div style={{ marginTop: "20px" }}>
              <Link href="/contact" style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
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

        </div>

        {/* Bottom Row */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Tailoring Turba. All rights reserved.</span>
          <div className="footer-bottom-links">
            <Link href="#" style={{ color: "#475569", textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="#" style={{ color: "#475569", textDecoration: "none" }}>Terms of Service</Link>
            <Link href="#" style={{ color: "#475569", textDecoration: "none" }}>GST: 27XXXXX000X1ZX</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
