"use client";
import { useState, useEffect } from "react";
import { useTurbaAi } from "@/contexts/TurbaAiContext";
import styles from "./WhatsAppButton.module.css";

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { isOpen, isMinimized } = useTurbaAi();
  const phone = "919022553346"; // Tailoring Turba WhatsApp
  const message = encodeURIComponent("Hi Tailoring Turba! I'm interested in placing a bulk order. Could you share your latest catalogue and pricing?");
  const url = `https://wa.me/${phone}?text=${message}`;

  useEffect(() => {
    // Show after 2 seconds for a clean entry
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hide button if not visible or if Turba AI chat modal is active
  if (!isVisible || (isOpen && !isMinimized)) return null;

  return (
    <div className={styles.whatsappBtnWrapper}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={styles.whatsappBtnContainer}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.828 6.505L4 29l7.698-1.804A11.94 11.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="white"/>
          <path d="M22.003 18.837c-.306-.153-1.807-.893-2.087-.994-.279-.1-.483-.153-.686.153-.202.306-.785.994-.963 1.197-.177.203-.355.229-.66.077-.306-.153-1.29-.476-2.457-1.516-.908-.81-1.52-1.81-1.699-2.116-.178-.306-.019-.47.134-.623.137-.137.306-.356.458-.534.153-.178.203-.306.305-.51.102-.204.051-.382-.026-.535-.077-.152-.686-1.655-.94-2.267-.247-.596-.498-.515-.686-.524-.177-.008-.381-.01-.585-.01a1.12 1.12 0 00-.813.382c-.279.305-1.067 1.043-1.067 2.544 0 1.502 1.092 2.953 1.244 3.157.153.203 2.148 3.282 5.204 4.602.728.314 1.296.502 1.739.643.73.232 1.395.199 1.921.121.586-.088 1.807-.738 2.062-1.452.254-.713.254-1.324.178-1.452-.076-.128-.28-.203-.585-.356z" fill="#25D366"/>
        </svg>
        <span className={styles.whatsappPulse} />
      </a>

      <div className={styles.whatsappLabel}>
        Chat with an expert
      </div>
    </div>
  );
}
