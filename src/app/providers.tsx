"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { CompareProvider } from "@/context/CompareContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CompareProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </CompareProvider>
    </SessionProvider>
  );
}
