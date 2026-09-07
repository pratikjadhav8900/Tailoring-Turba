"use client";

import styles from "./RecentOperationsFeed.module.css";
import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";

export interface ActivityOrderItem {
  id: string;
  orderNumber?: number | null;
  totalAmount: number;
  status: string;
  createdAt: Date | string;
  user?: {
    name?: string | null;
    email?: string | null;
    companyName?: string | null;
  } | null;
  items: {
    id: string;
    quantity: number;
    product?: {
      name: string;
      sku?: string | null;
    } | null;
  }[];
}

interface RecentOperationsFeedProps {
  orders: ActivityOrderItem[];
  newInquiries?: {
    id: string;
    name: string;
    quantity: number;
    companyName?: string | null;
    createdAt: Date | string;
  }[];
}

export default function RecentOperationsFeed({
  orders,
  newInquiries = [],
}: RecentOperationsFeedProps) {
  // Merge orders and inquiries into a unified chronological activity stream
  const events = [
    ...orders.map((o) => ({
      id: `order-${o.id}`,
      type: "ORDER" as const,
      refId: o.orderNumber ? `#TT-${String(o.orderNumber).padStart(4, "0")}` : `#${o.id.slice(-6).toUpperCase()}`,
      title: o.user?.companyName || o.user?.name || "Client Order",
      meta: `${o.items.reduce((sum, i) => sum + (i.quantity || 1), 0)} pcs • ₹${o.totalAmount.toLocaleString("en-IN")}`,
      timestamp: new Date(o.createdAt),
      status: o.status,
      url: `/admin/orders/${o.id}`,
    })),
    ...newInquiries.map((inq) => ({
      id: `inq-${inq.id}`,
      type: "INQUIRY" as const,
      refId: `#INQ-${inq.id.slice(-4).toUpperCase()}`,
      title: inq.companyName ? `${inq.name} (${inq.companyName})` : inq.name,
      meta: `${inq.quantity} units requested`,
      timestamp: new Date(inq.createdAt),
      status: "NEW",
      url: `/admin/inquiries`,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className={styles.activityConsole} role="region" aria-label="Recent Operational Activity">
      {/* Activity Header */}
      <div className={styles.consoleHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.tagMono}>LIVE ACTIVITY LOG</div>
          <h3 className={styles.consoleTitle}>Recent Activity</h3>
        </div>

        <Link href="/admin/orders" className={styles.headerLink}>
          <span>Order Ledger</span>
          <ArrowRight size={11} className={styles.btnArrow} />
        </Link>
      </div>

      {/* Activity Log Feed */}
      <div className={styles.feedWrapper}>
        {events.length === 0 ? (
          <div className={styles.emptyLog}>
            <Activity size={20} className={styles.emptyIcon} />
            <p>No recent operational events recorded in this cycle.</p>
          </div>
        ) : (
          <div className={styles.logList}>
            {events.slice(0, 6).map((item) => {
              const timeFormatted = item.timestamp.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              const dateFormatted = item.timestamp.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              });

              const isOrder = item.type === "ORDER";

              return (
                <div key={item.id} className={styles.logRow}>
                  {/* Timestamp */}
                  <div className={styles.timeCell}>
                    <span className={styles.timeMono}>{timeFormatted}</span>
                    <span className={styles.dateMono}>{dateFormatted}</span>
                  </div>

                  {/* Type Badge */}
                  <div className={styles.typeCell}>
                    <span 
                      className={`${styles.typeTag} ${isOrder ? styles.tagOrder : styles.tagInq}`}
                    >
                      {item.type}
                    </span>
                    <span className={styles.refCode}>{item.refId}</span>
                  </div>

                  {/* Description */}
                  <div className={styles.descCell}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <div className={styles.itemMeta}>{item.meta}</div>
                  </div>

                  {/* Action Link */}
                  <div className={styles.actionCell}>
                    <Link href={item.url} className={styles.rowActionLink} aria-label={`View ${item.refId}`}>
                      <ArrowRight size={12} className={styles.btnArrow} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
