import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "./providers";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import MarqueeTicker from "@/components/landing/MarqueeTicker";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "Tailoring Turba | Custom B2B Apparel manufacturing",
  description:
    "Design and order premium custom polo shirts, t-shirts, and teamwear online directly from Tailoring Turba manufacturing hub.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1001 }}>
            <MarqueeTicker />
          </div>
          <div style={{ paddingTop: 38 }}>
            <Navbar />
          </div>
          <main>
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
