"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

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
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("tailoring_turba_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Heal cart: if productId is missing, try to restore it
        const healed = parsed.map((item: any) => {
          if (!item.productId) {
            // For older items, sometimes 'id' was the productId
            // or we just need a placeholder to prevent API crashes
            return { ...item, productId: item.productId || item.id };
          }
          return item;
        });
        setCart(healed);
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("tailoring_turba_cart", JSON.stringify(cart));
  }, [cart]);

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
