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
  ChevronRight,
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
      subtext: "Pending Approval",
      count: counts.pendingOrders,
      href: "/admin/orders",
      status: counts.pendingOrders > 0 ? "attention" : "idle",
      icon: Clock,
    },
    {
      code: "04",
      name: "MANUFACTURING",
      subtext: "Cut & Stitching",
      count: counts.processingOrders,
      href: "/admin/orders",
      status: counts.processingOrders > 0 ? "active" : "idle",
      icon: Scissors,
    },
    {
      code: "05",
      name: "DISPATCH & COURIER",
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
    <section className={styles.railWorkspace} aria-label="Manufacturing Production Control Rail">
      {/* Workspace Header */}
      <div className={styles.railHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.controlTag}>
            <span className={styles.controlDot} />
            <span>PRODUCTION CONTROL RAIL // LINE 01</span>
          </div>
          <h2 className={styles.railTitle}>Production &amp; Fulfillment Flow</h2>
          <p className={styles.railDesc}>
            Real-time pipeline monitoring from incoming client specs to garment cutting, assembly and courier dispatch.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.throughputChip}>
            <span className={styles.throughputLabel}>ACTIVE FLOW</span>
            <span className={styles.throughputNumber}>
              <AnimatedNumber value={totalActiveUnits} />
              <span className={styles.unitText}>UNITS</span>
            </span>
          </div>
          <Link href="/admin/orders" className={styles.consoleLink}>
            <span>Order Ledger</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Horizontal Manufacturing Control Rail */}
      <div className={styles.railTrackWrap}>
        <div className={styles.railTrack}>
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isAttention = stage.status === "attention";
            const isActive = stage.status === "active";
            const isCompleted = stage.status === "completed";

            return (
              <div key={stage.code} className={styles.stageCellWrap}>
                <Link 
                  href={stage.href} 
                  className={`${styles.stageCell} ${
                    isAttention 
                      ? styles.stageAttention 
                      : isActive 
                        ? styles.stageActive 
                        : isCompleted
                          ? styles.stageCompleted
                          : styles.stageIdle
                  }`}
                >
                  {/* Step Code & Status Dot */}
                  <div className={styles.cellHeader}>
                    <span className={styles.stageCode}>{stage.code}</span>
                    <div className={styles.indicatorWrap}>
                      <span className={styles.stateDot} />
                      <Icon size={13} className={styles.stateIcon} />
                    </div>
                  </div>

                  {/* Stage Details */}
                  <div className={styles.cellBody}>
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

                  {/* Stage Status Foot */}
                  <div className={styles.cellFoot}>
                    <span className={styles.statusPill}>
                      {isAttention ? "REQUIRES ACTION" : isActive ? "IN PROGRESS" : isCompleted ? "FULFILLED" : "STANDBY"}
                    </span>
                  </div>
                </Link>

                {/* Connecting Rail Joint (except last item) */}
                {idx < stages.length - 1 && (
                  <div className={styles.railJoint} aria-hidden="true">
                    <div className={styles.jointLine} />
                    <ArrowRight size={12} className={styles.jointArrow} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Allocation Bar */}
      <div className={styles.allocationRow}>
        <div className={styles.allocationLabel}>
          <span>PIPELINE ALLOCATION</span>
          <span className={styles.allocationMeta}>
            {totalAllUnits > 0 ? `${totalAllUnits} total lifetime items recorded` : "Awaiting initial intake"}
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
                  style={{ width: `${Math.max(pct, 4)}%` }}
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
