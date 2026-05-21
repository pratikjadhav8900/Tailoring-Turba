"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MarqueeTicker from "@/components/landing/MarqueeTicker";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CompareTray from "@/components/CompareTray";
import MobileNav from "@/components/MobileNav";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/forgot-password");
  const isAdminPage = pathname?.startsWith("/admin");
  const isDashboardPage = pathname?.startsWith("/dashboard");
  const isCustomizer = pathname?.startsWith("/customizer");

  const hideNavigation = isAuthPage || isAdminPage || isDashboardPage || isCustomizer;

  return (
    <div className={mounted && !hideNavigation ? "has-mobile-nav" : ""} style={{ overflowX: "hidden", width: "100%", position: "relative" }}>
      {mounted && !hideNavigation && (
        <div key="nav-container" className="global-nav-container">
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1001, height: "38px", overflow: "hidden" }}>
            <MarqueeTicker />
          </div>
          <div style={{ paddingTop: "38px" }}>
            <Navbar />
          </div>
        </div>
      )}
      
      {children}
      
      {mounted && !hideNavigation && <Footer />}
      {mounted && !hideNavigation && <WhatsAppButton />}
      {mounted && !hideNavigation && <CompareTray />}
      {mounted && !hideNavigation && <MobileNav />}
    </div>
  );
}
