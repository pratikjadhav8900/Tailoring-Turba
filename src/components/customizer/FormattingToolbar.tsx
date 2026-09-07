"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Bold, Underline, AlignLeft, List, ArrowUpDown, Copy, Trash2, ChevronUp, ChevronDown, Link2, HelpCircle
} from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement } from "@/types/customizer";
import { getElementDetails, getPrintableAreaDimensionsPx } from "@/lib/customizer-utils";

const FONTS = [
  // Google Fonts
  "Inter", "Outfit", "Oswald", "Montserrat", "Playfair Display", "Bebas Neue",
  "Roboto", "Poppins", "Lato", "Raleway", "Aladin", "Arimo", "Abel",
  "Abril Fatface", "Adamina", "Advent Pro", "Alegreya", "Alex Brush", "Allison",

  // Windows System Fonts (C:\Windows\Fonts)
  "Arial", "Arial Black", "Book Antiqua", "Calibri", "Candara", "Century Gothic",
  "Comic Sans MS", "Consolas", "Courier New", "Franklin Gothic Medium",
  "Garamond", "Georgia", "Impact", "Lucida Console", "Lucida Sans Unicode",
  "Microsoft Sans Serif", "Palatino Linotype", "Segoe UI", "Tahoma",
  "Times New Roman", "Trebuchet MS", "Verdana"
];

