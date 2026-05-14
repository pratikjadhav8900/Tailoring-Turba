"use client";
import React, { useRef } from "react";
import {
  Bold, Underline, AlignLeft, List, ArrowUpDown, Wand2, Copy, Trash2, ChevronUp, ChevronDown, Grid
} from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement } from "@/types/customizer";

const FONTS = [
  "Inter", "Outfit", "Oswald", "Montserrat",
  "Playfair Display", "Bebas Neue", "Roboto", "Poppins", "Lato", "Raleway",
  "Aladin", "Arimo", "Abel", "Abril Fatface", "Adamina", "Advent Pro", "Alegreya", "Alex Brush", "Allison"
];

interface FormattingToolbarProps {
  activeEl: DesignElement;
  onUpdate: (id: string, updates: Partial<DesignElement>) => void;
  onRemove: (id: string, e?: React.SyntheticEvent) => void;
  onCopy?: (id: string, e?: React.SyntheticEvent) => void;
}

export default function FormattingToolbar({ activeEl, onUpdate, onRemove, onCopy }: FormattingToolbarProps) {
  if (activeEl.type !== "text") return null;

  const fontSize = activeEl.fontSize || 24;
  const colorRef = useRef<HTMLInputElement>(null);

  const bump = (delta: number) => {
    const next = Math.max(8, Math.min(200, fontSize + delta));
    onUpdate(activeEl.id, { fontSize: next });
  };

  return (
    <div className={styles.topFormattingBar} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {/* Font Family */}
      <select
        className={styles.tfFontSelect}
        value={activeEl.fontFamily || "Inter"}
        onChange={(e) => onUpdate(activeEl.id, { fontFamily: e.target.value })}
        style={{ fontFamily: activeEl.fontFamily || "Inter" }}
      >
        {FONTS.map(f => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>

      <div className={styles.tfDivider} />

      {/* Font Size */}
      <div className={styles.tfSizeGroup}>
        <button className={styles.tfSizeBtn} onClick={() => bump(-1)}><ChevronDown size={12} /></button>
        <input
          type="number"
          className={styles.tfSizeInput}
          value={fontSize}
          min={8} max={200}
          onChange={(e) => onUpdate(activeEl.id, { fontSize: Math.max(8, Number(e.target.value)) })}
        />
        <button className={styles.tfSizeBtn} onClick={() => bump(1)}><ChevronUp size={12} /></button>
      </div>

      <div className={styles.tfDivider} />

      {/* Color Picker */}
      <div className={styles.tfColorWrap} title="Text color" onClick={() => colorRef.current?.click()}>
        <div className={styles.tfColorDot} style={{ background: activeEl.color || "#000" }} />
        <input
          ref={colorRef}
          type="color"
          className={styles.tfColorInput}
          value={activeEl.color || "#000000"}
          onChange={(e) => onUpdate(activeEl.id, { color: e.target.value })}
        />
      </div>

      <div className={styles.tfDivider} />

      {/* Bold / Underline */}
      <div className={styles.tfBtnGroup}>
        <button
          className={`${styles.tfBtn} ${activeEl.fontWeight === "bold" ? styles.tfBtnOn : ""}`}
          onClick={() => onUpdate(activeEl.id, { fontWeight: activeEl.fontWeight === "bold" ? "normal" : "bold" })}
          title="Bold"
        >
          <Bold size={16} strokeWidth={2.5} />
        </button>
        <button
          className={`${styles.tfBtn} ${activeEl.textDecoration === "underline" ? styles.tfBtnOn : ""}`}
          onClick={() => onUpdate(activeEl.id, { textDecoration: activeEl.textDecoration === "underline" ? "none" : "underline" })}
          title="Underline"
        >
          <Underline size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className={styles.tfDivider} />

      {/* Align, List, Spacing */}
      <div className={styles.tfBtnGroup}>
        <button
          className={`${styles.tfBtn} ${activeEl.textAlign === "left" ? styles.tfBtnOn : ""}`}
          onClick={() => onUpdate(activeEl.id, { textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft size={16} strokeWidth={2} />
        </button>
        <button className={styles.tfBtn} title="List">
          <List size={16} strokeWidth={2} />
        </button>
        <button className={styles.tfBtn} title="Spacing">
          <ArrowUpDown size={16} strokeWidth={2} />
        </button>
      </div>

      <div className={styles.tfDivider} />

      <button className={`${styles.tfBtn} ${styles.tfBtnText}`} title="Format">
        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Format</span>
      </button>

      <button className={`${styles.tfBtn} ${styles.tfBtnText}`} title="Effects">
        <Wand2 size={16} strokeWidth={2} />
        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Effects</span>
      </button>

      <div className={styles.tfDivider} />

      <button className={styles.tfBtn} title="Transparency">
        <Grid size={16} strokeWidth={2} color="#6B7280" />
      </button>

      <div className={styles.tfDivider} />

      <button
        className={styles.tfBtn}
        onClick={(e) => onCopy?.(activeEl.id, e)}
        title="Copy"
      >
        <Copy size={16} strokeWidth={2} />
      </button>

      <div className={styles.tfDivider} />

      {/* Delete */}
      <button
        className={`${styles.tfBtn} ${styles.tfBtnDanger}`}
        onClick={(e) => onRemove(activeEl.id, e)}
        title="Delete element"
      >
        <Trash2 size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
