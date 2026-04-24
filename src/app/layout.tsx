import type { Metadata } from "next";
import "./globals.css";
import TawkToChat from "@/components/TawkToChat";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tailoring Turba | Custom B2B Apparel manufacturing",
  description:
    "Design and order premium custom polo shirts, t-shirts, and teamwear online directly from Tailoring Turba manufacturing hub.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  keywords: [
    "custom jerseys",
    "polo shirts",
    "print on demand",
    "B2B textiles",
    "sportswear India",
    "Tailoring Turba",
  ],
  openGraph: {
    title: "Tailoring Turba — Premium Custom Apparel",
    description: "Customize & order premium textiles with your branding.",
    url: "https://www.tailoringturba.in",
    siteName: "Tailoring Turba",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tailoring Turba — Premium Custom Apparel",
    description: "Customize & order premium textiles with your branding.",
  },
  robots: { index: true, follow: true },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Footer />
        </Providers>
        <TawkToChat />
      </body>
    </html>
  );
}
