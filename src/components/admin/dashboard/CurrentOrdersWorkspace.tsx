"use client";

import { useState, useMemo } from "react";
import styles from "./CurrentOrdersWorkspace.module.css";
import Link from "next/link";
import { 
  ShoppingBag, 
  Search, 
  ArrowRight, 
  ChevronRight,
  Split
} from "lucide-react";

export interface DashboardOrderItem {
  id: string;
  orderNumber?: number | null;
  totalAmount: number;
  status: string;
  isSplitPayment?: boolean;
  remainingAmount?: number | null;
  amountPaid?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    companyName?: string | null;
    phone?: string | null;
  } | null;
  shippingAddress?: {
    city?: string | null;
    state?: string | null;
  } | null;
  items: {
    id: string;
    quantity: number;
    price?: number;
    product?: {
      id?: string;
      name: string;
      sku?: string | null;
      gsm?: number | null;
    } | null;
  }[];
}

interface CurrentOrdersWorkspaceProps {
  orders: DashboardOrderItem[];
  totalOrdersCount: number;
}

export default function CurrentOrdersWorkspace({
  orders,
  totalOrdersCount,
}: CurrentOrdersWorkspaceProps) {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Real counts for filters
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: orders.length,
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orders.forEach((o) => {
      const st = o.status.toUpperCase();
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });

    return counts;
  }, [orders]);

  // Filter and search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeFilter !== "ALL" && order.status.toUpperCase() !== activeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const orderRef = order.orderNumber ? `tt-${order.orderNumber}` : order.id.toLowerCase();
        const userName = (order.user?.name || "").toLowerCase();
        const userEmail = (order.user?.email || "").toLowerCase();
        const company = (order.user?.companyName || "").toLowerCase();
        const productNames = order.items.map((i) => (i.product?.name || "").toLowerCase()).join(" ");

        return (
          orderRef.includes(query) ||
          userName.includes(query) ||
          userEmail.includes(query) ||
          company.includes(query) ||
          productNames.includes(query)
        );
      }

      return true;
    });
  }, [orders, activeFilter, searchQuery]);

  const getStatusIndicator = (status: string) => {
    const st = status.toUpperCase();
    switch (st) {
      case "PENDING":
        return {
          label: "PENDING INTAKE",
          dotClass: styles.dotClay,
          textClass: styles.textClay,
        };
      case "PROCESSING":
        return {
          label: "IN PRODUCTION",
          dotClass: styles.dotGreen,
          textClass: styles.textGreen,
        };
      case "SHIPPED":
        return {
          label: "IN TRANSIT",
          dotClass: styles.dotGreen,
          textClass: styles.textGreen,
        };
      case "DELIVERED":
        return {
          label: "FULFILLED",
          dotClass: styles.dotSage,
          textClass: styles.textSage,
        };
      case "CANCELLED":
        return {
          label: "CANCELLED",
          dotClass: styles.dotMuted,
          textClass: styles.textMuted,
        };
      default:
        return {
          label: st,
          dotClass: styles.dotSage,
          textClass: styles.textSage,
        };
    }
  };

  const filterTabs = [
    { key: "ALL", label: "ALL ORDERS", count: countsByStatus.ALL },
    { key: "PENDING", label: "PENDING", count: countsByStatus.PENDING },
    { key: "PROCESSING", label: "IN PRODUCTION", count: countsByStatus.PROCESSING },
    { key: "SHIPPED", label: "IN TRANSIT", count: countsByStatus.SHIPPED },
    { key: "DELIVERED", label: "FULFILLED", count: countsByStatus.DELIVERED },
  ];

  return (
    <section className={styles.sectionRoot} aria-label="Current Orders Operational Table">
      {/* Editorial Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <span className={styles.sectionCode}>OPS-01 // REAL-TIME DISPATCH</span>
            <div className={styles.countBadge}>
              <span className={styles.countNumber}>{orders.length}</span>
              <span className={styles.countLabel}>ACTIVE RECORDED</span>
            </div>
          </div>
          <h2 className={styles.sectionTitle}>Current Orders</h2>
        </div>

        <div className={styles.headerRight}>
          {/* Search Box */}
          <div className={styles.searchBox}>
            <Search size={13} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Ref, Client, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Filter current orders"
            />
          </div>

          <Link href="/admin/orders" className={styles.viewAllBtn}>
            <span>View All Orders</span>
            <ArrowRight size={12} className={styles.btnArrow} />
          </Link>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterTabs} role="tablist" aria-label="Filter orders by stage">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(tab.key)}
                className={`${styles.filterTab} ${isActive ? styles.tabActive : ""}`}
              >
                <span>{tab.label}</span>
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterMeta}>
          <span>Showing {filteredOrders.length} of {totalOrdersCount} ledger records</span>
        </div>
      </div>

      {/* Clean Table Workspace */}
      <div className={styles.tableWrapper}>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingBag size={24} className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>
              {searchQuery ? "No matching orders found" : "All clear in this queue"}
            </div>
            <p className={styles.emptySub}>
              {searchQuery
                ? `No orders match "${searchQuery}". Clear filter to display all orders.`
                : "All orders in this stage have been fulfilled or dispatched downstream."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.clearSearchBtn}
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <table className={styles.ordersTable}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.thOrder}>ORDER</th>
                <th className={styles.thCustomer}>CLIENT / COMPANY</th>
                <th className={styles.thItems}>ITEMS &amp; STYLES</th>
                <th className={styles.thValue}>VALUE</th>
                <th className={styles.thStatus}>STATUS</th>
                <th className={styles.thTime}>UPDATED</th>
                <th className={styles.thAction}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const indicator = getStatusIndicator(order.status);
                const orderRef = order.orderNumber 
                  ? `#TT-${String(order.orderNumber).padStart(4, "0")}` 
                  : `#${order.id.slice(-6).toUpperCase()}`;
                
                const clientName = order.user?.companyName || order.user?.name || "Client";
                const clientEmail = order.user?.email || "—";
                
                const totalUnits = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
                const firstProductName = order.items[0]?.product?.name || "Apparel Item";
                const extraStylesCount = order.items.length - 1;
                const gsmValue = order.items[0]?.product?.gsm;

                const orderDate = new Date(order.createdAt);
                const timeFormatted = orderDate.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                const dateFormatted = orderDate.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                });

                return (
                  <tr key={order.id} className={styles.tableRow}>
                    {/* ORDER REF */}
                    <td className={styles.tdOrder}>
                      <Link href={`/admin/orders/${order.id}`} className={styles.refLink}>
                        <span className={styles.refMono}>{orderRef}</span>
                        {order.isSplitPayment && (
                          <span className={styles.splitTag} title="Milestone Split Payment">
                            <Split size={9} />
                            <span>SPLIT</span>
                          </span>
                        )}
                      </Link>
                    </td>

                    {/* CLIENT / COMPANY */}
                    <td className={styles.tdCustomer}>
                      <div className={styles.customerBlock}>
                        <span className={styles.customerName}>{clientName}</span>
                        <span className={styles.customerEmail}>{clientEmail}</span>
                      </div>
                    </td>

                    {/* ITEMS & STYLES */}
                    <td className={styles.tdItems}>
                      <div className={styles.itemsBlock}>
                        <div className={styles.unitsRow}>
                          <span className={styles.unitsCount}>{totalUnits}</span>
                          <span className={styles.unitsLabel}>units</span>
                          {gsmValue && (
                            <span className={styles.gsmTag}>{gsmValue} GSM</span>
                          )}
                        </div>
                        <div className={styles.stylesList}>
                          {firstProductName}
                          {extraStylesCount > 0 && ` +${extraStylesCount} more`}
                        </div>
                      </div>
                    </td>

                    {/* VALUE */}
                    <td className={styles.tdValue}>
                      <div className={styles.valueBlock}>
                        <span className={styles.valueMono}>
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                        </span>
                        {order.isSplitPayment && order.remainingAmount && order.remainingAmount > 0 && (
                          <span className={styles.balMuted}>
                            Bal: ₹{order.remainingAmount.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* STATUS INDICATOR (Minimal Dot + Text) */}
                    <td className={styles.tdStatus}>
                      <div className={styles.statusCell}>
                        <span className={`${styles.statusDot} ${indicator.dotClass}`} />
                        <span className={`${styles.statusText} ${indicator.textClass}`}>
                          {indicator.label}
                        </span>
                      </div>
                    </td>

                    {/* UPDATED / TIME */}
                    <td className={styles.tdTime}>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeMono}>{timeFormatted}</span>
                        <span className={styles.dateMono}>{dateFormatted}</span>
                      </div>
                    </td>

                    {/* ACTION */}
                    <td className={styles.tdAction}>
                      <Link href={`/admin/orders/${order.id}`} className={styles.rowActionBtn}>
                        <span>View</span>
                        <ChevronRight size={13} className={styles.rowChevron} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Stacked Records (<= 640px) */}
      <div className={styles.mobileRecordsList}>
        {filteredOrders.map((order) => {
          const indicator = getStatusIndicator(order.status);
          const orderRef = order.orderNumber 
            ? `#TT-${String(order.orderNumber).padStart(4, "0")}` 
            : `#${order.id.slice(-6).toUpperCase()}`;
          const clientName = order.user?.companyName || order.user?.name || "Client";
          const totalUnits = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
          const firstProductName = order.items[0]?.product?.name || "Apparel Item";
          const orderDate = new Date(order.createdAt);
          const dateFormatted = orderDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          });

          return (
            <Link 
              key={order.id} 
              href={`/admin/orders/${order.id}`}
              className={styles.mobileCardRecord}
            >
              <div className={styles.mobTop}>
                <div className={styles.mobRefGroup}>
                  <span className={styles.mobRef}>{orderRef}</span>
                  <div className={styles.statusCell}>
                    <span className={`${styles.statusDot} ${indicator.dotClass}`} />
                    <span className={`${styles.statusText} ${indicator.textClass}`}>
                      {indicator.label}
                    </span>
                  </div>
                </div>
                <span className={styles.mobValue}>₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className={styles.mobClientRow}>
                <span className={styles.mobClientName}>{clientName}</span>
                <span className={styles.mobDate}>{dateFormatted}</span>
              </div>

              <div className={styles.mobItemsRow}>
                <span className={styles.mobUnits}>{totalUnits} units</span>
                <span className={styles.mobStyle}>• {firstProductName}</span>
              </div>

              <div className={styles.mobFoot}>
                <span>Inspect Order Record</span>
                <ChevronRight size={13} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
