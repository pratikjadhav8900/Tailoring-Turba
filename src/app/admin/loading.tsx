import styles from "./loading.module.css";

export default function AdminLoading() {
  return (
    <div className={styles.loadingContainer} aria-busy="true" aria-label="Loading Manufacturing Operations">
      {/* Header Skeleton (Direct, No Outer Card) */}
      <div className={styles.skeletonHeader}>
        <div className={styles.skelCol}>
          <div className={`${styles.skelLine} ${styles.skelShort}`} />
          <div className={`${styles.skelLine} ${styles.skelTitle}`} />
          <div className={`${styles.skelLine} ${styles.skelSub}`} />
        </div>
        <div className={styles.skelRow}>
          <div className={`${styles.skelLine} ${styles.skelChip}`} />
          <div className={`${styles.skelLine} ${styles.skelBtn}`} />
          <div className={`${styles.skelLine} ${styles.skelBtn}`} />
        </div>
      </div>

      {/* Focus Bar Skeleton */}
      <div className={styles.skeletonFocus} />

      {/* Metrics Console Skeleton */}
      <div className={styles.skeletonMetrics}>
        <div className={styles.skelMetricsTop}>
          <div className={styles.skelMetricBlock} />
          <div className={styles.skelMetricBlock} />
          <div className={styles.skelMetricBlock} />
        </div>
        <div className={styles.skelMetricsBottom}>
          <div className={styles.skelCell} />
          <div className={styles.skelCell} />
          <div className={styles.skelCell} />
          <div className={styles.skelCell} />
        </div>
      </div>

      {/* Production Rail Skeleton */}
      <div className={styles.skeletonRail}>
        <div className={styles.skelRailHead} />
        <div className={styles.skelRailNodes}>
          <div className={styles.skelNode} />
          <div className={styles.skelNode} />
          <div className={styles.skelNode} />
          <div className={styles.skelNode} />
          <div className={styles.skelNode} />
          <div className={styles.skelNode} />
        </div>
      </div>

      {/* Current Orders Workspace Skeleton */}
      <div className={styles.skeletonTable}>
        <div className={styles.skelOrdersHeader} />
        <div className={styles.skelFilterTabs} />
        <div className={styles.skelTableHeader} />
        <div className={styles.skelTableRow} />
        <div className={styles.skelTableRow} />
        <div className={styles.skelTableRow} />
        <div className={styles.skelTableRow} />
      </div>
    </div>
  );
}
