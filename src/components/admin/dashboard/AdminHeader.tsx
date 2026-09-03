"use client";

import { useEffect, useState } from "react";
import styles from "./AdminHeader.module.css";
import Link from "next/link";
import { Plus, ShoppingBag, Clock } from "lucide-react";

interface AdminHeaderProps {
  pendingCount: number;
}

export default function AdminHeader({ pendingCount }: AdminHeaderProps) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
    setCurrentDate(formatted);
  }, []);

  const hasPendingItems = pendingCount > 0;

  return (
    <header className={styles.workspaceHeader} role="banner">
      <div className={styles.headerMain}>
        {/* Left: Operational Context & Editorial Hierarchy */}
        <div className={styles.contextLeft}>
          <div className={styles.monoLabel}>OPERATIONS CONTROL // DISPATCH</div>
          <h1 className={styles.headline}>Operations Overview</h1>
          <p className={styles.subtext}>
            Real-time manufacturing pipeline, order intake and enterprise ledger.
          </p>
        </div>

        {/* Right: Real Date, Operational State & Fast Links */}
        <div className={styles.telemetryRight}>
          <div className={styles.statusRow}>
            <div className={styles.dateChip}>
              <span className={styles.dateLabel}>DATE</span>
              <span className={styles.dateValue}>{currentDate || "LIVE"}</span>
            </div>

            <div className={hasPendingItems ? styles.statusChipAttention : styles.statusChipNominal}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>
                {hasPendingItems ? `TRIAGE: ${pendingCount} PENDING` : "OPERATIONS NOMINAL"}
              </span>
            </div>
          </div>

          {/* Standardized Quick Action Controls */}
          <div className={styles.quickActionGroup}>
            <Link href="/admin/products" className={styles.primaryActionBtn}>
              <Plus size={13} strokeWidth={2.5} />
              <span>New Product</span>
            </Link>
            <Link href="/admin/orders" className={styles.secondaryActionBtn}>
              <ShoppingBag size={13} />
              <span>Orders</span>
            </Link>
            <Link href="/admin/inquiries" className={styles.secondaryActionBtn}>
              <Clock size={13} />
              <span>Inquiries</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
