"use client";

export default function WhatsAppButton() {
  const phone = "919022553346"; // Tailoring Turba WhatsApp
  const message = encodeURIComponent("Hi! I'm interested in placing a bulk order from Tailoring Turba. Can you help me?");
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 9999,
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37, 211, 102, 0.5)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          textDecoration: "none",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 30px rgba(37, 211, 102, 0.65)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(37, 211, 102, 0.5)";
        }}
      >
        {/* WhatsApp SVG Icon */}
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.828 6.505L4 29l7.698-1.804A11.94 11.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="white"/>
          <path d="M22.003 18.837c-.306-.153-1.807-.893-2.087-.994-.279-.1-.483-.153-.686.153-.202.306-.785.994-.963 1.197-.177.203-.355.229-.66.077-.306-.153-1.29-.476-2.457-1.516-.908-.81-1.52-1.81-1.699-2.116-.178-.306-.019-.47.134-.623.137-.137.306-.356.458-.534.153-.178.203-.306.305-.51.102-.204.051-.382-.026-.535-.077-.152-.686-1.655-.94-2.267-.247-.596-.498-.515-.686-.524-.177-.008-.381-.01-.585-.01a1.12 1.12 0 00-.813.382c-.279.305-1.067 1.043-1.067 2.544 0 1.502 1.092 2.953 1.244 3.157.153.203 2.148 3.282 5.204 4.602.728.314 1.296.502 1.739.643.73.232 1.395.199 1.921.121.586-.088 1.807-.738 2.062-1.452.254-.713.254-1.324.178-1.452-.076-.128-.28-.203-.585-.356z" fill="#25D366"/>
        </svg>

        {/* Pulse ring */}
        <span style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid #25D366",
          animation: "whatsapp-pulse 2s ease-out infinite",
          pointerEvents: "none",
        }} />
      </a>

      <style>{`
        @keyframes whatsapp-pulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </>
  );
}
