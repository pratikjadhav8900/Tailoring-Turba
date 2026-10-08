"use client";
import React, { useMemo } from "react";
import { HelpCircle } from "lucide-react";
import styles from "../PoloCustomizer.module.css";
import { COLOR_PRESETS } from "@/lib/fabric-data";
import { getColorName } from "@/lib/customizer-utils";

const FABRIC_TYPES = [
  { id: "combed-cotton", name: "100% Combed Cotton", desc: "Soft, breathable, everyday wear", badge: "Popular" },
  { id: "poly-cotton", name: "Poly-Cotton Blend", desc: "Durable, wrinkle-resistant", badge: "Value" },
  { id: "dry-fit", name: "Dry-Fit Athletic", desc: "Moisture-wicking, sports performance", badge: "Sports" },
];

const PRINT_METHODS = [
  {
    id: "dtf" as const,
    name: "DTF (Direct to Film)",
    desc: "Best for multi-color logos, fine details, and gradients.",
    feel: "Thin, smooth, stretchable, and durable.",
    badgeLabel: "Vibrant",
    badgeBg: "#EFF6FF",
    badgeColor: "#1D4ED8",
    accentColor: "#3B82F6",
  },
  {
    id: "screen" as const,
    name: "Screen Printing",
    desc: "Best for bold graphics, block text, and bulk orders.",
    feel: "Premium, matte, slightly raised vibrant texture.",
    badgeLabel: "Classic",
    badgeBg: "#F5F3FF",
    badgeColor: "#6D28D9",
    accentColor: "#8B5CF6",
  },
  {
    id: "embroidery" as const,
    name: "Embroidery",
    desc: "Best for high-end corporate branding, chest and back logos.",
    feel: "Luxury textured, raised thread finish.",
    badgeLabel: "Premium",
    badgeBg: "#FEF3C7",
    badgeColor: "#B45309",
    accentColor: "#D97706",
  },
  {
    id: "sublimation" as const,
    name: "Sublimation",
    desc: "Full all-over prints on polyester. Infinite colors.",
    feel: "No feel — ink becomes part of the fabric.",
    badgeLabel: "All-Over",
    badgeBg: "#ECFDF5",
    badgeColor: "#059669",
    accentColor: "#0D9488",
  },
];

interface GarmentPanelProps {
  bodyColor: string;
  onColorSelect: (color: string) => void;
  availableColors?: string[];
  colorsJson?: any;
  fabricType?: string;
  onFabricChange?: (fabricId: string) => void;
  printMethod?: string;
  onPrintMethodChange?: (method: string) => void;
}

export default function GarmentPanel({
  bodyColor,
  onColorSelect,
  availableColors,
  colorsJson,
  fabricType = "combed-cotton",
  onFabricChange,
  printMethod,
  onPrintMethodChange,
}: GarmentPanelProps) {
  const structuredColorsMap = useMemo(() => {
    if (!colorsJson) return {};
    let parsed = colorsJson;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch { parsed = []; }
    }
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed.map((c: any) => [String(c.value || c.hex || "").toUpperCase(), String(c.name || "")])
      );
    }
    return {};
  }, [colorsJson]);

  const colorList = availableColors?.map((hex) => {
    const upper = hex.toUpperCase();
    const customName = structuredColorsMap[upper];
    return { hex, name: customName || getColorName(hex) };
  }) || COLOR_PRESETS;

  const colorName = structuredColorsMap[bodyColor.toUpperCase()] || getColorName(bodyColor);

  return (
    <div className={styles.contextBody}>
      {/* Garment Color */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span className={styles.editSectionLabel}>Garment Color</span>
        <div className={styles.selectedColorBanner}>
          <div
            className={styles.selectedColorDot}
            style={{ backgroundColor: bodyColor === "transparent" ? "#e5e7eb" : bodyColor }}
          />
          <div>
            <div className={styles.selectedColorLabel}>Selected</div>
            <div className={styles.selectedColorName}>
              {colorName === bodyColor ? "Custom" : colorName}
            </div>
          </div>
        </div>
        <div className={styles.colorSwatchGrid}>
          {colorList.map((p) => {
            const isSelected = bodyColor.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                onClick={() => onColorSelect(p.hex)}
                className={`${styles.colorSwatchCard} ${isSelected ? styles.colorSwatchCardActive : ""}`}
              >
                <div
                  className={styles.colorSwatchBlock}
                  style={{ backgroundColor: p.hex }}
                >
                  {isSelected && (
                    <div className={styles.colorCheckmark}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke={p.hex.toUpperCase() === "#FFFFFF" ? "#111" : "white"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <span className={styles.colorSwatchName}>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fabric Type */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
        <span className={styles.editSectionLabel}>Fabric Type</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {FABRIC_TYPES.map((fab) => (
            <button
              key={fab.id}
              className={`${styles.printCardEnhanced} ${fabricType === fab.id ? styles.printCardEnhancedActive : ""}`}
              onClick={() => onFabricChange?.(fab.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                <div>
                  <div className={styles.printCardName}>{fab.name}</div>
                  <div className={styles.printCardDesc}>{fab.desc}</div>
                </div>
                <span
                  className={styles.printCardBadge}
                  style={{ background: "#F1F5F9", color: "#475569" }}
                >
                  {fab.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Print Method */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
        <span className={styles.editSectionLabel}>Print Method Guide</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {PRINT_METHODS.map((pm) => (
            <div
              key={pm.id}
              className={styles.guideSidebarCard}
              style={{ borderLeft: `4px solid ${pm.accentColor}` }}
            >
              <div className={styles.guideSidebarHeader}>
                <span className={styles.guideSidebarTitle}>{pm.name}</span>
                <span
                  className={styles.guideSidebarBadge}
                  style={{ background: pm.badgeBg, color: pm.badgeColor }}
                >
                  {pm.badgeLabel}
                </span>
              </div>
              <p className={styles.guideSidebarText}>
                <strong>Best For:</strong> {pm.desc}
              </p>
              <p className={styles.guideSidebarText}>
                <strong>Feel:</strong> {pm.feel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
