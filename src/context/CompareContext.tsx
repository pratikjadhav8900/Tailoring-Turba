"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type CompareProduct = {
  id: string;
  name: string;
  image: string;
  price: string;
  category: string;
  type: string;
  colors: number;
  features?: string[];
  description?: string;
};

type CompareContextType = {
  compareItems: CompareProduct[];
  addToCompare: (product: CompareProduct) => void;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareItems, setCompareItems] = useState<CompareProduct[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("tth_compare");
    if (saved) {
      try {
        setCompareItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load compare items", e);
      }
    }
  }, []);

  const addToCompare = (product: CompareProduct) => {
    if (compareItems.length >= 4) {
      alert("You can compare up to 4 products at a time.");
      return;
    }
    if (compareItems.find(item => item.id === product.id)) return;
    
    const updated = [...compareItems, product];
    setCompareItems(updated);
    localStorage.setItem("tth_compare", JSON.stringify(updated));
  };

  const removeFromCompare = (id: string) => {
    const updated = compareItems.filter(item => item.id !== id);
    setCompareItems(updated);
    localStorage.setItem("tth_compare", JSON.stringify(updated));
  };

  const isInCompare = (id: string) => compareItems.some(item => item.id === id);

  const clearCompare = () => {
    setCompareItems([]);
    localStorage.removeItem("tth_compare");
  };

  return (
    <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
