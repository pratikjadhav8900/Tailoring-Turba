"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import MarqueeTicker from "@/components/landing/MarqueeTicker";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CompareTray from "@/components/CompareTray";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/forgot-password");
  const isAdminPage = pathname?.startsWith("/admin");
  const isDashboardPage = pathname?.startsWith("/dashboard");
  const isCustomizer = pathname?.startsWith("/customizer");

  const hideNavigation = isAuthPage || isAdminPage || isDashboardPage || isCustomizer;

  return (
    <div style={{ overflowX: "hidden", width: "100%", position: "relative" }}>
      {!hideNavigation && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1001, height: "38px", overflow: "hidden" }}>
            <MarqueeTicker />
          </div>
          <div style={{ paddingTop: "38px" }}>
            <Navbar />
          </div>
        </>
      )}
      
      {children}
      
      {!hideNavigation && <Footer />}
      {!hideNavigation && <WhatsAppButton />}
      {!hideNavigation && <CompareTray />}
    </div>
  );
}
