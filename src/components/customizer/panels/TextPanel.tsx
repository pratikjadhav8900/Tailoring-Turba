"use client";
import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import styles from "../PoloCustomizer.module.css";
import { DesignElement } from "@/types/customizer";
import { ALL_PRESETS as TEXT_PRESETS } from "@/lib/presets";

interface TextPanelProps {
  textElements: DesignElement[];
  onAddText: (text?: string) => void;
  onAddPreset?: (presetId: string, text: string | string[]) => void;
  onUpdateTextElement?: (id: string, value: string) => void;
  onRemoveElement?: (id: string) => void;
}

export default function TextPanel({
  textElements,
  onAddText,
  onAddPreset,
  onUpdateTextElement,
  onRemoveElement,
}: TextPanelProps) {
  const [presetInput, setPresetInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className={styles.contextBody}>
      {/* Quick Add Cards */}
      <div className={styles.quickAddCards}>
        <button
          className={styles.quickAddCard}
          onClick={() => onAddText("Add a heading")}
        >
          <span className={styles.quickAddLabel} style={{ fontSize: "1.1rem", fontWeight: 800 }}>
            Add a heading
          </span>
        </button>
        <button
          className={styles.quickAddCard}
          onClick={() => onAddText("Add a subheading")}
        >
          <span className={styles.quickAddLabel} style={{ fontSize: "0.88rem", fontWeight: 600 }}>
            Add a subheading
          </span>
        </button>
        <button
          className={styles.quickAddCard}
          onClick={() => onAddText("Add body text")}
        >
          <span className={styles.quickAddLabel} style={{ fontSize: "0.78rem", fontWeight: 400 }}>
            Add a little bit of body text
          </span>
        </button>
      </div>

      {/* Existing Text Elements */}
      {textElements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className={styles.editSectionLabel}>On Canvas</span>
          <div className={styles.textElementList}>
            {textElements.map((el) => (
              <div key={el.id} className={styles.textElementRowWrap}>
                <div className={styles.textElementRow}>
                  <input
                    className={styles.textElementInput}
                    value={el.value}
                    onChange={(e) => onUpdateTextElement?.(el.id, e.target.value)}
                    placeholder="Text"
                  />
                  <button
                    className={styles.textElementDelete}
                    onClick={() => onRemoveElement?.(el.id)}
                  >
                    <Trash2 size={16} color="#111" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Font Combos / Presets */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
        <span className={styles.editSectionLabel}>Font Combos</span>
        <div className={styles.categoryScroll}>
          {["All", "vintage", "anime", "literature", "brand", "y2k"].map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryChipActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "All" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <textarea
          value={presetInput}
          onChange={(e) => setPresetInput(e.target.value)}
          placeholder="Type your text here..."
          className={styles.presetTextarea}
        />

        <div className={styles.presetGrid}>
          {TEXT_PRESETS.filter(
            (p) => activeCategory === "All" || p.category === activeCategory
          ).map((preset) => {
            const inputLines = presetInput ? presetInput.split("\n") : [];
            return (
              <button
                key={preset.id}
                className={styles.presetCard}
                onClick={() =>
                  onAddPreset?.(
                    preset.id,
                    presetInput
                      ? presetInput.split("\n")
                      : preset.elements.map((e) => e.value || "")
                  )
                }
              >
                <div className={styles.presetCardInner}>
                  <div
                    style={{
                      position: "absolute",
                      width: preset.width,
                      height: preset.height,
                      transform: `scale(${110 / Math.max(preset.width, preset.height)})`,
                      transformOrigin: "center center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {preset.elements.map((el, i) => {
                      let displayVal = el.value;
                      if (presetInput) {
                        displayVal =
                          preset.elements.length === 1
                            ? presetInput
                            : inputLines[i] || "";
                      }
                      const origVal = el.value || "";
                      const origLetters = origVal.replace(/\n/g, "");
                      const isVertical =
                        origVal.includes("\n") &&
                        origVal.length === origLetters.length * 2 - 1;
                      if (isVertical && displayVal && !displayVal.includes("\n")) {
                        displayVal = displayVal.split("").join("\n");
                      }
                      return (
                        <div
                          key={i}
                          style={{
                            position:
                              el.y !== undefined ? "absolute" : "relative",
                            top: el.y !== undefined ? 0 : "auto",
                            left: el.y !== undefined ? 0 : "auto",
                            transform:
                              el.y !== undefined
                                ? `translate(${el.x || 0}px, ${el.y}px)`
                                : "none",
                            color: el.color || "#000",
                            fontSize: `${el.fontSize}px`,
                            fontFamily: el.fontFamily || "Inter",
                            fontWeight: el.fontWeight || "normal",
                            fontStyle: el.fontStyle || "normal",
                            textTransform: el.uppercase ? "uppercase" : "none",
                            letterSpacing: el.letterSpacing
                              ? `${el.letterSpacing}px`
                              : "normal",
                            lineHeight: el.lineHeight || 1.2,
                            textShadow: el.textShadow,
                            WebkitTextStroke: el.WebkitTextStroke,
                            backgroundColor: el.backgroundColor,
                            backgroundImage: el.backgroundImage,
                            WebkitBackgroundClip: el.WebkitBackgroundClip as any,
                            WebkitTextFillColor: el.WebkitTextFillColor,
                            padding: el.padding,
                            borderRadius: el.borderRadius,
                            border: el.border,
                            borderTop: el.borderTop,
                            borderBottom: el.borderBottom,
                            borderLeft: el.borderLeft,
                            borderRight: el.borderRight,
                            whiteSpace: "pre-wrap",
                            textAlign: (el.textAlign as any) || "center",
                          }}
                        >
                          {displayVal}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
