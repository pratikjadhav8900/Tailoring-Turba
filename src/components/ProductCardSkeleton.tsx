import Skeleton from "./Skeleton";
import styles from "../app/products/page.module.css";

export default function ProductCardSkeleton() {
  return (
    <div className={styles.productCard} style={{ cursor: 'default' }}>
      <div className={styles.imageWrapper}>
        <Skeleton height="100%" borderRadius="0" />
      </div>
      
      {/* Swatches Skeleton */}
      <div className={styles.swatches} style={{ padding: '0 16px', marginTop: '12px', display: 'flex', gap: '8px' }}>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} width={16} height={16} borderRadius="50%" />
        ))}
      </div>

      <div className={styles.productInfo} style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
          <Skeleton width="60%" height="1.2rem" />
          <Skeleton width="25%" height="1.2rem" />
        </div>
        <Skeleton width="40%" height="0.9rem" />
      </div>
    </div>
  );
}