const TEXT_COLORS = [
  { name: "Black",      hex: "#111111" },
  { name: "White",      hex: "#FFFFFF" },
  { name: "Navy",       hex: "#1E3A5F" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Red",        hex: "#EF4444" },
  { name: "Forest",     hex: "#15803D" },
  { name: "Gold",       hex: "#EAB308" },
  { name: "Orange",     hex: "#F97316" },
  { name: "Purple",     hex: "#A855F7" },
  { name: "Pink",       hex: "#EC4899" },
  { name: "Olive",      hex: "#65A30D" },
  { name: "Teal",       hex: "#0D9488" }
];

interface FormattingToolbarProps {
  activeEl: DesignElement;
  onUpdate: (id: string, updates: Partial<DesignElement>) => void;
  onRemove: (id: string, e?: React.SyntheticEvent) => void;
  onCopy?: (id: string, e?: React.SyntheticEvent) => void;
  garmentType: string;
  activeSide: string;
  onHelpClick?: () => void;
}

export default function FormattingToolbar({
  activeEl,
  onUpdate,
  onRemove,
  onCopy,
  garmentType,
  activeSide,
  onHelpClick,
}: FormattingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColorPicker]);

  const activeWidthStr = activeEl ? getElementDetails(activeEl, garmentType, activeSide).widthInches.toString() : "";
  const activeHeightStr = activeEl ? getElementDetails(activeEl, garmentType, activeSide).heightInches.toString() : "";

  // Local state for inputs to allow smooth editing of decimals and empty inputs
  const [widthInput, setWidthInput] = useState(activeWidthStr);
  const [heightInput, setHeightInput] = useState(activeHeightStr);
  const [isFocusedW, setIsFocusedW] = useState(false);
  const [isFocusedH, setIsFocusedH] = useState(false);

  useEffect(() => {
    if (!isFocusedW && activeWidthStr) {
      setWidthInput(activeWidthStr);
    }
  }, [activeWidthStr, isFocusedW]);

  useEffect(() => {
    if (!isFocusedH && activeHeightStr) {
      setHeightInput(activeHeightStr);
    }
  }, [activeHeightStr, isFocusedH]);

  if (!activeEl) return null;

  // Calculate size details in inches and image DPI
  const details = getElementDetails(activeEl, garmentType, activeSide);
  const { widthPx, heightPx } = getPrintableAreaDimensionsPx(garmentType, activeSide);

  const handleWidthChange = (val: number) => {
    if (isNaN(val) || val <= 0) return;
    let newWidth = Math.round((val / 12) * widthPx);
    newWidth = Math.max(20, Math.min(560, newWidth));

    const aspectRatio = activeEl.width / activeEl.height;
    let newHeight = Math.round(newWidth / aspectRatio);
    newHeight = Math.max(20, Math.min(560, newHeight));

    onUpdate(activeEl.id, { width: newWidth, height: newHeight });
  };

  const handleHeightChange = (val: number) => {
    if (isNaN(val) || val <= 0) return;
    let newHeight = Math.round((val / 12) * heightPx);
    newHeight = Math.max(20, Math.min(560, newHeight));

    const aspectRatio = activeEl.width / activeEl.height;
    let newWidth = Math.round(newHeight * aspectRatio);
    newWidth = Math.max(20, Math.min(560, newWidth));

    onUpdate(activeEl.id, { width: newWidth, height: newHeight });
  };

  const fontSize = activeEl.fontSize || 24;
  const currentColor = activeEl.color || "#111111";
  const currentColorName = TEXT_COLORS.find(c => c.hex.toLowerCase() === currentColor.toLowerCase())?.name || "Color";

  const bump = (delta: number) => {
    const next = Math.max(8, Math.min(200, fontSize + delta));
    onUpdate(activeEl.id, { fontSize: next });
  };

  const currentPrintType = activeEl.printType || "dtg";

  return (
    <div
      className={styles.topFormattingBar}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── TEXT ONLY CONTROLS ─── */}
      {activeEl.type === "text" && (
        <>
          {/* Font Family */}
          <select
            className={styles.tfFontSelect}
            value={activeEl.fontFamily || "Inter"}
            onChange={(e) => onUpdate(activeEl.id, { fontFamily: e.target.value })}
            style={{ fontFamily: activeEl.fontFamily || "Inter" }}
          >
            {FONTS.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
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

          {/* Text Color dropdown */}
          <div ref={wrapRef} className={styles.tfColorDropdownWrap}>
            <button
              className={styles.tfColorDropdownBtn}
              onClick={() => setShowColorPicker(v => !v)}
              title="Text color"
            >
              <span
                className={styles.tfColorPreviewDot}
                style={{
                  backgroundColor: currentColor,
                  border: currentColor.toUpperCase() === "#FFFFFF" ? "1.5px solid #D1D5DB" : "none"
                }}
              />
              <span className={styles.tfColorBtnLabel}>{currentColorName}</span>
              <ChevronDown size={12} color="#6B7280" />
            </button>

            {showColorPicker && (
              <div className={styles.tfColorDropdown}>
                <div className={styles.tfColorDropdownGrid}>
                  {TEXT_COLORS.map((c) => {
                    const isActive = currentColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        className={`${styles.tfColorOption} ${isActive ? styles.tfColorOptionActive : ""}`}
                        onClick={() => { onUpdate(activeEl.id, { color: c.hex }); setShowColorPicker(false); }}
                        title={c.name}
                      >
                        <span
                          className={styles.tfColorOptionDot}
                          style={{
                            backgroundColor: c.hex,
                            border: c.hex.toUpperCase() === "#FFFFFF" ? "1.5px solid #D1D5DB" : "none"
                          }}
                        />
                        <span className={styles.tfColorOptionName}>{c.name}</span>
                        {isActive && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "auto", flexShrink: 0 }}>
                            <path d="M2 6L5 9L10 3" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

          {/* Align */}
          <div className={styles.tfBtnGroup}>
            <button
              className={`${styles.tfBtn} ${activeEl.textAlign === "left" ? styles.tfBtnOn : ""}`}
              onClick={() => onUpdate(activeEl.id, { textAlign: "left" })}
              title="Align Left"
            >
              <AlignLeft size={16} strokeWidth={2} />
            </button>
            <button className={styles.tfBtn} title="List"><List size={16} strokeWidth={2} /></button>
            <button className={styles.tfBtn} title="Spacing"><ArrowUpDown size={16} strokeWidth={2} /></button>
          </div>

          <div className={styles.tfDivider} />
        </>
      )}

      {/* ─── SHARED CONTROLS (DIMENSIONS & PRINT OPTIONS) ─── */}

      {/* Dimensions inputs in Inches */}
      <div className={styles.tfDimensionGroup}>
        <div className={styles.tfInputWrapper} title="Width in Inches">
          <span className={styles.tfInputLabel}>W:</span>
          <input
            type="text"
            className={styles.tfDimensionInput}
            value={widthInput}
            onFocus={() => setIsFocusedW(true)}
            onBlur={() => setIsFocusedW(false)}
            onChange={(e) => {
              const valStr = e.target.value;
              setWidthInput(valStr);
              const valNum = parseFloat(valStr);
              if (!isNaN(valNum) && valNum > 0) {
                handleWidthChange(valNum);
              }
            }}
          />
          <span className={styles.tfInputUnit}>in</span>
        </div>

        <div className={styles.tfLinkIcon} title="Aspect Ratio Locked">
          <Link2 size={13} color="#9CA3AF" strokeWidth={2.5} />
        </div>

        <div className={styles.tfInputWrapper} title="Height in Inches">
          <span className={styles.tfInputLabel}>H:</span>
          <input
            type="text"
            className={styles.tfDimensionInput}
            value={heightInput}
            onFocus={() => setIsFocusedH(true)}
            onBlur={() => setIsFocusedH(false)}
            onChange={(e) => {
              const valStr = e.target.value;
              setHeightInput(valStr);
              const valNum = parseFloat(valStr);
              if (!isNaN(valNum) && valNum > 0) {
                handleHeightChange(valNum);
              }
            }}
          />
          <span className={styles.tfInputUnit}>in</span>
        </div>
      </div>

      <div className={styles.tfDivider} />

      {/* Print Type selection pills */}
      <div className={styles.tfPrintGroup} title="Select printing option for dynamic cost estimation">
        <button
          className={`${styles.tfPrintBtn} ${currentPrintType === "dtf" ? styles.tfPrintBtnActive : ""}`}
          onClick={() => onUpdate(activeEl.id, { printType: "dtf" })}
        >
          DTF
        </button>
        <button
          className={`${styles.tfPrintBtn} ${currentPrintType === "screen" ? styles.tfPrintBtnActive : ""}`}
          onClick={() => onUpdate(activeEl.id, { printType: "screen" })}
        >
          SCREEN
        </button>
        {activeSide !== "back" && (
          <button
            className={`${styles.tfPrintBtn} ${currentPrintType === "embroidery" ? styles.tfPrintBtnActive : ""}`}
            onClick={() => onUpdate(activeEl.id, { printType: "embroidery" })}
          >
            EMBROIDERY
          </button>
        )}
        <button
          className={`${styles.tfPrintBtn} ${currentPrintType === "sublimation" ? styles.tfPrintBtnActive : ""}`}
          onClick={() => onUpdate(activeEl.id, { printType: "sublimation" })}
        >
          SUBLIMATION
        </button>
      </div>

      <button
        className={styles.tfHelpBtn}
        onClick={onHelpClick}
        title="View Printing Methods Guide"
        style={{ marginLeft: '2px' }}
      >
        <HelpCircle size={15} strokeWidth={2.5} />
      </button>

      {/* Embroidery Mono/Multi Color Toggle */}
      {currentPrintType === "embroidery" && (
        <>
          <div className={styles.tfDivider} />
          <div className={styles.tfPrintGroup} title="Embroidery Color Mode">
            <button
              className={`${styles.tfPrintBtn} ${details.embroideryType === "mono" ? styles.tfPrintBtnActive : ""}`}
              onClick={() => onUpdate(activeEl.id, { embroideryType: "mono" })}
            >
              MONO COLOR
            </button>
            <button
              className={`${styles.tfPrintBtn} ${details.embroideryType === "multi" ? styles.tfPrintBtnActive : ""}`}
              onClick={() => onUpdate(activeEl.id, { embroideryType: "multi" })}
            >
              MULTI COLOR
            </button>
          </div>
        </>
      )}

      {/* DPI Badge (Logo Only) */}
      {activeEl.type === "logo" && details.dpi && (
        <>
          <div className={styles.tfDivider} />
          <div
            className={`${styles.tfDpiBadge} ${
              details.dpiQuality === "Good"
                ? styles.tfDpiGood
                : details.dpiQuality === "Fair"
                ? styles.tfDpiFair
                : styles.tfDpiBad
            }`}
            title={`Image resolution at this scale. Recommended is 300 DPI. Original: ${activeEl.originalWidth}x${activeEl.originalHeight}px`}
          >
            DPI: {details.dpi}
          </div>
        </>
      )}

      {/* ─── ACTION BUTTONS (COPY / DELETE) ─── */}
      <div className={styles.tfDivider} />

      <button className={styles.tfBtn} onClick={(e) => onCopy?.(activeEl.id, e)} title="Copy Element">
        <Copy size={15} strokeWidth={2} />
      </button>

      <div className={styles.tfDivider} />

      <button
        className={`${styles.tfBtn} ${styles.tfBtnDanger}`}
        onClick={(e) => onRemove(activeEl.id, e)}
        title="Delete Element"
      >
        <Trash2 size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
