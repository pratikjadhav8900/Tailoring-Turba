"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Type, UploadCloud, Shirt, X, Plus, ArrowUpRight, Smartphone, Trash2, LogIn, HelpCircle,
  Sliders, ArrowLeft, LayoutTemplate, Bold, Underline, AlignLeft, Copy, ChevronUp, ChevronDown, Link2
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import styles from "./PoloCustomizer.module.css";
import { COLOR_PRESETS, GARMENTS } from "@/lib/fabric-data";
import { ALL_PRESETS as TEXT_PRESETS } from "@/lib/presets";
import { DesignElement } from "@/types/customizer";
import { getElementDetails, getPrintableAreaDimensionsPx, SIZE_SCALES } from "@/lib/customizer-utils";

type ActiveTool = "Text" | "Uploads" | "Colors" | "Presets" | "Guide" | "Properties" | null;

type UserAsset = {
  id: string;
  url: string;
  createdAt: string;
};

interface ToolPanelProps {
  activeTool: ActiveTool;
  bodyColor: string;
  isUploading: boolean;
  onToolSelect: (tool: ActiveTool) => void;
  onColorSelect: (color: string) => void;
  onAddText: (text?: string) => void;
  onAddPreset?: (presetId: string, text: string | string[]) => void;
  onUploadClick: () => void;
  onAddLogoUrl?: (url: string) => void;
  availableColors?: string[];
  textElements?: DesignElement[];
  onUpdateTextElement?: (id: string, value: string) => void;
  onRemoveElement?: (id: string) => void;
  activeElement?: DesignElement | null;
  onUpdateElement?: (id: string, updates: Partial<DesignElement>) => void;
  onCopyElement?: (id: string, e?: React.SyntheticEvent) => void;
  garmentType: string;
  activeSide: string;
  previewSize?: "S" | "M" | "L" | "XL" | "XXL";
  onPreviewSizeChange?: (size: "S" | "M" | "L" | "XL" | "XXL") => void;
}

const SIDEBAR_TOOLS = [
  { key: "Colors" as ActiveTool,  icon: Shirt,       label: "Material\ncolor" },
  { key: "Text" as ActiveTool,    icon: Type,        label: "Text" },
  { key: "Presets" as ActiveTool, icon: LayoutTemplate, label: "Font\ncombos" },
  { key: "Uploads" as ActiveTool, icon: UploadCloud, label: "Uploads" },
  { key: "Properties" as ActiveTool, icon: Sliders,  label: "Edit\nElement", hideWhenNoElement: true },
  { key: "Guide" as ActiveTool,   icon: HelpCircle,  label: "Printing\nGuide" },
];

