"use client";

import styles from "./CurrentFocusBanner.module.css";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileText } from "lucide-react";

interface CurrentFocusBannerProps {
  pendingCount: number;
  newInquiriesCount: number;
  firstPendingOrder?: {
    id: string;
    orderNumber?: number;
    user?: {
      name?: string | null;
      email?: string | null;
      companyName?: string | null;
    } | null;
    totalAmount?: number;
  } | null;
  firstNewInquiry?: {
    id: string;
    name: string;
    quantity: number;
    companyName?: string | null;
  } | null;
}

export default function CurrentFocusBanner({
  pendingCount,
  newInquiriesCount,
  firstPendingOrder,
  firstNewInquiry,
}: CurrentFocusBannerProps) {
  // Determine the highest priority operational focus
  if (pendingCount > 0 && firstPendingOrder) {
    const orderRef = firstPendingOrder.orderNumber 
      ? `#TT-${String(firstPendingOrder.orderNumber).padStart(4, "0")}` 
      : `#${firstPendingOrder.id.slice(-6).toUpperCase()}`;
    const clientName = firstPendingOrder.user?.companyName || firstPendingOrder.user?.name || "Client";
    const amountStr = firstPendingOrder.totalAmount 
      ? `₹${firstPendingOrder.totalAmount.toLocaleString("en-IN")}` 
      : "";

    return (
      <div className={`${styles.focusBar} ${styles.focusAttention}`} role="region" aria-label="Operational Focus">
        <div className={styles.focusLeft}>
          <div className={styles.focusBadgeAttention}>
            <Clock size={12} className={styles.pulseIcon} />
            <span>CURRENT FOCUS</span>
          </div>
          <div className={styles.focusMessage}>
            <span className={styles.focusLead}>
              {pendingCount === 1 
                ? `1 order awaiting intake verification` 
                : `${pendingCount} orders awaiting intake verification`}
            </span>
            <span className={styles.focusDetails}>
              {orderRef} ({clientName}{amountStr ? ` • ${amountStr}` : ""}) requires review before manufacturing allocation.
            </span>
          </div>
        </div>

        <Link href={`/admin/orders/${firstPendingOrder.id}`} className={styles.focusActionAttention}>
          <span>Review Order</span>
          <ArrowRight size={13} className={styles.actionArrow} />
        </Link>
      </div>
    );
  }

  if (newInquiriesCount > 0 && firstNewInquiry) {
    const clientName = firstNewInquiry.companyName || firstNewInquiry.name;

    return (
      <div className={`${styles.focusBar} ${styles.focusLead}`} role="region" aria-label="Operational Focus">
        <div className={styles.focusLeft}>
          <div className={styles.focusBadgeLead}>
            <FileText size={12} />
            <span>CURRENT FOCUS</span>
          </div>
          <div className={styles.focusMessage}>
            <span className={styles.focusLead}>
              {newInquiriesCount === 1 
                ? `1 new B2B inquiry pending quotation` 
                : `${newInquiriesCount} new B2B inquiries pending quotation`}
            </span>
            <span className={styles.focusDetails}>
              {clientName} ({firstNewInquiry.quantity} pcs target) awaiting fabric specification &amp; pricing quote.
            </span>
          </div>
        </div>

        <Link href="/admin/inquiries" className={styles.focusActionLead}>
          <span>Open Inquiries</span>
          <ArrowRight size={13} className={styles.actionArrow} />
        </Link>
      </div>
    );
  }

  return (
    <div className={`${styles.focusBar} ${styles.focusClear}`} role="region" aria-label="Operational Focus">
      <div className={styles.focusLeft}>
        <div className={styles.focusBadgeClear}>
          <CheckCircle2 size={12} />
          <span>CURRENT FOCUS</span>
        </div>
        <div className={styles.focusMessage}>
          <span className={styles.focusLead}>Operations are clear</span>
          <span className={styles.focusDetails}>
            All order queues nominal. Manufacturing and inquiry pipelines up to date.
          </span>
        </div>
      </div>

      <Link href="/admin/orders" className={styles.focusActionClear}>
        <span>Order Ledger</span>
        <ArrowRight size={13} className={styles.actionArrow} />
      </Link>
    </div>
  );
}
