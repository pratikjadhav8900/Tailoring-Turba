import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "./providers";
import LayoutWrapper from "./LayoutWrapper";

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
          <LayoutWrapper>
            <main>
              {children}
            </main>
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
