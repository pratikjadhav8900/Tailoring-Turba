"use client";
import React, { useState, useEffect } from "react";
import { useTurbaAi } from "@/contexts/TurbaAiContext";
import { Sparkles, MessageSquare } from "lucide-react";
import styles from "./TurbaAi.module.css";

export default function TurbaAiLauncher() {
  const { isOpen, isMinimized, toggleChat, unreadCount } = useTurbaAi();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  // If the chat is open and not minimized, hide launcher (modal header handles minimize/close)
  if (isOpen && !isMinimized) return null;

  return (
    <div className={styles.circleLauncherWrapper}>
      <button
        type="button"
        onClick={toggleChat}
        className={styles.circleLauncherBtn}
        aria-label="Open Turba AI Consultant"
        title="Turba AI — Apparel Manufacturing Consultant"
      >
        {/* Atelier Monogram & Sparkle */}
        <div className={styles.launcherInnerContent}>
          <span className={styles.launcherMonogramText}>TT</span>
          <Sparkles size={11} className={styles.launcherSparkleIcon} />
        </div>

        {/* Ambient subtle breathing ring */}
        <span className={styles.turbaAiPulse} />

        {/* Unread message count badge */}
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount}</span>
        )}
      </button>

      {/* Floating hover tag (Cosmos style) */}
      <div className={styles.circleLauncherLabel}>
        <div className={styles.labelHeader}>
          <span className={styles.labelTitle}>Turba AI</span>
        </div>
        <div className={styles.labelSubtitle}>Apparel Consultant</div>
      </div>
    </div>
  );
}
