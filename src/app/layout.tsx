import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "./providers";
import LayoutWrapper from "./LayoutWrapper";

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
