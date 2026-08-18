import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "./providers";
import LayoutWrapper from "./LayoutWrapper";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import CookieConsent from "@/components/layout/CookieConsent";
import JsonLd from "@/app/JsonLd";

export const metadata: Metadata = {
  title: {
    default: "Tailoring Turba | Premium Bulk Apparel Manufacturer India",
    template: "%s | Tailoring Turba"
  },
  description:
    "Tailoring Turba is a leading B2B apparel manufacturer in India. Design and order custom polo shirts, t-shirts, and corporate uniforms at wholesale prices. High-quality bulk manufacturing for global exports.",
  keywords: ["bulk apparel manufacturer India", "custom uniforms manufacturer", "corporate t-shirt printing India", "premium polo shirt wholesaler", "Tailoring Turba manufacturing"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://tailoringturba.com",
    siteName: "Tailoring Turba",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <JsonLd />
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '8px' } }} />
        <Providers>
          <LayoutWrapper>
            <main>
              {children}
            </main>
          </LayoutWrapper>
        </Providers>
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
