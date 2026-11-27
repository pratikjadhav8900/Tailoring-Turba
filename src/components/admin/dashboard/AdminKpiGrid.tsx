"use client";

import styles from "./AdminKpiGrid.module.css";
import Link from "next/link";
import AnimatedNumber from "./AnimatedNumber";
import { 
  IndianRupee,
  Users,
  ShoppingBag,
  Clock, 
  Calendar, 
  Shirt, 
  Scissors,
  ArrowRight,
  TrendingUp
} from "lucide-react";

interface KpiProps {
  revenue: number;
  realizedOrderCount: number;
  userCount: number;
  orderCount: number;
  pendingOrders: number;
  processingOrders: number;
  bookingCount: number;
  productCount: number;
}

export default function AdminKpiGrid({
  revenue,
  realizedOrderCount,
  userCount,
  orderCount,
  pendingOrders,
  processingOrders,
  bookingCount,
  productCount,
}: KpiProps) {
  return (
    <section className={styles.metricsSection} aria-label="Business Performance Metrics">
      {/* Primary Dominant Metrics Tier */}
      <div className={styles.primaryGrid}>
        {/* Primary 1: Gross Revenue */}
        <div className={styles.primaryBlock}>
          <div className={styles.blockMeta}>
            <div className={styles.iconBadgeGreen}>
              <TrendingUp size={16} />
            </div>
            <span className={styles.categoryTag}>REVENUE</span>
          </div>
          <div className={styles.metricLabel}>Total Revenue</div>
          <div className={styles.primaryValueRow}>
            <span className={styles.currencyPrefix}>₹</span>
            <AnimatedNumber
              value={revenue}
              formatCurrency={true}
              className={styles.primaryNumber}
            />
          </div>
          <div className={styles.metricFootnote}>
            From {realizedOrderCount} confirmed order{realizedOrderCount === 1 ? "" : "s"}
          </div>
        </div>

        {/* Primary 2: Registered Clients */}
        <div className={styles.primaryBlock}>
          <div className={styles.blockMeta}>
            <div className={styles.iconBadgeSage}>
              <Users size={16} />
            </div>
            <span className={styles.categoryTag}>CUSTOMERS</span>
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
              <span>View Clients</span>
              <ArrowRight size={12} className={styles.linkArrow} />
            </Link>
          </div>
        </div>

        {/* Primary 3: Production Orders */}
        <div className={styles.primaryBlock}>
          <div className={styles.blockMeta}>
            <div className={styles.iconBadgeClay}>
              <ShoppingBag size={16} />
            </div>
            <span className={styles.categoryTag}>ORDERS</span>
          </div>
          <div className={styles.metricLabel}>Total Orders</div>
          <div className={styles.primaryValueRow}>
            <AnimatedNumber
              value={orderCount}
              className={styles.primaryNumber}
            />
            <span className={styles.unitSuffix}>ORDERS</span>
          </div>
          <div className={styles.metricFootnote}>
            <Link href="/admin/orders" className={styles.footLink}>
              <span>View Orders</span>
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
            <span className={styles.secondaryLabel}>PENDING ORDERS</span>
            <Clock size={14} className={pendingOrders > 0 ? styles.iconClay : styles.iconSage} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={pendingOrders} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>Awaiting confirmation</span>
          </div>
        </Link>

        {/* Secondary 2: In Production */}
        <Link href="/admin/orders" className={styles.secondaryCell}>
          <div className={styles.secondaryHeader}>
            <span className={styles.secondaryLabel}>IN PRODUCTION</span>
            <Scissors size={14} className={styles.iconGreen} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={processingOrders} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>Cutting &amp; stitching</span>
          </div>
        </Link>

        {/* Secondary 3: Client Bookings */}
        <Link href="/admin/bookings" className={styles.secondaryCell}>
          <div className={styles.secondaryHeader}>
            <span className={styles.secondaryLabel}>STUDIO BOOKINGS</span>
            <Calendar size={14} className={styles.iconSage} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={bookingCount} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>Showroom visits</span>
          </div>
        </Link>

        {/* Secondary 4: Active Products */}
        <Link href="/admin/products" className={styles.secondaryCell}>
          <div className={styles.secondaryHeader}>
            <span className={styles.secondaryLabel}>ACTIVE PRODUCTS</span>
            <Shirt size={14} className={styles.iconSage} />
          </div>
          <div className={styles.secondaryValueRow}>
            <AnimatedNumber value={productCount} className={styles.secondaryNumber} />
            <span className={styles.secondarySub}>In catalog</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
