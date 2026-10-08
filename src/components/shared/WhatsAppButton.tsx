"use client";
import { useState, useEffect } from "react";

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);
  const phone = "919022553346"; // Tailoring Turba WhatsApp
  const message = encodeURIComponent("Hi Tailoring Turba! I'm interested in placing a bulk order. Could you share your latest catalogue and pricing?");
  const url = `https://wa.me/${phone}?text=${message}`;

  useEffect(() => {
    // Show after 2 seconds for a nice entry
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="whatsapp-btn-wrapper" style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 98px)",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexDirection: "row-reverse"
      }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="whatsapp-btn-container"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#25D366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 30px rgba(37, 211, 102, 0.4)",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            textDecoration: "none",
            position: "relative"
          }}
        >
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.828 6.505L4 29l7.698-1.804A11.94 11.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="white"/>
            <path d="M22.003 18.837c-.306-.153-1.807-.893-2.087-.994-.279-.1-.483-.153-.686.153-.202.306-.785.994-.963 1.197-.177.203-.355.229-.66.077-.306-.153-1.29-.476-2.457-1.516-.908-.81-1.52-1.81-1.699-2.116-.178-.306-.019-.47.134-.623.137-.137.306-.356.458-.534.153-.178.203-.306.305-.51.102-.204.051-.382-.026-.535-.077-.152-.686-1.655-.94-2.267-.247-.596-.498-.515-.686-.524-.177-.008-.381-.01-.585-.01a1.12 1.12 0 00-.813.382c-.279.305-1.067 1.043-1.067 2.544 0 1.502 1.092 2.953 1.244 3.157.153.203 2.148 3.282 5.204 4.602.728.314 1.296.502 1.739.643.73.232 1.395.199 1.921.121.586-.088 1.807-.738 2.062-1.452.254-.713.254-1.324.178-1.452-.076-.128-.28-.203-.585-.356z" fill="#25D366"/>
          </svg>
          
          <span className="whatsapp-pulse" />
        </a>

        <div className="whatsapp-label" style={{
          background: "white",
          padding: "10px 18px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "#1e293b",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          border: "1px solid #f1f5f9",
          opacity: 0,
          transform: "translateX(20px)",
          transition: "all 0.3s ease"
        }}>
          Chat with an expert
        </div>
      </div>

    </>
  );
}
