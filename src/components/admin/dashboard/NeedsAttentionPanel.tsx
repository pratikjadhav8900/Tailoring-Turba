"use client";

import styles from "./NeedsAttentionPanel.module.css";
import Link from "next/link";
import { 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";

interface AttentionItem {
  id: string;
  type: "ORDER" | "INQUIRY" | "BOOKING";
  statusCode: string;
  title: string;
  subtitle: string;
  timeStr: string;
  refId: string;
  actionUrl: string;
  actionLabel: string;
}

interface NeedsAttentionPendingOrder {
  id: string;
  orderNumber?: number;
  totalAmount?: number;
  createdAt: Date | string;
  user?: {
    name?: string | null;
    email?: string | null;
    companyName?: string | null;
  } | null;
  items?: unknown[];
}

interface NeedsAttentionInquiry {
  id: string;
  name: string;
  quantity: number;
  companyName?: string | null;
  requirements?: string | null;
  createdAt: Date | string;
}

interface NeedsAttentionBooking {
  id: string;
  guestName?: string | null;
  date: Date | string;
  timeSlot?: string | null;
  createdAt: Date | string;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface NeedsAttentionPanelProps {
  pendingOrders: NeedsAttentionPendingOrder[];
  newInquiries: NeedsAttentionInquiry[];
  requestedBookings: NeedsAttentionBooking[];
}

export default function NeedsAttentionPanel({
  pendingOrders,
  newInquiries,
  requestedBookings,
}: NeedsAttentionPanelProps) {
  const items: AttentionItem[] = [];

  // Map real pending orders
  pendingOrders.forEach((o) => {
    const orderRef = o.orderNumber ? `#TT-${String(o.orderNumber).padStart(4, "0")}` : `#${o.id.slice(-6).toUpperCase()}`;
    const clientName = o.user?.companyName || o.user?.name || o.user?.email || "Customer";
    const amountStr = o.totalAmount ? `₹${o.totalAmount.toLocaleString("en-IN")}` : "Custom Quote";
    const itemCount = o.items?.length || 0;

    items.push({
      id: `order-${o.id}`,
      type: "ORDER",
      statusCode: "PENDING",
      title: `Order ${orderRef} — ${clientName}`,
      subtitle: `${amountStr} • ${itemCount} line item${itemCount === 1 ? "" : "s"} awaiting verification`,
      timeStr: new Date(o.createdAt).toLocaleDateString("en-IN", { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      refId: orderRef,
      actionUrl: `/admin/orders/${o.id}`,
      actionLabel: "Review",
    });
  });

  // Map real new inquiries
  newInquiries.forEach((inq) => {
    const inqRef = `#INQ-${inq.id.slice(-4).toUpperCase()}`;
    const companyInfo = inq.companyName ? ` (${inq.companyName})` : "";

    items.push({
      id: `inq-${inq.id}`,
      type: "INQUIRY",
      statusCode: "NEW LEAD",
      title: `B2B Spec: ${inq.name}${companyInfo}`,
      subtitle: `Target: ${inq.quantity} units • ${inq.requirements ? inq.requirements.slice(0, 48) + "..." : "Custom specifications submitted"}`,
      timeStr: new Date(inq.createdAt).toLocaleDateString("en-IN", { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      refId: inqRef,
      actionUrl: `/admin/inquiries`,
      actionLabel: "Quote",
    });
  });

  // Map real requested bookings
  requestedBookings.forEach((b) => {
    const bookRef = `#BK-${b.id.slice(-4).toUpperCase()}`;
    const clientName = b.guestName || b.user?.name || "Client";
    const appointmentDate = new Date(b.date).toLocaleDateString("en-IN", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });

    items.push({
      id: `book-${b.id}`,
      type: "BOOKING",
      statusCode: "REQUESTED",
      title: `Consultation: ${clientName}`,
      subtitle: `Requested for ${appointmentDate} at ${b.timeSlot}`,
      timeStr: new Date(b.createdAt).toLocaleDateString("en-IN", { 
        month: "short", 
        day: "numeric" 
      }),
      refId: bookRef,
      actionUrl: `/admin/bookings`,
      actionLabel: "Confirm",
    });
  });

  const totalCount = items.length;

  return (
    <div className={styles.attentionConsole} role="region" aria-label="Operational Needs Attention">
      {/* Header */}
      <div className={styles.consoleHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.tagRow}>
            <span className={styles.tagMono}>ACTION QUEUE // TRIAGE</span>
            {totalCount > 0 ? (
              <span className={styles.badgeAttention}>
                <AlertTriangle size={10} />
                <span>{totalCount} REQUIRING ATTENTION</span>
              </span>
            ) : (
              <span className={styles.badgeClear}>
                <CheckCircle2 size={10} />
                <span>ALL CLEAR</span>
              </span>
            )}
          </div>
          <h3 className={styles.panelTitle}>Needs Attention</h3>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.contextMeta}>
            Live alerts from active pipelines
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.consoleBody}>
        {totalCount === 0 ? (
          <div className={styles.allClearState}>
            <div className={styles.clearIconWrap}>
              <CheckCircle2 size={24} className={styles.clearIcon} />
            </div>
            <div className={styles.clearTitle}>ALL CLEAR</div>
            <p className={styles.clearSub}>
              No operational issues require attention. Order queues and client intake are up to date.
            </p>
          </div>
        ) : (
          <div className={styles.attentionTable}>
            <div className={styles.tableHead}>
              <span className={styles.colStatus}>STATUS</span>
              <span className={styles.colDesc}>DESCRIPTION</span>
              <span className={styles.colTime}>TIME / REF</span>
              <span className={styles.colAction}>ACTION</span>
            </div>

            <div className={styles.tableBody}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.colStatus}>
                    <span 
                      className={`${styles.statusTag} ${
                        item.type === "ORDER" 
                          ? styles.tagOrder 
                          : item.type === "INQUIRY" 
                            ? styles.tagInquiry 
                            : styles.tagBooking
                      }`}
                    >
                      {item.statusCode}
                    </span>
                  </div>

                  <div className={styles.colDesc}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <div className={styles.itemSub}>{item.subtitle}</div>
                  </div>

                  <div className={styles.colTime}>
                    <span className={styles.refCode}>{item.refId}</span>
                    <span className={styles.timeValue}>{item.timeStr}</span>
                  </div>

                  <div className={styles.colAction}>
                    <Link href={item.actionUrl} className={styles.actionBtn}>
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={11} className={styles.btnArrow} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
