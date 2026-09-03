"use client";

import styles from "./ProductionPipeline.module.css";
import Link from "next/link";
import AnimatedNumber from "./AnimatedNumber";
import { 
  FileText, 
  Sparkles, 
  Clock, 
  Scissors, 
  Truck, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";

interface PipelineCounts {
  newInquiries: number;
  sampledQuoted: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
}

export default function ProductionPipeline({ counts }: { counts: PipelineCounts }) {
  const stages = [
    {
      code: "01",
      name: "INQUIRY INTAKE",
      subtext: "New Leads",
      count: counts.newInquiries,
      href: "/admin/inquiries",
      status: counts.newInquiries > 0 ? "active" : "idle",
      icon: FileText,
    },
    {
      code: "02",
      name: "SPEC & SAMPLING",
      subtext: "Quoted / Samples",
      count: counts.sampledQuoted,
      href: "/admin/inquiries",
      status: counts.sampledQuoted > 0 ? "active" : "idle",
      icon: Sparkles,
    },
    {
      code: "03",
      name: "ORDER QUEUE",
      subtext: "Pending Intake",
      count: counts.pendingOrders,
      href: "/admin/orders",
      status: counts.pendingOrders > 0 ? "attention" : "idle",
      icon: Clock,
    },
    {
      code: "04",
      name: "MANUFACTURING",
      subtext: "Cutting & Stitching",
      count: counts.processingOrders,
      href: "/admin/orders",
      status: counts.processingOrders > 0 ? "active" : "idle",
      icon: Scissors,
    },
    {
      code: "05",
      name: "DISPATCH & TRANSIT",
      subtext: "In Transit",
      count: counts.shippedOrders,
      href: "/admin/orders",
      status: counts.shippedOrders > 0 ? "active" : "idle",
      icon: Truck,
    },
    {
      code: "06",
      name: "FULFILLED",
      subtext: "Delivered",
      count: counts.deliveredOrders,
      href: "/admin/orders",
      status: counts.deliveredOrders > 0 ? "completed" : "idle",
      icon: CheckCircle2,
    },
  ];

  const totalActiveUnits = 
    counts.newInquiries + 
    counts.sampledQuoted + 
    counts.pendingOrders + 
    counts.processingOrders + 
    counts.shippedOrders;

  const totalAllUnits = totalActiveUnits + counts.deliveredOrders;

  return (
    <section className={styles.railSection} aria-label="Manufacturing Production Flow">
      {/* Section Header */}
      <div className={styles.railHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.sectionTag}>
            <span className={styles.tagDot} />
            <span>OPERATIONS PIPELINE // REAL-TIME DISPATCH</span>
          </div>
          <h2 className={styles.railTitle}>Production &amp; Fulfillment Flow</h2>
          <p className={styles.railDesc}>
            Continuous garment pipeline from incoming specifications to cutting, assembly and dispatch.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.throughputBadge}>
            <span className={styles.throughputLabel}>ACTIVE FLOW</span>
            <span className={styles.throughputValue}>
              <AnimatedNumber value={totalActiveUnits} />
              <span className={styles.unitText}>UNITS</span>
            </span>
          </div>
          <Link href="/admin/orders" className={styles.ledgerActionBtn}>
            <span>Order Ledger</span>
            <ArrowRight size={12} className={styles.btnArrow} />
          </Link>
        </div>
      </div>

      {/* Signature Manufacturing Rail Track */}
      <div className={styles.railTrackWrap}>
        <div className={styles.railTrack}>
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isAttention = stage.status === "attention";
            const isActive = stage.status === "active";
            const isCompleted = stage.status === "completed";

            return (
              <div key={stage.code} className={styles.stageNodeWrap}>
                <Link 
                  href={stage.href} 
                  className={`${styles.stageNode} ${
                    isAttention 
                      ? styles.nodeAttention 
                      : isActive 
                        ? styles.nodeActive 
                        : isCompleted
                          ? styles.nodeCompleted
                          : styles.nodeIdle
                  }`}
                >
                  {/* Step Code & Status Dot */}
                  <div className={styles.nodeHeader}>
                    <span className={styles.stageCode}>{stage.code}</span>
                    <div className={styles.indicatorWrap}>
                      <span className={styles.stateDot} />
                      <Icon size={12} className={styles.stateIcon} />
                    </div>
                  </div>

                  {/* Stage Body */}
                  <div className={styles.nodeBody}>
                    <div className={styles.stageName}>{stage.name}</div>
                    <div className={styles.stageCountRow}>
                      <AnimatedNumber 
                        value={stage.count} 
                        className={styles.stageCountNumber} 
                      />
                      <span className={styles.stageCountUnit}>units</span>
                    </div>
                    <div className={styles.stageSubtext}>{stage.subtext}</div>
                  </div>

                  {/* Stage Foot */}
                  <div className={styles.nodeFoot}>
                    <span className={styles.statusLabel}>
                      {isAttention ? "REQUIRES ACTION" : isActive ? "IN PRODUCTION" : isCompleted ? "FULFILLED" : "STANDBY"}
                    </span>
                  </div>
                </Link>

                {/* Trail Connector Line with Manufacturing Thread Motif */}
                {idx < stages.length - 1 && (
                  <div className={styles.trailConnector} aria-hidden="true">
                    <div 
                      className={`${styles.trailLine} ${
                        (isActive || isAttention) ? styles.trailActive : ""
                      }`}
                    >
                      {(isActive || isAttention) && (
                        <div className={styles.threadPulse} />
                      )}
                    </div>
                    <ArrowRight size={11} className={styles.trailArrow} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Production Allocation Bar */}
      <div className={styles.allocationRow}>
        <div className={styles.allocationLabel}>
          <span className={styles.allocationTitle}>FLOW ALLOCATION</span>
          <span className={styles.allocationMeta}>
            {totalAllUnits > 0 ? `${totalAllUnits} lifetime units recorded` : "Awaiting initial intake"}
          </span>
        </div>
        <div className={styles.allocationTrack}>
          {totalAllUnits > 0 ? (
            stages.map((st) => {
              const pct = (st.count / totalAllUnits) * 100;
              if (pct <= 0) return null;
              return (
                <div 
                  key={st.code}
                  className={`${styles.allocationSegment} ${
                    st.status === "attention" 
                      ? styles.segAttention 
                      : st.status === "active" 
                        ? styles.segActive 
                        : styles.segNeutral
                  }`}
                  style={{ width: `${Math.max(pct, 3)}%` }}
                  title={`${st.name}: ${st.count} units (${Math.round(pct)}%)`}
                />
              );
            })
          ) : (
            <div className={styles.allocationEmpty} />
          )}
        </div>
      </div>
    </section>
  );
}
