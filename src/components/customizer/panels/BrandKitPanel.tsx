"use client";
import React, { useState, useRef } from "react";
import { Plus, Palette, Upload, Users } from "lucide-react";
import styles from "../PoloCustomizer.module.css";

interface BrandKitPanelProps {
  onAddLogoUrl?: (url: string) => void;
  onUploadClick: () => void;
  isUploading: boolean;
}

const DEFAULT_BRAND_COLORS = [
  { name: "Primary", hex: "#0F172A" },
  { name: "Secondary", hex: "#1E3A5F" },
  { name: "Accent", hex: "#56CCF2" },
];

interface RosterEntry {
  name: string;
  number: string;
}

export default function BrandKitPanel({
  onAddLogoUrl,
  onUploadClick,
  isUploading,
}: BrandKitPanelProps) {
  const [brandColors, setBrandColors] = useState(DEFAULT_BRAND_COLORS);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [rosterMode, setRosterMode] = useState(false);
  const [roster, setRoster] = useState<RosterEntry[]>([
    { name: "", number: "" },
  ]);

  const addColor = () => {
    setBrandColors([...brandColors, { name: `Color ${brandColors.length + 1}`, hex: "#94A3B8" }]);
  };

  const updateColor = (idx: number, hex: string) => {
    const updated = [...brandColors];
    updated[idx] = { ...updated[idx], hex };
    setBrandColors(updated);
  };

  const addRosterRow = () => {
    setRoster([...roster, { name: "", number: "" }]);
  };

  const updateRosterRow = (idx: number, field: "name" | "number", value: string) => {
    const updated = [...roster];
    updated[idx] = { ...updated[idx], [field]: value };
    setRoster(updated);
  };

  return (
    <div className={styles.contextBody}>
      {/* Brand Colors */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className={styles.editSectionLabel}>
            <Palette size={12} style={{ marginRight: "4px", verticalAlign: "-1px" }} />
            Team / Brand Colors
          </span>
          <button
            onClick={addColor}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748B",
              fontSize: "0.7rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className={styles.brandColorGrid}>
          {brandColors.map((c, i) => (
            <div key={i} className={styles.brandColorCard}>
              <input
                type="color"
                value={c.hex}
                onChange={(e) => updateColor(i, e.target.value)}
                className={styles.brandColorInput}
              />
              <span className={styles.brandColorLabel}>{c.name}</span>
              <span className={styles.brandColorHex}>{c.hex}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Logos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
        <span className={styles.editSectionLabel}>
          <Upload size={12} style={{ marginRight: "4px", verticalAlign: "-1px" }} />
          Company Logos
        </span>
        <button className={styles.addAssetBtn} onClick={onUploadClick} disabled={isUploading}>
          <Upload size={16} />
          {isUploading ? "Uploading..." : "Upload Logo"}
        </button>
        <p className={styles.ctxHint}>
          Upload your company vector logo (SVG, PNG) for quick placement on any garment side.
        </p>
      </div>

      {/* Roster Generator */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className={styles.editSectionLabel}>
            <Users size={12} style={{ marginRight: "4px", verticalAlign: "-1px" }} />
            Name & Number Roster
          </span>
          <button
            onClick={() => setRosterMode(!rosterMode)}
            style={{
              background: rosterMode ? "#0F172A" : "none",
              color: rosterMode ? "#fff" : "#64748B",
              border: rosterMode ? "none" : "1px solid #E2E8F0",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "0.65rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {rosterMode ? "Close" : "Open"}
          </button>
        </div>

        {rosterMode && (
          <div className={styles.rosterSection}>
            <p className={styles.ctxHint}>
              Add employee names and jersey numbers for bulk personalization.
            </p>
            <div className={styles.rosterGrid}>
              <div className={styles.rosterHeader}>
                <span>Name</span>
                <span>Number</span>
              </div>
              {roster.map((row, i) => (
                <div key={i} className={styles.rosterRow}>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRosterRow(i, "name", e.target.value)}
                    placeholder="Employee name"
                    className={styles.rosterInput}
                  />
                  <input
                    type="text"
                    value={row.number}
                    onChange={(e) => updateRosterRow(i, "number", e.target.value)}
                    placeholder="#"
                    className={styles.rosterNumberInput}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addRosterRow}
              className={styles.addAssetBtnOutline}
              style={{ padding: "8px 12px", fontSize: "0.78rem" }}
            >
              <Plus size={14} /> Add Row
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
