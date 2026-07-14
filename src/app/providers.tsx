"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { WishlistProvider } from "@/contexts/WishlistContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WishlistProvider>
        <CompareProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </CompareProvider>
      </WishlistProvider>
    </SessionProvider>
  );
}
