"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { CompareProvider } from "@/context/CompareContext";
import { WishlistProvider } from "@/context/WishlistContext";

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
