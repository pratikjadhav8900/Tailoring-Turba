"use client";
import React from "react";
import styles from "./SizeBreakdown.module.css";

interface SizeBreakdownProps {
  sizes: Record<string, number>;
  moq: number;
  totalQuantity: number;
  onSizeChange: (size: string, qty: number) => void;
}

export default function SizeBreakdown({
  sizes,
  moq,
  totalQuantity,
  onSizeChange,
}: SizeBreakdownProps) {
  return (
    <div className={styles.tabContentInner}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-serif)', margin: 0 }}>Size Breakdown</h2>
          <span style={{ background: totalQuantity >= moq ? '#dcfce7' : '#fef9c3', color: totalQuantity >= moq ? '#166534' : '#854d0e', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>
            {totalQuantity >= moq ? `✓ MOQ Met` : `MOQ: ${moq} pcs min`}
          </span>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Distribute your order across sizes. Minimum {moq} pieces total to proceed.</p>
      </div>

      <div className={styles.sizeGrid}>
        {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
          const qty = sizes[size] || 0;
          return (
            <div key={size} className={`${styles.sizeCard} ${qty > 0 ? styles.sizeCardActive : ""}`}>
              <div className={styles.sizeLabel}>{size}</div>
              <button onClick={() => onSizeChange(size, qty - 1)} className={styles.qtyBtn}>−</button>
              <div className={`${styles.sizeQty} ${qty > 0 ? styles.sizeQtyActive : ""}`}>{qty}</div>
              <button onClick={() => onSizeChange(size, qty + 1)} className={styles.qtyBtn}>+</button>
            </div>
          );
        })}
      </div>

      <div className={styles.progressBarContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Total Quantity</span>
          <span style={{ fontWeight: 800, fontSize: '1.6rem', color: totalQuantity >= moq ? '#16a34a' : '#0f172a' }}>{totalQuantity}</span>
        </div>
        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (totalQuantity / moq) * 100)}%`, background: totalQuantity >= moq ? '#16a34a' : '#f59e0b', borderRadius: '99px', transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}