const FONTS = [
  "Inter", "Outfit", "Oswald", "Montserrat", "Playfair Display", "Bebas Neue",
  "Roboto", "Poppins", "Lato", "Raleway", "Aladin", "Arimo", "Abel",
  "Abril Fatface", "Adamina", "Advent Pro", "Alegreya", "Alex Brush", "Allison",
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
  onToolSelect, onColorSelect, onAddText, onAddPreset, onUploadClick, onAddLogoUrl,
  availableColors, textElements = [], onUpdateTextElement, onRemoveElement,
  activeElement, onUpdateElement, onCopyElement, garmentType, activeSide,
  previewSize = "M", onPreviewSizeChange,
}: ToolPanelProps) {
  const { data: session } = useSession();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [presetInput, setPresetInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (activeTool !== "Uploads" || !session?.user?.id) return;
    if (!isUploading) {
      setIsLoadingAssets(true);
      fetch('/api/user-assets')
        .then(res => res.json())
        .then(data => {
          if (data.assets) setUserAssets(data.assets);
        })
        .finally(() => setIsLoadingAssets(false));
    }
  }, [activeTool, session, isUploading]);

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openQrModal = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setQrSessionId(id);
    setShowQrModal(true);
    fetch(`/api/upload-session?session=${id}`).catch(() => {});
  }, []);

  const closeQrModal = useCallback(() => {
    setShowQrModal(false);
    setQrSessionId(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!showQrModal || !qrSessionId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload-session?session=${qrSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.url) {
          if (pollRef.current) clearInterval(pollRef.current);
          onAddLogoUrl?.(data.url);
          setTimeout(closeQrModal, 2000);
        }
      } catch { }
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [showQrModal, qrSessionId, onAddLogoUrl, closeQrModal]);

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

  const details = activeElement ? getElementDetails(activeElement, garmentType, activeSide, previewSize) : null;
  const printableArea = activeElement ? getPrintableAreaDimensionsPx(garmentType, activeSide) : null;

  const currentGarment = GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"];
  const sidePrintable = (currentGarment.printableArea as any)?.[activeSide] || currentGarment.printableArea;
  const printableWidthPercent = parseFloat(sidePrintable?.width || "40%") / 100;
  const printableHeightPercent = parseFloat(sidePrintable?.height || "50%") / 100;
  const printableLeftPercent = parseFloat(sidePrintable?.left || "30%") / 100;
  const printableTopPercent = parseFloat(sidePrintable?.top || "19%") / 100;

  const printableLeftPx = 560 * printableLeftPercent;
  const printableTopPx = 560 * printableTopPercent;
  const printableWidthPx = 560 * printableWidthPercent;
  const printableHeightPx = 560 * printableHeightPercent;

  // Local input states for width & height
  const [widthInput, setWidthInput] = useState(details ? details.widthInches.toString() : "");
  const [heightInput, setHeightInput] = useState(details ? details.heightInches.toString() : "");
  const [isFocusedW, setIsFocusedW] = useState(false);
  const [isFocusedH, setIsFocusedH] = useState(false);

  useEffect(() => {
    if (details && !isFocusedW) {
      setWidthInput(details.widthInches.toString());
    }
  }, [details?.widthInches, isFocusedW]);

  useEffect(() => {
    if (details && !isFocusedH) {
      setHeightInput(details.heightInches.toString());
    }
  }, [details?.heightInches, isFocusedH]);

  const handleWidthChange = (val: number) => {
    if (!activeElement || isNaN(val) || val <= 0) return;
    const scale = SIZE_SCALES[previewSize] || 1.0;
    const pxPerInch = (printableWidthPx / 12) * scale;
    let newWidth = Math.round(val * pxPerInch);
    newWidth = Math.max(20, Math.min(560, newWidth));

    const aspectRatio = activeElement.width / activeElement.height;
    let newHeight = Math.round(newWidth / aspectRatio);
    newHeight = Math.max(20, Math.min(560, newHeight));

    const ratio = newWidth / activeElement.width;
    const updates: Partial<DesignElement> = { width: newWidth, height: newHeight };
    if (activeElement.type === "text" && activeElement.fontSize) {
      updates.fontSize = Math.round(activeElement.fontSize * ratio);
    }

    onUpdateElement?.(activeElement.id, updates);
  };

  const handleHeightChange = (val: number) => {
    if (!activeElement || isNaN(val) || val <= 0) return;
    const scale = SIZE_SCALES[previewSize] || 1.0;
    const pxPerInch = (printableWidthPx / 12) * scale;
    let newHeight = Math.round(val * pxPerInch);
    newHeight = Math.max(20, Math.min(560, newHeight));

    const aspectRatio = activeElement.width / activeElement.height;
    let newWidth = Math.round(newHeight * aspectRatio);
    newWidth = Math.max(20, Math.min(560, newWidth));

    const ratio = newWidth / activeElement.width;
    const updates: Partial<DesignElement> = { width: newWidth, height: newHeight };
    if (activeElement.type === "text" && activeElement.fontSize) {
      updates.fontSize = Math.round(activeElement.fontSize * ratio);
    }

    onUpdateElement?.(activeElement.id, updates);
  };

  const applyPresetSizeAndPosition = (targetWidthInches: number, positionType: "left-chest" | "center" | "locker-patch" | "oversized") => {
    if (!activeElement) return;
    const pxPerInch = (printableWidthPx / 12);
    
    const aspectRatio = activeElement.width / activeElement.height;
    const targetPx = targetWidthInches * pxPerInch;
    
    let newWidth = 0;
    let newHeight = 0;
    
    if (aspectRatio >= 1) {
      newWidth = targetPx;
      newHeight = targetPx / aspectRatio;
    } else {
      newHeight = targetPx;
      newWidth = targetPx * aspectRatio;
    }
    
    newWidth = Math.max(20, Math.min(560, Math.round(newWidth)));
    newHeight = Math.max(20, Math.min(560, Math.round(newHeight)));
    
    let newX = activeElement.x;
    let newY = activeElement.y;
    
    if (positionType === "left-chest") {
      newX = Math.round(printableLeftPx + (printableWidthPx * 0.72) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx * 0.25) - (newHeight / 2));
    } else if (positionType === "locker-patch") {
      newX = Math.round(printableLeftPx + (printableWidthPx / 2) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx * 0.18) - (newHeight / 2));
    } else if (positionType === "oversized") {
      newX = Math.round(printableLeftPx + (printableWidthPx / 2) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx / 2) - (newHeight / 2));
    } else {
      newX = Math.round(printableLeftPx + (printableWidthPx / 2) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx * 0.38) - (newHeight / 2));
    }
    
    newX = Math.max(0, Math.min(560 - newWidth, newX));
    newY = Math.max(0, Math.min(560 - newHeight, newY));
    
    const ratio = newWidth / activeElement.width;
    const updates: Partial<DesignElement> = {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY
    };
    if (activeElement.type === "text" && activeElement.fontSize) {
      updates.fontSize = Math.round(activeElement.fontSize * ratio);
    }

    onUpdateElement?.(activeElement.id, updates);
  };

  const bump = (delta: number) => {
    if (!activeElement) return;
    const fontSize = activeElement.fontSize || 24;
    const next = Math.max(8, Math.min(200, fontSize + delta));
    onUpdateElement?.(activeElement.id, { fontSize: next });
  };

  const currentColor = activeElement?.color || "#111111";
  const currentColorName = TEXT_COLORS.find(c => c.hex.toLowerCase() === currentColor.toLowerCase())?.name || "Color";
  const currentPrintType = activeElement?.printType || "dtf";

  const colorList = availableColors?.map(hex => ({ hex, name: getColorName(hex) })) || COLOR_PRESETS;
  const colorName = getColorName(bodyColor);

  return (
    <>
      <div className={styles.leftSidebar}>
        {SIDEBAR_TOOLS.map(({ key, icon: Icon, label, hideWhenNoElement }) => {
          if (hideWhenNoElement && !activeElement) return null;
          return (
            <button
              key={key}
              className={`${styles.sidebarToolBtn} ${activeTool === key ? styles.sidebarToolActive : ""}`}
              onClick={() => onToolSelect(activeTool === key ? null : key)}
            >
              <Icon size={22} className={styles.sidebarToolIcon} strokeWidth={1.8} />
              <span className={styles.sidebarToolLabel}>{label}</span>
            </button>
          );
        })}
      </div>

      {activeTool && (
        <div className={styles.contextPanel}>
          <div className={styles.contextHeader}>
            <div className={styles.contextTitle}>
              {activeTool === "Colors"  && "Material color"}
              {activeTool === "Text"    && "Text"}
              {activeTool === "Presets" && "Font combos"}
              {activeTool === "Uploads" && "Uploads"}
              {activeTool === "Guide"   && "Printing Guide"}
              {activeTool === "Properties" && "Edit Element"}
            </div>
            <button className={styles.closeContextBtn} onClick={() => onToolSelect(null)} title="Close">
              <ArrowUpRight size={16} />
            </button>
          </div>

          {activeTool === "Colors" && (
            <div className={styles.contextBody}>
              <div className={styles.selectedColorBanner}>
                <div className={styles.selectedColorDot} style={{ backgroundColor: bodyColor === "transparent" ? "#e5e7eb" : bodyColor }} />
                <div>
                  <div className={styles.selectedColorLabel}>Selected Color</div>
                  <div className={styles.selectedColorName}>{colorName === bodyColor ? "Custom" : colorName}</div>
                </div>
              </div>
              <div className={styles.colorSwatchGrid}>
                {colorList.map((p) => {
                  const isSelected = bodyColor.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button key={p.hex} onClick={() => onColorSelect(p.hex)} className={`${styles.colorSwatchCard} ${isSelected ? styles.colorSwatchCardActive : ""}`}>
                      <div className={styles.colorSwatchBlock} style={{ backgroundColor: p.hex }}>
                        {isSelected && <div className={styles.colorCheckmark}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke={p.hex.toUpperCase() === "#FFFFFF" ? "#111" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                      </div>
                      <span className={styles.colorSwatchName}>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTool === "Text" && (
            <div className={styles.contextBody}>
              <p className={styles.ctxHint}>Edit your text below, or click on the field you'd like to edit directly on your design.</p>
              {textElements.length > 0 && (
                <div className={styles.textElementList}>
                  {textElements.map((el) => (
                    <div key={el.id} className={styles.textElementRowWrap}>
                      <label className={styles.textElementLabel}>Text: {el.value || "Text"}</label>
                      <div className={styles.textElementRow}>
                        <input className={styles.textElementInput} value={el.value} onChange={(e) => onUpdateTextElement?.(el.id, e.target.value)} placeholder="Text" />
                        <button className={styles.textElementDelete} onClick={() => onRemoveElement?.(el.id)}><Trash2 size={18} color="#111" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

          {/* ── PRESETS (FONT COMBINATIONS) ────────────────────────────────────────────── */}
          {activeTool === "Presets" && (
            <div className={styles.contextBody}>
              <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}>Categories</label>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                  {["All", "vintage", "anime", "literature", "brand", "y2k"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        whiteSpace: "nowrap",
                        border: "1px solid",
                        borderColor: activeCategory === cat ? "#0F172A" : "#CBD5E1",
                        background: activeCategory === cat ? "#0F172A" : "#FFFFFF",
                        color: activeCategory === cat ? "#FFFFFF" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}>What do you want it to say?</label>
                <textarea
                  value={presetInput}
                  onChange={(e) => setPresetInput(e.target.value)}
                  placeholder="Type your text here..."
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1",
                    fontSize: "0.9rem", minHeight: "60px", resize: "vertical", background: "#F8FAFC", fontFamily: "inherit"
                  }}
                />
              </div>
              <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
                {TEXT_PRESETS.filter(p => activeCategory === "All" || p.category === activeCategory).map((preset) => {
                  const inputLines = presetInput ? presetInput.split("\n") : [];
                  
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onAddPreset?.(preset.id, presetInput ? presetInput.split("\n") : preset.elements.map(e => e.value || ""))}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                        paddingBottom: "100%",
                        width: "100%",
                        position: "relative",
                        cursor: "pointer",
                        overflow: "hidden",
                        transition: "transform 0.2s, border-color 0.2s",
                        display: "block",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.borderColor = "#94A3B8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }}
                    >
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", width: preset.width, height: preset.height, transform: `scale(${110 / Math.max(preset.width, preset.height)})`, transformOrigin: "center center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {preset.elements.map((el, i) => {
                            let displayVal = el.value;
                            if (presetInput) {
                              if (preset.elements.length === 1) {
                                displayVal = presetInput;
                              } else {
                                displayVal = inputLines[i] || "";
                              }
                            }
                            
                            // Auto-verticalize if the original preset was perfectly vertical
                            const origVal = el.value || "";
                            const origLetters = origVal.replace(/\n/g, '');
                            const isVertical = origVal.includes('\n') && origVal.length === origLetters.length * 2 - 1;
                            
                            if (isVertical && displayVal && !displayVal.includes('\n')) {
                              displayVal = displayVal.split('').join('\n');
                            }
                            
                            return (
                              <div
                                key={i}
                                style={{
                                  position: el.y !== undefined ? "absolute" : "relative",
                                  top: el.y !== undefined ? 0 : "auto",
                                  left: el.y !== undefined ? 0 : "auto",
                                  transform: el.y !== undefined ? `translate(${el.x || 0}px, ${el.y}px)` : "none",
                                  color: el.color || "#000",
                                  fontSize: `${el.fontSize}px`,
                                  fontFamily: el.fontFamily || "Inter",
                                  fontWeight: el.fontWeight || "normal",
                                  fontStyle: el.fontStyle || "normal",
                                  textTransform: el.uppercase ? "uppercase" : "none",
                                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
                                  lineHeight: el.lineHeight || 1.2,
                                  textShadow: el.textShadow,
                                  WebkitTextStroke: el.WebkitTextStroke,
                                  backgroundColor: el.backgroundColor,
                                  backgroundImage: el.backgroundImage,
                                  WebkitBackgroundClip: el.WebkitBackgroundClip,
                                  WebkitTextFillColor: el.WebkitTextFillColor,
                                  padding: el.padding,
                                  borderRadius: el.borderRadius,
                                  border: el.border,
                                  borderTop: el.borderTop,
                                  borderBottom: el.borderBottom,
                                  borderLeft: el.borderLeft,
                                  borderRight: el.borderRight,
                                  whiteSpace: "pre-wrap",
                                  textAlign: el.textAlign || "center",
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
          )}

          {/* ── UPLOADS ────────────────────────────────────────────── */}
          {activeTool === "Uploads" && (
            <div className={styles.contextBody}>
              <button className={styles.addAssetBtn} onClick={onUploadClick} disabled={isUploading}>
                <UploadCloud size={16} />
                {isUploading ? "Uploading…" : "Upload from this device"}
              </button>
              <button className={`${styles.addAssetBtnOutline} ${styles.desktopOnly}`} onClick={openQrModal}>
                <Smartphone size={16} />
                Upload from phone
              </button>

              {session ? (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Your Uploads</label>
                  {isLoadingAssets ? (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>Loading...</div>
                  ) : userAssets.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {userAssets.map(asset => (
                        <button 
                          key={asset.id} 
                          onClick={() => onAddLogoUrl?.(asset.url)}
                          style={{
                            aspectRatio: '1',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#F8FAFC',
                            cursor: 'pointer'
                          }}
                          title="Add to design"
                        >
                          <img src={asset.url} alt="upload" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                      No previous uploads found.
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.uploadSignInWrap}>
                  <p className={styles.ctxHint}>Sign in to access previous uploads.</p>
                  <button className={styles.signInBtn} onClick={() => signIn()}>
                    <LogIn size={14} /> Sign in
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PRINTING GUIDE ─────────────────────────────────────── */}
          {activeTool === "Guide" && (
            <div className={styles.contextBody} style={{ gap: '14px', display: 'flex', flexDirection: 'column' }}>
              <p className={styles.ctxHint} style={{ marginBottom: '4px' }}>
                Pick the right printing method for your custom design and budget:
              </p>

              <div className={styles.guideSidebarCard} style={{ borderLeft: '4px solid #3B82F6' }}>
                <div className={styles.guideSidebarHeader}>
                  <span className={styles.guideSidebarTitle}>DTF (Direct to Film)</span>
                  <span className={styles.guideSidebarBadge} style={{ background: '#EFF6FF', color: '#1D4ED8' }}>Vibrant</span>
                </div>
                <p className={styles.guideSidebarText}><strong>Best For:</strong> Multi-color logos, fine details, and gradients.</p>
                <p className={styles.guideSidebarText}><strong>Feel:</strong> Thin, smooth, stretchable, and durable.</p>
              </div>

              <div className={styles.guideSidebarCard} style={{ borderLeft: '4px solid #8B5CF6' }}>
                <div className={styles.guideSidebarHeader}>
                  <span className={styles.guideSidebarTitle}>Screen Printing</span>
                  <span className={styles.guideSidebarBadge} style={{ background: '#F5F3FF', color: '#6D28D9' }}>Classic</span>
                </div>
                <p className={styles.guideSidebarText}><strong>Best For:</strong> Bold graphics, block text, and bulk orders.</p>
                <p className={styles.guideSidebarText}><strong>Feel:</strong> Premium, matte, slightly raised vibrant texture.</p>
              </div>

              <div className={styles.guideSidebarCard} style={{ borderLeft: '4px solid #D97706' }}>
                <div className={styles.guideSidebarHeader}>
                  <span className={styles.guideSidebarTitle}>Embroidery</span>
                  <span className={styles.guideSidebarBadge} style={{ background: '#FEF3C7', color: '#B45309' }}>Premium</span>
                </div>
                <p className={styles.guideSidebarText}><strong>Best For:</strong> High-end corporate branding, chest, and back logos.</p>
                <p className={styles.guideSidebarText}><strong>Feel:</strong> Luxury textured, raised thread finish.</p>
              </div>
            </div>
          )}

          {/* ── PROPERTIES (EDIT ELEMENT) ─────────────────────────── */}
          {activeTool === "Properties" && (
            <div className={styles.contextBody} style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
              {!activeElement || !details ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>No element selected</p>
                  <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>Click on any text or logo on the preview to customize its properties.</p>
                </div>
              ) : (
                <>
                  {/* Element Type Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {activeElement.type === "text" ? "Text Layer" : activeElement.type === "preset" ? "Text Preset Layer" : "Logo Layer"}
                    </span>
                    
                    {/* DPI Badge (Logo Only) */}
                    {activeElement.type === "logo" && details.dpi && (
                      <div
                        className={`${styles.tfDpiBadge} ${
                          details.dpiQuality === "Good"
                            ? styles.tfDpiGood
                            : details.dpiQuality === "Fair"
                            ? styles.tfDpiFair
                            : styles.tfDpiBad
                        }`}
                        style={{ margin: 0 }}
                        title={`Image resolution at this scale. Recommended is 300 DPI. Original: ${activeElement.originalWidth}x${activeElement.originalHeight}px`}
                      >
                        DPI: {details.dpi}
                      </div>
                    )}
                  </div>

                  {/* Text Edit Area (Text Only or Preset) */}
                  {(activeElement.type === "text" || activeElement.type === "preset") && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Text Content</label>
                      {activeElement.type === "preset" ? (() => {
                        const presetDef = TEXT_PRESETS.find(p => p.id === activeElement.presetId);
                        const isArray = Array.isArray(activeElement.presetText);
                        const lines = isArray ? (activeElement.presetText as string[]) : [(activeElement.presetText as string) || ""];
                        if (presetDef && presetDef.elements.length > 1) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {presetDef.elements.map((el, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  className={styles.textElementInput}
                                  style={{ width: '100%', padding: '8px 12px', border: '2px solid #007aff', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, background: '#f0f7ff', outline: 'none' }}
                                  value={lines[i] !== undefined ? lines[i] : (el.value || "")}
                                  onChange={(e) => {
                                    const newLines = [...lines];
                                    // Ensure array is populated
                                    while (newLines.length < presetDef.elements.length) {
                                      newLines.push(presetDef.elements[newLines.length].value || "");
                                    }
                                    newLines[i] = e.target.value;
                                    onUpdateElement?.(activeElement.id, { presetText: newLines });
                                  }}
                                  placeholder={`Text ${i + 1}`}
                                />
                              ))}
                            </div>
                          );
                        }
                        
                        return (
                          <textarea
                            className={styles.textElementInput}
                            style={{ 
                              width: '100%', padding: '10px 12px', border: '2px solid #007aff', borderRadius: '8px',
                              fontSize: '1rem', fontWeight: 600, background: '#f0f7ff', outline: 'none', resize: 'vertical', minHeight: '60px'
                            }}
                            value={isArray ? lines.join("\n") : (activeElement.presetText as string || "")}
                            onChange={(e) => onUpdateElement?.(activeElement.id, { presetText: e.target.value })}
                            placeholder="Type your text here..."
                          />
                        );
                      })() : (
                        <input
                          type="text"
                          className={styles.textElementInput}
                          style={{ 
                            width: '100%', padding: '10px 12px', border: '2px solid #007aff', borderRadius: '8px',
                            fontSize: '1rem', fontWeight: 600, background: '#f0f7ff', outline: 'none',
                          }}
                          value={activeElement.value}
                          onChange={(e) => onUpdateElement?.(activeElement.id, { value: e.target.value })}
                          placeholder="Type your text here..."
                          autoFocus
                        />
                      )}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF7ED', border: '1px solid #FED7AA',
                        borderRadius: '6px', padding: '7px 10px', fontSize: '0.75rem', color: '#9A3412', fontWeight: 500,
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>✏️</span>
                        Tap the field above to change your text
                      </div>
                    </div>
                  )}


                  {/* Font Family (Text Only) */}
                  {activeElement.type === "text" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Font Family</label>
                      <select
                        className={styles.tfFontSelect}
                        style={{ width: '100%', fontFamily: activeElement.fontFamily || "Inter", padding: '8px 12px' }}
                        value={activeElement.fontFamily || "Inter"}
                        onChange={(e) => onUpdateElement?.(activeElement.id, { fontFamily: e.target.value })}
                      >
                        {FONTS.map(f => (
                          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Font Size & Color Row (Text Only) */}
                  {activeElement.type === "text" && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Font Size */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Font Size</label>
                        <div className={styles.tfSizeGroup} style={{ width: '100%' }}>
                          <button className={styles.tfSizeBtn} onClick={() => bump(-1)}><ChevronDown size={12} /></button>
                          <input
                            type="number"
                            className={styles.tfSizeInput}
                            style={{ flex: 1, padding: 0 }}
                            value={activeElement.fontSize || 24}
                            min={8} max={200}
                            onChange={(e) => onUpdateElement?.(activeElement.id, { fontSize: Math.max(8, Number(e.target.value)) })}
                          />
                          <button className={styles.tfSizeBtn} onClick={() => bump(1)}><ChevronUp size={12} /></button>
                        </div>
                      </div>

                      {/* Text Color dropdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Text Color</label>
                        <div ref={wrapRef} className={styles.tfColorDropdownWrap} style={{ width: '100%' }}>
                          <button
                            className={styles.tfColorDropdownBtn}
                            style={{ width: '100%', padding: '7px 10px' }}
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
                            <span className={styles.tfColorBtnLabel} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentColorName}</span>
                            <ChevronDown size={12} color="#6B7280" />
                          </button>

                          {showColorPicker && (
                            <div className={styles.tfColorDropdown} style={{ left: 0, right: 'auto', width: '220px', zIndex: 100 }}>
                              <div className={styles.tfColorDropdownGrid}>
                                {TEXT_COLORS.map((c) => {
                                  const isActive = currentColor.toLowerCase() === c.hex.toLowerCase();
                                  return (
                                    <button
                                      key={c.hex}
                                      className={`${styles.tfColorOption} ${isActive ? styles.tfColorOptionActive : ""}`}
                                      onClick={() => { onUpdateElement?.(activeElement.id, { color: c.hex }); setShowColorPicker(false); }}
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
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formatting Buttons: Bold, Underline, Alignment (Text Only) */}
                  {activeElement.type === "text" && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Styles</label>
                        <div className={styles.tfBtnGroup} style={{ width: 'fit-content' }}>
                          <button
                            className={`${styles.tfBtn} ${activeElement.fontWeight === "bold" ? styles.tfBtnOn : ""}`}
                            onClick={() => onUpdateElement?.(activeElement.id, { fontWeight: activeElement.fontWeight === "bold" ? "normal" : "bold" })}
                            title="Bold"
                          >
                            <Bold size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            className={`${styles.tfBtn} ${activeElement.textDecoration === "underline" ? styles.tfBtnOn : ""}`}
                            onClick={() => onUpdateElement?.(activeElement.id, { textDecoration: activeElement.textDecoration === "underline" ? "none" : "underline" })}
                            title="Underline"
                          >
                            <Underline size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Alignment</label>
                        <div className={styles.tfBtnGroup} style={{ width: 'fit-content' }}>
                          <button
                            className={`${styles.tfBtn} ${activeElement.textAlign === "left" ? styles.tfBtnOn : ""}`}
                            onClick={() => onUpdateElement?.(activeElement.id, { textAlign: "left" })}
                            title="Align Left"
                          >
                            <AlignLeft size={16} strokeWidth={2} />
                          </button>
                          <button
                            className={`${styles.tfBtn} ${activeElement.textAlign === "center" ? styles.tfBtnOn : ""}`}
                            onClick={() => onUpdateElement?.(activeElement.id, { textAlign: "center" })}
                            title="Align Center"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="10" x2="6" y2="10" />
                              <line x1="21" y1="6" x2="3" y2="6" />
                              <line x1="21" y1="14" x2="3" y2="14" />
                              <line x1="18" y1="18" x2="6" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dimensions (Inches) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Dimensions (Inches)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.tfInputWrapper} style={{ flex: 1 }} title="Width in Inches">
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

                      <div className={styles.tfLinkIcon} title="Aspect Ratio Locked" style={{ margin: '0 4px' }}>
                        <Link2 size={13} color="#9CA3AF" strokeWidth={2.5} />
                      </div>

                      <div className={styles.tfInputWrapper} style={{ flex: 1 }} title="Height in Inches">
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

                    {/* Quick Size Presets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Quick Size & Position Presets:</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {activeSide === "front" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(2, "left-chest")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Small (2")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(3.5, "left-chest")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Left Chest (3.5")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(4, "left-chest")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Pocket/Patch (4")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(8.5, "center")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Center Chest (8.5")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(10, "center")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Large Print (10")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(11.5, "oversized")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Oversized (11.5")
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(2, "locker-patch")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Small (2")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(3.5, "locker-patch")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Locker Patch (3.5")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(4, "locker-patch")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Pocket Patch (4")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(8.5, "center")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Center Back (8.5")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(10, "center")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Large Print (10")
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetSizeAndPosition(11.5, "oversized")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                background: '#F8FAFC',
                                cursor: 'pointer',
                                color: '#334155',
                                transition: 'all 0.15s',
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                              Full Back (11.5")
                            </button>
                          </>
                        )}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontStyle: 'italic', lineHeight: '1.2' }}>
                        💡 Industry standard left chest is 3"–4", center print is 8"–10", oversized print is 11"–12".
                      </span>
                    </div>
                  </div>

                  {/* Printing Method */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Printing Method</label>
                      <button
                        className={styles.tfHelpBtn}
                        onClick={() => onToolSelect("Guide")}
                        title="View Printing Methods Guide"
                        style={{ padding: '2px', height: 'auto', background: 'none' }}
                      >
                        <HelpCircle size={15} strokeWidth={2} />
                      </button>
                    </div>
                    
                    {/* Print Type Pills Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <button
                        className={`${styles.tfPrintBtn} ${currentPrintType === "dtf" ? styles.tfPrintBtnActive : ""}`}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                        onClick={() => onUpdateElement?.(activeElement.id, { printType: "dtf" })}
                      >
                        DTF
                      </button>
                      <button
                        className={`${styles.tfPrintBtn} ${currentPrintType === "screen" ? styles.tfPrintBtnActive : ""}`}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                        onClick={() => onUpdateElement?.(activeElement.id, { printType: "screen" })}
                      >
                        Screen
                      </button>
                      <button
                        className={`${styles.tfPrintBtn} ${currentPrintType === "embroidery" ? styles.tfPrintBtnActive : ""}`}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                        onClick={() => onUpdateElement?.(activeElement.id, { printType: "embroidery" })}
                      >
                        Embroidery
                      </button>
                    </div>
                  </div>

                  {/* Design/Embroidery Color Settings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                      {currentPrintType === "embroidery" ? "Embroidery Colors" : "Design Colors"}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        className={`${styles.tfPrintBtn} ${details.embroideryType === "mono" ? styles.tfPrintBtnActive : ""}`}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                        onClick={() => onUpdateElement?.(activeElement.id, { embroideryType: "mono" })}
                      >
                        Mono Color
                      </button>
                      <button
                        className={`${styles.tfPrintBtn} ${details.embroideryType === "multi" ? styles.tfPrintBtnActive : ""}`}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                        onClick={() => onUpdateElement?.(activeElement.id, { embroideryType: "multi" })}
                      >
                        {currentPrintType === "embroidery" ? "Multi Color" : "Colorful"}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Copy, Delete */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <button
                      className={styles.addAssetBtnOutline}
                      style={{ flex: 1, margin: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.8rem', height: '36px' }}
                      onClick={(e) => onCopyElement?.(activeElement.id, e)}
                    >
                      <Copy size={13} /> Copy Layer
                    </button>
                    <button
                      className={styles.addAssetBtnOutline}
                      style={{ flex: 1, margin: 0, color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.8rem', height: '36px' }}
                      onClick={() => onRemoveElement?.(activeElement.id)}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── QR CODE MODAL ──────────────────────────────────────────────── */}
      {showQrModal && qrSessionId && (
        <div
          onClick={closeQrModal}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(10, 16, 32, 0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)",
              padding: "28px 28px 24px",
              width: "100%",
              maxWidth: "360px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
              animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* Modal header */}
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  {qrStatus === "received" ? "✅ Photo received!" : "Upload from phone"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                  {qrStatus === "received"
                    ? "Your image has been added to the canvas."
                    : "Scan with your phone camera to upload"}
                </div>
              </div>
              <button
                onClick={closeQrModal}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0, marginLeft: "12px" }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code or Success */}
            {qrStatus === "waiting" ? (
              <>
                <div style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}>
                  {/* QR code via api.qrserver.com */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=svg&data=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/customizer/upload-phone?session=${qrSessionId}`)}`}
                    alt="QR Code"
                    width={220}
                    height={220}
                    style={{ borderRadius: "8px", display: "block" }}
                  />
                </div>

                {/* Polling indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.6)",
                    animation: "pulseGreen 1.5s ease infinite",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Waiting for your phone upload…</span>
                </div>

                {/* Manual link */}
                <div style={{
                  width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0",
                  borderRadius: "10px", padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", wordBreak: "break-all", flex: 1, fontFamily: "monospace" }}>
                    {typeof window !== "undefined" ? window.location.origin : ""}/customizer/upload-phone?session={qrSessionId.slice(0, 20)}…
                  </span>
                </div>

                <p style={{ fontSize: "0.72rem", color: "#94a3b8", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
                  Or type the URL on your phone. Make sure both devices are connected to the same network.
                </p>
              </>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
                padding: "20px",
                background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                borderRadius: "16px",
                width: "100%",
              }}>
                <div style={{
                  width: "56px", height: "56px",
                  background: "linear-gradient(135deg, #22c55e, #15803d)",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#15803d" }}>Image added to canvas!</div>
                <div style={{ fontSize: "0.75rem", color: "#4ade80", textAlign: "center" }}>Closing automatically…</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulseGreen {
          0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </>
  );
}
