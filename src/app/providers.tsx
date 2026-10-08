"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { TurbaAiProvider } from "@/contexts/TurbaAiContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WishlistProvider>
        <CompareProvider>
          <CartProvider>
            <TurbaAiProvider>
              {children}
            </TurbaAiProvider>
          </CartProvider>
        </CompareProvider>
      </WishlistProvider>
    </SessionProvider>
  );
}
