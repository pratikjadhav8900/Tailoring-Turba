"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type WishlistItem = {
  id: string;
  name: string;
  image: string;
  price: string;
  category: string;
  type: string;
  description?: string;
  minOrderQuantity?: number;
  gallery?: string[];
  badge?: string;
  colors?: any;
  features?: any;
  brand?: string;
};

type WishlistContextType = {
  wishlistItems: WishlistItem[];
  toggleWishlist: (product: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("tth_wishlist");
    if (saved) {
      try {
        setWishlistItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
    }
  }, []);

  const toggleWishlist = (product: WishlistItem) => {
    const index = wishlistItems.findIndex(item => item.id === product.id);
    let updated: WishlistItem[];
    
    if (index >= 0) {
      updated = wishlistItems.filter(item => item.id !== product.id);
    } else {
      updated = [...wishlistItems, product];
    }
    
    setWishlistItems(updated);
    localStorage.setItem("tth_wishlist", JSON.stringify(updated));
  };

  const isInWishlist = (id: string) => wishlistItems.some(item => item.id === id);

  const clearWishlist = () => {
    setWishlistItems([]);
    localStorage.removeItem("tth_wishlist");
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
