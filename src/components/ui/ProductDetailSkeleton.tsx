import Skeleton from "./Skeleton";
import styles from "@/app/products/[id]/page.module.css";

export default function ProductDetailSkeleton() {
  return (
    <main className={styles.main}>
      {/* Breadcrumb Skeleton */}
      <div className="container" style={{ paddingTop: "120px", paddingBottom: "16px" }}>
        <Skeleton width="200px" height="1rem" />
      </div>

      <div className={`container ${styles.layout}`}>
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          <div className={styles.mainImageContainer}>
            <Skeleton height="100%" borderRadius="0" />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width="80px" height="80px" borderRadius="8px" />
            ))}
          </div>

          <div style={{ marginTop: "32px" }}>
            <Skeleton width="150px" height="0.8rem" style={{ marginBottom: "12px" }} />
            <Skeleton width="100%" height="1rem" style={{ marginBottom: "8px" }} />
            <Skeleton width="100%" height="1rem" style={{ marginBottom: "8px" }} />
            <Skeleton width="80%" height="1rem" />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.detailsContainer}>
          <div>
            <Skeleton width="100px" height="0.8rem" style={{ marginBottom: "12px" }} />
            <Skeleton width="80%" height="2.5rem" style={{ marginBottom: "12px" }} />
            <Skeleton width="150px" height="1rem" style={{ marginBottom: "20px" }} />
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", marginBottom: "24px" }}>
            <Skeleton width="120px" height="2rem" style={{ marginBottom: "12px" }} />
            <Skeleton width="180px" height="1rem" />
          </div>

          <div style={{ padding: "24px", background: "#f8fafc", borderRadius: "12px", marginBottom: "24px" }}>
            <Skeleton width="100%" height="3rem" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Skeleton width="100%" height="3.5rem" borderRadius="10px" />
            <Skeleton width="100%" height="3.5rem" borderRadius="10px" />
            <Skeleton width="100%" height="3.5rem" borderRadius="10px" />
          </div>

          <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Skeleton width="32px" height="32px" borderRadius="6px" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="100%" height="0.7rem" style={{ marginBottom: '4px' }} />
                  <Skeleton width="60%" height="0.6rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <section style={{ background: "#f8fafc", padding: "64px 0", marginTop: "64px" }}>
        <div className="container">
          <div style={{ marginBottom: "36px" }}>
            <Skeleton width="200px" height="1.5rem" style={{ marginBottom: "8px" }} />
            <Skeleton width="300px" height="1rem" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card" style={{ padding: 0, overflow: "hidden", background: 'white' }}>
                <Skeleton height="200px" borderRadius="0" />
                <div style={{ padding: "16px" }}>
                  <Skeleton width="40%" height="0.7rem" style={{ marginBottom: "8px" }} />
                  <Skeleton width="80%" height="1rem" style={{ marginBottom: "8px" }} />
                  <Skeleton width="30%" height="1.1rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
