"use client";
import React from "react";
import { Minus, Plus, Check, AlertCircle } from "lucide-react";
import styles from "./SizeBreakdown.module.css";

interface SizeBreakdownProps {
  sizes: Record<string, number>;
  moq: number;
  totalQuantity: number;
  onSizeChange: (size: string, qty: number) => void;
}

const SIZE_LABELS: Record<string, { label: string; name: string }> = {
  S: { label: "S", name: "Small" },
  M: { label: "M", name: "Medium" },
  L: { label: "L", name: "Large" },
  XL: { label: "XL", name: "Extra Large" },
  XXL: { label: "XXL", name: "Double XL" },
};

const ORDERED_SIZES = ["S", "M", "L", "XL", "XXL"];

export default function SizeBreakdown({
  sizes,
  moq,
  totalQuantity,
  onSizeChange,
}: SizeBreakdownProps) {
  // Ensure we include any custom keys in sizes if present, while prioritizing standard order
  const allSizeKeys = Array.from(
    new Set([...ORDERED_SIZES, ...Object.keys(sizes)])
  );

  const isMoqMet = totalQuantity >= moq;
  const progressPercent = Math.min(100, (totalQuantity / (moq || 1)) * 100);

  const handleInputChange = (size: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^\d]/g, "");
    const parsed = rawVal === "" ? 0 : parseInt(rawVal, 10);
    onSizeChange(size, Math.max(0, isNaN(parsed) ? 0 : parsed));
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Size Breakdown</h2>
          <span className={`${styles.moqBadge} ${isMoqMet ? styles.moqBadgeSuccess : styles.moqBadgePending}`}>
            {isMoqMet ? (
              <>
                <Check size={12} strokeWidth={2.5} className={styles.badgeIcon} />
                <span>MOQ Met</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} strokeWidth={2.5} className={styles.badgeIcon} />
                <span>MOQ: {moq} pcs min</span>
              </>
            )}
          </span>
        </div>
        <p className={styles.subtitle}>
          Distribute your order quantity across garment sizes. Minimum {moq} pieces total required for production.
        </p>
      </div>

      {/* Section Label */}
      <div className={styles.sectionLabel}>Quantity by Size</div>

      {/* Structured Stepper Grid */}
      <div className={styles.stepperGrid}>
        {allSizeKeys.map((size) => {
          const qty = sizes[size] || 0;
          const sizeMeta = SIZE_LABELS[size] || { label: size, name: `Size ${size}` };
          const hasQty = qty > 0;

          return (
            <div
              key={size}
              className={`${styles.sizeRow} ${hasQty ? styles.sizeRowActive : ""}`}
            >
              <div className={styles.sizeMeta}>
                <span className={styles.sizeBadge}>{sizeMeta.label}</span>
                <span className={styles.sizeName}>{sizeMeta.name}</span>
              </div>

              {/* NumberField / Stepper Control */}
              <div className={styles.stepperControl}>
                <button
                  type="button"
                  onClick={() => onSizeChange(size, Math.max(0, qty - 1))}
                  disabled={qty <= 0}
                  className={styles.stepBtn}
                  aria-label={`Decrease ${size} quantity`}
                  title={`Decrease ${size}`}
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qty}
                  onChange={(e) => handleInputChange(size, e)}
                  className={styles.qtyInput}
                  aria-label={`Quantity for size ${size}`}
                />

                <button
                  type="button"
                  onClick={() => onSizeChange(size, qty + 1)}
                  className={styles.stepBtn}
                  aria-label={`Increase ${size} quantity`}
                  title={`Increase ${size}`}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Total Quantity Summary Panel */}
      <div className={styles.summaryPanel}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryTitle}>Total Quantity</span>
            <span className={styles.summarySub}>Aggregated units across all selected sizes</span>
          </div>
          <div className={`${styles.totalValue} ${isMoqMet ? styles.totalValueSuccess : ""}`}>
            {totalQuantity}
            <span className={styles.unitText}>pcs</span>
          </div>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={totalQuantity} aria-valuemin={0} aria-valuemax={moq}>
          <div
            className={`${styles.progressBarFill} ${isMoqMet ? styles.progressFillSuccess : styles.progressFillPending}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className={styles.summaryFooter}>
          <span className={styles.progressStatusText}>
            {isMoqMet
              ? "Minimum order quantity requirement satisfied"
              : `${Math.max(0, moq - totalQuantity)} more pieces needed to reach MOQ`}
          </span>
          <span className={styles.progressRatio}>
            {totalQuantity} / {moq} min
          </span>
        </div>
      </div>
    </div>
  );
}
