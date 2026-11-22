"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import MarqueeTicker from "@/components/landing/MarqueeTicker";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import CompareTray from "@/components/shared/CompareTray";
import MobileNav from "@/components/layout/MobileNav";
import TurbaAiLauncher from "@/components/turba-ai/TurbaAiLauncher";
import TurbaAiChatModal from "@/components/turba-ai/TurbaAiChatModal";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpsHost, setIsOpsHost] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const h = window.location.hostname.toLowerCase();
      if (h.startsWith("ops.") || h.startsWith("ops-")) {
        setIsOpsHost(true);
      }

      // Ignore third-party browser extension injection crashes (e.g. Urban VPN M_ID error)
      const handleExtensionError = (event: ErrorEvent) => {
        const msg = (event.message || "") + " " + (event.filename || "") + " " + (event.error?.stack || "");
        if (
          event.filename?.startsWith("chrome-extension://") ||
          event.filename?.startsWith("moz-extension://") ||
          msg.includes("M_ID") ||
          msg.includes("executors/200")
        ) {
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      };

      window.addEventListener("error", handleExtensionError, true);
      return () => {
        window.removeEventListener("error", handleExtensionError, true);
      };
    }
  }, []);
  
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/forgot-password");
  const isAdminPage = pathname?.startsWith("/admin");
  const isDashboardPage = pathname?.startsWith("/dashboard");
  const isCustomizer = pathname?.startsWith("/customizer");
  const isOpsPage = pathname?.startsWith("/ops") || isOpsHost;
  const isCrmPage = pathname?.startsWith("/crm");

  const hideNavigation = isAuthPage || isAdminPage || isDashboardPage || isCustomizer || isOpsPage || isCrmPage;
  const hideMobileNav = isAuthPage || isAdminPage || isCustomizer || isOpsPage || isCrmPage;
  const hideAi = isAuthPage || isAdminPage || isOpsPage || isCrmPage;

  return (
    <div className={mounted && !hideMobileNav ? "has-mobile-nav" : ""}>
      {mounted && !hideNavigation && (
        <div key="nav-container" className="global-nav-container">
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1001, height: "38px", overflow: "hidden" }}>
            <MarqueeTicker />
          </div>
          {/* Acts as a spacer matching the fixed Navbar height to prevent content layout shift */}
          <div className="h-[70px] lg:h-[80px]" style={{ paddingTop: "38px", boxSizing: "content-box" }}>
            <Navbar />
          </div>
        </div>
      )}
      
      {children}
      
      {mounted && !hideNavigation && <Footer />}
      {mounted && !hideNavigation && <WhatsAppButton />}
      {mounted && !hideNavigation && <CompareTray />}
      {mounted && !hideAi && <TurbaAiLauncher />}
      {mounted && !hideAi && <TurbaAiChatModal />}
      {mounted && !hideMobileNav && <MobileNav />}
    </div>
  );
}
