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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtensionNoise(e) {
                  try {
                    var msg = (e && (e.message || (e.error && e.error.message) || '')) + '';
                    var file = (e && e.filename) || '';
                    var stack = (e && e.error && e.error.stack) || '';
                    var combined = (msg + ' ' + file + ' ' + stack).toLowerCase();
                    return combined.indexOf('chrome-extension://') !== -1 ||
                           combined.indexOf('moz-extension://') !== -1 ||
                           combined.indexOf('m_id') !== -1 ||
                           combined.indexOf('executors/200') !== -1;
                  } catch (_) {
                    return false;
                  }
                }
                window.addEventListener('error', function(e) {
                  if (isExtensionNoise(e)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = (e && e.reason) || {};
                  if (isExtensionNoise({ message: reason.message, filename: reason.fileName, error: reason })) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
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
