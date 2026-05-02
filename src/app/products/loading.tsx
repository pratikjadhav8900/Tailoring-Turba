import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import styles from "./page.module.css";
import Skeleton from "@/components/Skeleton";

export default function ProductsLoading() {
  return (
    <main className={styles.main}>
      {/* Hero Skeleton */}
      <section className={styles.hero} style={{ background: '#f8fafc' }}>
        <div className={styles.heroContent}>
          <Skeleton width="300px" height="3.5rem" style={{ margin: '0 auto' }} />
        </div>
      </section>

      <section className={`container ${styles.layout}`}>
        {/* Sidebar Skeleton */}
        <aside className={styles.sidebar}>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} width="100%" height="2.5rem" style={{ marginBottom: '12px' }} borderRadius="8px" />
          ))}
        </aside>

        {/* Product Grid Skeleton */}
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
