"use client";

import { useState } from "react";
import styles from "./RecentOperationsFeed.module.css";
import Link from "next/link";
import { ChevronRight, ArrowUpRight, Filter, ShoppingBag } from "lucide-react";

interface OrderItem {
  id: string;
  orderNumber?: number;
  totalAmount: number;
  status: string;
  createdAt: Date | string;
  user: {
    name: string | null;
    email: string | null;
    companyName?: string | null;
  };
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
  orders: OrderItem[];
}

export default function RecentOperationsFeed({ orders }: { orders: OrderItem[] }) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filteredOrders = filterStatus === "ALL" 
    ? orders 
    : orders.filter((o) => o.status.toUpperCase() === filterStatus);

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return styles.statusPending;
      case "PROCESSING":
        return styles.statusProcessing;
      case "SHIPPED":
        return styles.statusShipped;
      case "DELIVERED":
        return styles.statusDelivered;
      case "CANCELLED":
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <section className={styles.ledgerConsole} aria-label="Operations Feed & Ledger">
      {/* Ledger Header */}
      <div className={styles.ledgerHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.tagMono}>LOGS // CHRONOLOGICAL ACTIVITY</div>
          <h3 className={styles.ledgerTitle}>Recent Operations Feed</h3>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.filterPills}>
            {["ALL", "PENDING", "PROCESSING", "DELIVERED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`${styles.filterBtn} ${filterStatus === st ? styles.filterActive : ""}`}
              >
                {st}
              </button>
            ))}
          </div>

          <Link href="/admin/orders" className={styles.fullLedgerLink}>
            <span>Full Order Ledger</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Chronological Feed Table */}
      <div className={styles.feedWrapper}>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyFeed}>
            <ShoppingBag size={22} className={styles.emptyIcon} />
            <span className={styles.emptyText}>No operations recorded for the selected filter.</span>
          </div>
        ) : (
          <div className={styles.feedList}>
            {filteredOrders.map((o) => {
              const orderDate = new Date(o.createdAt);
              const timeStr = orderDate.toLocaleTimeString("en-IN", { 
                hour: "2-digit", 
                minute: "2-digit",
                hour12: false
              });
              const dateStr = orderDate.toLocaleDateString("en-IN", { 
                day: "2-digit", 
                month: "short" 
              });
              const orderRef = o.orderNumber ? `#TT-${o.orderNumber}` : `#${o.id.slice(-6).toUpperCase()}`;
              const totalUnits = o.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
              const clientName = o.user.companyName || o.user.name || o.user.email || "B2B Client";

              return (
                <div key={o.id} className={styles.feedRow}>
                  {/* Timestamp & Code */}
                  <div className={styles.timeCell}>
                    <span className={styles.timeMono}>{timeStr}</span>
                    <span className={styles.dateMono}>{dateStr}</span>
                  </div>

                  {/* Ref & Type */}
                  <div className={styles.refCell}>
                    <span className={styles.typeBadge}>ORDER</span>
                    <span className={styles.refCode}>{orderRef}</span>
                  </div>

                  {/* Client & Description */}
                  <div className={styles.descCell}>
                    <div className={styles.clientTitle}>{clientName}</div>
                    <div className={styles.clientMeta}>
                      {totalUnits} units • {o.items.length} style{o.items.length === 1 ? "" : "s"}
                      {o.items[0]?.product?.name ? ` (${o.items[0].product.name})` : ""}
                    </div>
                  </div>

                  {/* Amount Value */}
                  <div className={styles.amountCell}>
                    <span className={styles.amountMono}>₹{o.totalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  {/* Status */}
                  <div className={styles.statusCell}>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(o.status)}`}>
                      {o.status}
                    </span>
                  </div>

                  {/* Action Link */}
                  <div className={styles.actionCell}>
                    <Link href={`/admin/orders`} className={styles.actionBtn}>
                      <span>Inspect</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
