"use client";

import { useEffect, useState } from "react";
import styles from "./AdminHeader.module.css";
import Link from "next/link";
import { 
  Plus, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface AdminHeaderProps {
  orderCount: number;
  pendingCount: number;
}

export default function AdminHeader({ orderCount, pendingCount }: AdminHeaderProps) {
  const [salutation, setSalutation] = useState("GOOD MORNING");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setSalutation("GOOD MORNING");
    else if (hour < 17) setSalutation("GOOD AFTERNOON");
    else setSalutation("GOOD EVENING");

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
    <header className={styles.workspaceHeader}>
      <div className={styles.headerMain}>
        {/* Left: Operational Context */}
        <div className={styles.contextLeft}>
          <div className={styles.salutation}>{salutation}</div>
          <h1 className={styles.headline}>MANUFACTURING OPERATIONS</h1>
          <p className={styles.subtext}>
            Production, orders and customer activity at a glance.
          </p>
        </div>

        {/* Right: Real Date, Operational State & Fast Links */}
        <div className={styles.telemetryRight}>
          <div className={styles.statusRow}>
            <div className={styles.dateChip}>
              <span className={styles.dateLabel}>CURRENT DATE</span>
              <span className={styles.dateValue}>{currentDate || "LIVE"}</span>
            </div>

            <div className={hasPendingItems ? styles.statusChipAttention : styles.statusChipNominal}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>
                {hasPendingItems ? `TRIAGE: ${pendingCount} PENDING ACTION` : "OPERATIONS STEADY"}
              </span>
            </div>
          </div>

          {/* Compact Quick Actions */}
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
