"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

import { CustomizerState } from "@/types/customizer";

export type CartItem = {
  id: string;
  productId: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  mockupUrlBack?: string;
  mockupUrlLeft?: string;
  mockupUrlRight?: string;
  customDesign?: CustomizerState;
  uploadedAssets?: string[];
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const userEmail = session?.user?.email;
  const storageKey = userEmail
    ? `tailoring_turba_cart_${userEmail}`
    : "tailoring_turba_cart_anonymous";

  // Load cart from localStorage based on active user session
  useEffect(() => {
    if (status === "loading") return;

    const savedCart = localStorage.getItem(storageKey);
    let loadedCart: CartItem[] = [];

    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        loadedCart = parsed.map((item: any) => ({
          ...item,
          productId: item.productId || item.id,
        }));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }

    // Merge guest cart if user logged in
    if (userEmail) {
      const guestCart = localStorage.getItem("tailoring_turba_cart_anonymous");
      if (guestCart) {
        try {
          const guestParsed = JSON.parse(guestCart) as CartItem[];
          if (guestParsed.length > 0) {
            const merged = [...loadedCart];
            guestParsed.forEach((guestItem) => {
              const existingIdx = merged.findIndex((item) => item.id === guestItem.id);
              if (existingIdx > -1) {
                merged[existingIdx].quantity += guestItem.quantity;
              } else {
                merged.push({
                  ...guestItem,
                  productId: guestItem.productId || guestItem.id,
                });
              }
            });
            loadedCart = merged;
            localStorage.removeItem("tailoring_turba_cart_anonymous");
            toast.success("Merged your guest cart items ✓", { duration: 2500 });
          }
        } catch (e) {
          console.error("Failed to parse guest cart", e);
        }
      }
    }

    setCart(loadedCart);
    setIsLoaded(true);
  }, [userEmail, status, storageKey]);

  // Save cart to localStorage under user/anonymous key
  useEffect(() => {
    if (!isLoaded || status === "loading") return;
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey, isLoaded, status]);

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
    toast.success("Added to cart ✓", { duration: 2500 });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
