"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TurbaCustomerContext,
  TurbaMessage,
  TurbaQuickOption,
  RecommendedProduct,
} from "@/types/turba-ai";
import { INITIAL_QUICK_OPTIONS } from "@/lib/turba-ai/knowledge";

interface TurbaAiContextType {
  isOpen: boolean;
  isMinimized: boolean;
  messages: TurbaMessage[];
  context: TurbaCustomerContext;
  isTyping: boolean;
  error: string | null;
  unreadCount: number;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  expandChat: () => void;
  toggleChat: () => void;
  resetChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  selectQuickOption: (option: TurbaQuickOption) => Promise<void>;
  openInCustomizer: (product: RecommendedProduct) => void;
  viewProduct: (product: RecommendedProduct) => void;
}

const STORAGE_KEY = "tailoring_turba_ai_consultant_v3";

const INITIAL_MESSAGE: TurbaMessage = {
  id: "msg-welcome-01",
  sender: "assistant",
  text: "Welcome to Tailoring Turba. I am your custom apparel manufacturing consultant.\nTell me what you are looking to create for your brand or team, or select a category below to get started:",
  timestamp: Date.now(),
  quickOptions: INITIAL_QUICK_OPTIONS,
};

const TurbaAiContext = createContext<TurbaAiContextType | undefined>(undefined);

export function TurbaAiProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<TurbaMessage[]>([INITIAL_MESSAGE]);
  const [context, setContext] = useState<TurbaCustomerContext>({});
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load persisted session on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        }
        if (parsed.context) {
          setContext(parsed.context);
        }
      }
    } catch (e) {
      console.warn("[TurbaAI] Failed to load session from storage:", e);
    }
  }, []);

  // Save session updates
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, context })
      );
    } catch (e) {
      console.warn("[TurbaAI] Failed to save session:", e);
    }
  }, [messages, context]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const expandChat = useCallback(() => {
    setIsMinimized(false);
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const toggleChat = useCallback(() => {
    if (!isOpen) {
      openChat();
    } else if (isMinimized) {
      expandChat();
    } else {
      minimizeChat();
    }
  }, [isOpen, isMinimized, openChat, expandChat, minimizeChat]);

  const resetChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setContext({});
    setError(null);
    setUnreadCount(0);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: TurbaMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: "user",
        text: trimmed,
        timestamp: Date.now(),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsTyping(true);
      setError(null);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            context,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get consultant response");
        }

        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          if (data.updatedContext) {
            setContext(data.updatedContext);
          }
          if (isMinimized || !isOpen) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      } catch (err: any) {
        console.error("[TurbaAI] Send error:", err);
        setError("Looks like I'm having a little trouble connecting right now. You can try again in a moment.");
      } finally {
        setIsTyping(false);
      }
    },
    [messages, context, isTyping, isOpen, isMinimized]
  );

  const selectQuickOption = useCallback(
    async (option: TurbaQuickOption) => {
      await sendMessage(option.label || option.value);
    },
    [sendMessage]
  );

  // Navigate to product page while keeping AI chat minimized and persistent
  const viewProduct = useCallback(
    (product: RecommendedProduct) => {
      minimizeChat();
      router.push(`/products/${product.id}`);
    },
    [minimizeChat, router]
  );

  // Navigate directly into Customizer Studio passing AI context
  const openInCustomizer = useCallback(
    (product: RecommendedProduct) => {
      minimizeChat();
      // Pass AI parameters into customizer
      const params = new URLSearchParams();
      params.set("id", String(product.id));
      params.set("fromAi", "true");
      if (context.printingMethod) {
        params.set("aiPrintMethod", context.printingMethod);
      }
      if (context.quantity) {
        params.set("aiQuantity", String(context.quantity));
      }
      if (context.color) {
        params.set("colorValue", context.color);
      }
      router.push(`/customizer?${params.toString()}`);
    },
    [minimizeChat, router, context]
  );

  return (
    <TurbaAiContext.Provider
      value={{
        isOpen,
        isMinimized,
        messages,
        context,
        isTyping,
        error,
        unreadCount,
        openChat,
        closeChat,
        minimizeChat,
        expandChat,
        toggleChat,
        resetChat,
        sendMessage,
        selectQuickOption,
        openInCustomizer,
        viewProduct,
      }}
    >
      {children}
    </TurbaAiContext.Provider>
  );
}

export function useTurbaAi() {
  const context = useContext(TurbaAiContext);
  if (!context) {
    throw new Error("useTurbaAi must be used within a TurbaAiProvider");
  }
  return context;
}
