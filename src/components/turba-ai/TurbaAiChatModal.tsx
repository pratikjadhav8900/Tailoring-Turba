"use client";
import React, { useState, useRef, useEffect } from "react";
import { useTurbaAi } from "@/contexts/TurbaAiContext";
import TurbaAiProductCard from "./TurbaAiProductCard";
import { 
  Minus, 
  X, 
  RotateCcw, 
  ArrowUp, 
  ArrowUpRight, 
  Bot,
  Layers,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./TurbaAi.module.css";

export default function TurbaAiChatModal() {
  const {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    error,
    minimizeChat,
    closeChat,
    resetChat,
    sendMessage,
    selectQuickOption,
    viewProduct,
    openInCustomizer,
  } = useTurbaAi();

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  // Keyboard shortcut: Escape minimizes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isMinimized) {
        minimizeChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMinimized, minimizeChat]);

  if (!isOpen || isMinimized) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isTyping) return;
    const text = inputVal;
    setInputVal("");
    await sendMessage(text);
  };

  return (
    <>
      {/* Soft blurred ambient backdrop */}
      <div 
        className={`${styles.modalBackdrop} ${isOpen && !isMinimized ? styles.modalBackdropActive : ""}`} 
        onClick={minimizeChat} 
        aria-hidden="true" 
      />

      <AnimatePresence>
        <motion.div 
          className={styles.panelContainer} 
          role="dialog" 
          aria-modal="true" 
          aria-label="Turba Atelier AI Consultant"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile Drag / Dismiss Handle */}
          <div 
            className={styles.mobileDragHandleArea} 
            onClick={closeChat} 
            title="Tap or drag to close"
            aria-label="Close Turba AI"
            role="button"
            tabIndex={0}
          >
            <span className={styles.mobileDragHandle} />
          </div>

          {/* ── ATELIER HEADER (Cosmos / Luma style) ── */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={closeChat}
                className={styles.backBtn}
                title="Back to store"
                aria-label="Back to store"
              >
                <ChevronLeft size={20} />
              </button>

              <div className={styles.avatarOrbWrapper}>
                <div className={styles.avatarMonogram}>
                  <span>TT</span>
                </div>
                <span className={styles.ambientPulseRing} />
              </div>

              <div className={styles.titleArea}>
                <div className={styles.titleRow}>
                  <h3 className={styles.titleMain}>Turba AI</h3>
                </div>
                <div className={styles.statusRow}>
                  <span className={styles.statusDotLive} />
                  <span className={styles.titleSub}>Factory Direct • Online</span>
                </div>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={resetChat}
                className={styles.headerIconBtn}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={minimizeChat}
                className={styles.headerIconBtnMinimize}
                title="Minimize chat"
                aria-label="Minimize Turba AI"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={closeChat}
                className={styles.headerIconBtnClose}
                title="Close chat"
                aria-label="Close Turba AI"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* ── MESSAGES FEED ── */}
          <div className={styles.messagesScroll}>
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              return (
                <motion.div
                  key={msg.id}
                  className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowAssistant}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: idx === 0 ? 0 : 0.04 }}
                >
                  {!isUser && (
                    <div className={styles.assistantMetaRow}>
                      <span className={styles.assistantLabel}>TURBA AI</span>
                      <span className={styles.metaDivider}>•</span>
                      <span className={styles.timeTag}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  <div className={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
                    {msg.text}
                  </div>

                  {/* Quick Interactive Suggestion Cards (Cosmos / 21st.dev style) */}
                  {!isUser && msg.quickOptions && msg.quickOptions.length > 0 && (
                    <div className={styles.quickOptionsWrapper}>
                      {msg.quickOptions.map((opt, optIdx) => (
                        <button
                          key={`${msg.id}-opt-${optIdx}`}
                          type="button"
                          onClick={() => selectQuickOption(opt)}
                          className={styles.quickOptionChip}
                        >
                          <span className={styles.chipText}>{opt.label}</span>
                          <ArrowUpRight size={13} className={styles.chipArrow} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Embedded Real Products Recommendation (Luxury Showcase Cards) */}
                  {!isUser && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className={styles.productCardsContainer}>
                      <div className={styles.productCatalogHeader}>
                        <Layers size={13} />
                        <span>Factory Catalog Matches</span>
                      </div>
                      {msg.recommendedProducts.map((prod) => (
                        <TurbaAiProductCard
                          key={`rec-${prod.id}`}
                          product={prod}
                          onViewProduct={viewProduct}
                          onCustomize={openInCustomizer}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className={styles.typingRow} aria-label="Turba AI is consulting...">
                <div className={styles.typingAvatar}>
                  <Bot size={12} />
                </div>
                <div className={styles.typingCard}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorBanner}>
              <span>{error}</span>
            </div>
          )}

          {/* ── COMMAND BAR INPUT (21st.dev / Cosmos Element) ── */}
          <div className={styles.inputAreaWrapper}>
            <form onSubmit={handleSend} className={styles.commandBar}>
              <div className={styles.inputRow}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Inquire about fabrics, GSM, styles, or minimum order..."
                  className={styles.inputField}
                  disabled={isTyping}
                  aria-label="Message Turba AI"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isTyping}
                  className={styles.sendBtn}
                  title="Send inquiry"
                  aria-label="Send message"
                >
                  <ArrowUp size={15} strokeWidth={2.5} />
                </button>
              </div>

              <div className={styles.commandBarFooter}>
                <div className={styles.commandHint}>
                  <span className={styles.kbdKey}>↵</span>
                  <span>Press Enter to send</span>
                </div>
                <div className={styles.brandBadge}>
                  <CheckCircle2 size={11} className={styles.brandIcon} />
                  <span>B2B Bespoke Atelier</span>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
