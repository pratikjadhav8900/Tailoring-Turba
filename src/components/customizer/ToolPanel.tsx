"use client";
import React, { useState } from "react";
import { Type, UploadCloud, Shirt, Users, X, Plus, ArrowUpRight, Smartphone, Trash2, LogIn } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { COLOR_PRESETS } from "@/lib/fabric-data";
import { DesignElement } from "@/types/customizer";

type ActiveTool = "Text" | "Uploads" | "Colors" | "Names" | null;

interface ToolPanelProps {
  activeTool: ActiveTool;
  bodyColor: string;
  isUploading: boolean;
  onToolSelect: (tool: ActiveTool) => void;
  onColorSelect: (color: string) => void;
  onAddText: (text?: string) => void;
  onUploadClick: () => void;
  availableColors?: string[];
  // Text elements on canvas so we can list them in the Text panel
  textElements?: DesignElement[];
  onUpdateTextElement?: (id: string, value: string) => void;
  onRemoveElement?: (id: string) => void;
}

const SIDEBAR_TOOLS = [
  { key: "Colors" as ActiveTool,  icon: Shirt,       label: "Material\ncolor" },
  { key: "Text" as ActiveTool,    icon: Type,        label: "Text" },
  { key: "Names" as ActiveTool,   icon: Users,       label: "Names" },
  { key: "Uploads" as ActiveTool, icon: UploadCloud, label: "Uploads" },
];

// Map hex to a readable color name
const COLOR_NAME_MAP: Record<string, string> = {
  "#FFFFFF": "White",
  "#111111": "Jet Black",
  "#004b6b": "Turba Blue",
  "#1E3A5F": "Navy",
  "#2563EB": "Royal Blue",
  "#38BDF8": "Sky Blue",
  "#16A34A": "Forest Green",
  "#4D7C0F": "Olive",
  "#DC2626": "Independence Red",
  "#7F1D1D": "Maroon",
  "#D97706": "Gold",
  "#9CA3AF": "Grey Melange",
};
function getColorName(hex: string): string {
  return COLOR_NAME_MAP[hex.toUpperCase()] || COLOR_NAME_MAP[hex] || hex;
}

export default function ToolPanel({
  activeTool, bodyColor, isUploading,
  onToolSelect, onColorSelect, onAddText, onUploadClick,
  availableColors, textElements = [], onUpdateTextElement, onRemoveElement,
}: ToolPanelProps) {
  const [newText, setNewText] = useState("Your Text Here");
  const [names, setNames] = useState("");

  const colorList = availableColors?.map(hex => ({ hex, name: getColorName(hex) })) || COLOR_PRESETS;
  const colorName = getColorName(bodyColor);

  return (
    <>
      {/* ── Narrow Icon Sidebar ───────────────────────────────────── */}
      <div className={styles.leftSidebar}>
        {SIDEBAR_TOOLS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            className={`${styles.sidebarToolBtn} ${activeTool === key ? styles.sidebarToolActive : ""}`}
            onClick={() => onToolSelect(activeTool === key ? null : key)}
          >
            <Icon size={22} className={styles.sidebarToolIcon} strokeWidth={1.8} />
            <span className={styles.sidebarToolLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Context Panel Card ────────────────────────────────────── */}
      {activeTool && (
        <div className={styles.contextPanel}>
          {/* Card header */}
          <div className={styles.contextHeader}>
            <div className={styles.contextTitle}>
              {activeTool === "Colors"  && "Material color"}
              {activeTool === "Text"    && "Text"}
              {activeTool === "Names"   && "Names & Numbers"}
              {activeTool === "Uploads" && "Uploads"}
            </div>
            <button className={styles.closeContextBtn} onClick={() => onToolSelect(null)} title="Close">
              <ArrowUpRight size={16} />
            </button>
          </div>

          {/* ── MATERIAL COLOR ─────────────────────────────────────── */}
          {activeTool === "Colors" && (
            <div className={styles.contextBody}>
              <div className={styles.selectedColorPill}>
                Selected color:&nbsp;<strong>{colorName}</strong>
              </div>
              <div className={styles.colorGrid}>
                {colorList.map((p) => (
                  <button
                    key={p.hex}
                    onClick={() => onColorSelect(p.hex)}
                    title={p.name}
                    className={styles.colorSwatch}
                    style={{
                      background: p.hex,
                      border: p.hex.toUpperCase() === "#FFFFFF" ? "1px solid #D1D5DB" : "none",
                      boxShadow: bodyColor.toLowerCase() === p.hex.toLowerCase()
                        ? "0 0 0 2.5px white, 0 0 0 4.5px #007aff"
                        : "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                ))}
              </div>
              {/* Custom color */}
              <label className={styles.customColorRow}>
                <span className={styles.ctxHint}>Custom color</span>
                <input
                  type="color"
                  value={bodyColor}
                  onChange={(e) => onColorSelect(e.target.value)}
                  className={styles.customColorInput}
                />
              </label>
            </div>
          )}

          {/* ── TEXT ───────────────────────────────────────────────── */}
          {activeTool === "Text" && (
            <div className={styles.contextBody}>
              <p className={styles.ctxHint}>
                Edit your text below, or click on the field you'd like to edit directly on your design.
              </p>

              {/* List of existing text elements */}
              {textElements.length > 0 && (
                <div className={styles.textElementList}>
                  {textElements.map((el) => (
                    <div key={el.id} className={styles.textElementRowWrap}>
                      <label className={styles.textElementLabel}>Text: {el.value || "Text"}</label>
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
                          title="Delete"
                        >
                          <Trash2 size={18} color="#111" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                className={styles.addAssetBtn}
                onClick={() => { onAddText("Your Text Here"); }}
                style={{ marginTop: "12px" }}
              >
                New Text Field
              </button>
            </div>
          )}

          {/* ── NAMES ──────────────────────────────────────────────── */}
          {activeTool === "Names" && (
            <div className={styles.contextBody}>
              <p className={styles.ctxHint}>
                Add player names or numbers, one per line. Each becomes a text element on the design.
              </p>
              <textarea
                className={styles.ctxTextarea}
                value={names}
                onChange={(e) => setNames(e.target.value)}
                rows={7}
                placeholder={"Alice\nBob\nCharlie"}
              />
              <button
                className={styles.addAssetBtn}
                onClick={() => {
                  names.split("\n").filter(l => l.trim()).forEach(line => onAddText(line.trim()));
                  setNames("");
                }}
              >
                <Plus size={15} /> Add Names to Design
              </button>
            </div>
          )}

          {/* ── UPLOADS ────────────────────────────────────────────── */}
          {activeTool === "Uploads" && (
            <div className={styles.contextBody}>
              <button className={styles.addAssetBtn} onClick={onUploadClick} disabled={isUploading}>
                <UploadCloud size={16} />
                {isUploading ? "Uploading…" : "Upload from this device"}
              </button>
              <button className={styles.addAssetBtnOutline}>
                <Smartphone size={16} />
                Upload from phone
              </button>
              <div className={styles.uploadSignInWrap}>
                <p className={styles.ctxHint}>Sign in to access previous uploads.</p>
                <button className={styles.signInBtn}>
                  <LogIn size={14} /> Sign in
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
