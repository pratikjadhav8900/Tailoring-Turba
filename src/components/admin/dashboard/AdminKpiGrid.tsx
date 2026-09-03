"use client";

import styles from "./AdminKpiGrid.module.css";
import Link from "next/link";
import AnimatedNumber from "./AnimatedNumber";
import { 
  Clock, 
  Calendar, 
  Shirt, 
  Scissors,
  ArrowRight
} from "lucide-react";

interface KpiProps {
  revenue: number;
  userCount: number;
  orderCount: number;
  pendingOrders: number;
  processingOrders: number;
  bookingCount: number;
  productCount: number;
}

export default function AdminKpiGrid({
  revenue,
  userCount,
  orderCount,
  pendingOrders,
  processingOrders,
  bookingCount,
  productCount,
}: KpiProps) {
  return (
    <section className={styles.metricsSection} aria-label="Enterprise Performance Metrics">
      {/* Primary Dominant Metrics Tier */}
      <div className={styles.primaryGrid}>
        {/* Primary 1: Gross Revenue */}
        <div className={styles.primaryBlock}>
          <div className={styles.blockMeta}>
            <span className={styles.metricCode}>REV-01</span>
            <span className={styles.categoryTag}>COMMERCE</span>
          </div>
          <div className={styles.metricLabel}>Gross Revenue</div>
          <div className={styles.primaryValueRow}>
            <span className={styles.currencyPrefix}>₹</span>
            <AnimatedNumber
              value={revenue}
              formatCurrency={true}
              className={styles.primaryNumber}
            />
          </div>
          <div className={styles.metricFootnote}>
            Cumulative realized revenue from {orderCount} confirmed order{orderCount === 1 ? "" : "s"}
          </div>
        </div>

        {/* Primary 2: Registered Clients */}
        <div className={styles.primaryBlock}>
          <div className={styles.blockMeta}>
            <span className={styles.metricCode}>ACC-02</span>
            <span className={styles.categoryTag}>CLIENTELE</span>
          </div>
          <div className={styles.metricLabel}>Registered Clients</div>
          <div className={styles.primaryValueRow}>
            <AnimatedNumber
              value={userCount}
              className={styles.primaryNumber}
            />
            <span className={styles.unitSuffix}>ACCOUNTS</span>
          </div>
          <div className={styles.metricFootnote}>
            <Link href="/admin/users" className={styles.footLink}>
              <span>Client Directory</span>
              <ArrowRight size={12} className={styles.linkArrow} />
            </Link>
          </div>
        </div>

        {/* Primary 3: Production Orders */}
        <div className={styles.primaryBlock}>
          <div className={styles.blockMeta}>
            <span className={styles.metricCode}>VOL-03</span>
            <span className={styles.categoryTag}>FULFILLMENT</span>
          </div>
          <div className={styles.metricLabel}>Production Orders</div>
          <div className={styles.primaryValueRow}>
            <AnimatedNumber
              value={orderCount}
              className={styles.primaryNumber}
            />
            <span className={styles.unitSuffix}>ORDERS</span>
          </div>
          <div className={styles.metricFootnote}>
            <Link href="/admin/orders" className={styles.footLink}>
              <span>Order Ledger</span>
              <ArrowRight size={12} className={styles.linkArrow} />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Compact Operational Metrics Tier */}
      <div className={styles.secondaryGrid}>
        {/* Secondary 1: Pending Orders */}
        <Link 
          href="/admin/orders" 
          className={`${styles.secondaryCell} ${pendingOrders > 0 ? styles.cellAttention : ""}`}
        >
          <div className={styles.secondaryHeader}>
            <span className={styles.secondaryLabel}>PENDING INTAKE</span>
            <Clock size={13} className={pendingOrders > 0 ? styles.iconClay : styles.iconSage} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={pendingOrders} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>Awaiting verification</span>
          </div>
        </Link>

        {/* Secondary 2: In Production */}
        <Link href="/admin/orders" className={styles.secondaryCell}>
          <div className={styles.secondaryHeader}>
            <span className={styles.secondaryLabel}>IN PRODUCTION</span>
            <Scissors size={13} className={styles.iconGreen} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={processingOrders} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>Cutting &amp; stitching</span>
          </div>
        </Link>

        {/* Secondary 3: Client Bookings */}
        <Link href="/admin/bookings" className={styles.secondaryCell}>
          <div className={styles.secondaryHeader}>
            <span className={styles.secondaryLabel}>CLIENT BOOKINGS</span>
            <Calendar size={13} className={styles.iconSage} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={bookingCount} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>Consultations</span>
          </div>
        </Link>

        {/* Secondary 4: Active SKUs */}
        <Link href="/admin/products" className={styles.secondaryCell}>
          <div className={styles.secondaryHeader}>
            <span className={styles.secondaryLabel}>ACTIVE SKUS</span>
            <Shirt size={13} className={styles.iconSage} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={productCount} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>Catalogue styles</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
