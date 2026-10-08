"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Type, UploadCloud, Shirt, X, Plus, Smartphone, Trash2, LogIn, HelpCircle,
  Sliders, LayoutTemplate, Bold, Underline, AlignLeft, Copy, ChevronDown, ChevronLeft,
  Minus, FlipHorizontal2, FlipVertical2, AlignCenterHorizontal, AlignCenterVertical,
  RotateCw, Italic, Shapes, Sparkles
} from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { GARMENTS } from "@/lib/fabric-data";
import { ALL_PRESETS as TEXT_PRESETS } from "@/lib/presets";
import { DesignElement } from "@/types/customizer";
import { getElementDetails, getPrintableAreaDimensionsPx, SIZE_SCALES } from "@/lib/customizer-utils";
import { TemplatesPanel, ElementsPanel, TextPanel, BrandKitPanel, UploadsPanel, GarmentPanel } from "./panels";

export type ActiveTool = "Templates" | "Text" | "Uploads" | "Garment" | "Properties" | null;

type PropertiesTab = "typography" | "transform" | "print";

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
  onAddSvgElement?: (element: { svg: string; name: string; color?: string }) => void;
  onApplyTemplate?: (elements: any[]) => void;
  availableColors?: string[];
  colorsJson?: any;
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

const SIDEBAR_TOOLS: { key: ActiveTool; icon: any; label: string; hideWhenNoElement?: boolean }[] = [
  { key: "Templates",  icon: LayoutTemplate, label: "Templates" },
  { key: "Text",       icon: Type,           label: "Text" },
  { key: "Uploads",    icon: UploadCloud,    label: "Uploads" },
  { key: "Garment",    icon: Shirt,          label: "Garment" },
  { key: "Properties", icon: Sliders,        label: "Edit", hideWhenNoElement: true },
];

const PANEL_TITLES: Record<string, string> = {
  Templates: "Templates",
  Text: "Text & Typography",
  Uploads: "Uploads",
  Garment: "Garment & Color",
  Properties: "Edit Element",
};

const FONT_CATEGORIES: { label: string; fonts: string[] }[] = [
  { label: "Streetwear / Bold", fonts: ["Bebas Neue", "Impact", "Oswald", "Arial Black", "Franklin Gothic Medium"] },
  { label: "Clean Sans", fonts: ["Inter", "Outfit", "Montserrat", "Roboto", "Poppins", "Lato", "Raleway", "Arimo", "Abel", "Advent Pro", "Segoe UI", "Calibri", "Candara", "Century Gothic", "Trebuchet MS", "Verdana", "Microsoft Sans Serif", "Tahoma"] },
  { label: "Vintage & Retro", fonts: ["Abril Fatface", "Adamina", "Alegreya", "Playfair Display", "Book Antiqua", "Garamond", "Georgia", "Palatino Linotype", "Times New Roman"] },
  { label: "Handwritten", fonts: ["Alex Brush", "Allison", "Aladin", "Comic Sans MS"] },
  { label: "Monospace", fonts: ["Consolas", "Courier New", "Lucida Console", "Lucida Sans Unicode"] },
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

const CURATED_PALETTES: { label: string; colors: { name: string; hex: string }[] }[] = [
  { label: "Core Basics", colors: [
    { name: "Black", hex: "#111111" }, { name: "White", hex: "#FFFFFF" },
    { name: "Heather Grey", hex: "#9CA3AF" }, { name: "Navy", hex: "#1E3A5F" },
  ]},
  { label: "Streetwear Neons", colors: [
    { name: "Cyber Lime", hex: "#BEFF00" }, { name: "Electric Purple", hex: "#BF00FF" },
    { name: "Hot Pink", hex: "#FF007F" }, { name: "Cyan", hex: "#00E5FF" },
  ]},
  { label: "Vintage Earth", colors: [
    { name: "Sage", hex: "#87AE73" }, { name: "Terracotta", hex: "#C75B39" },
    { name: "Mustard", hex: "#D4A843" }, { name: "Forest", hex: "#2D5F2E" },
  ]},
  { label: "Specialty Inks", colors: [
    { name: "Metallic Gold", hex: "#D4AF37" }, { name: "Silver", hex: "#C0C0C0" },
    { name: "Rose Gold", hex: "#B76E79" }, { name: "Copper", hex: "#B87333" },
  ]},
];

const TEXT_SHADOW_PRESETS: { label: string; value: string }[] = [
  { label: "None", value: "none" },
  { label: "Soft Glow", value: "0 0 8px rgba(0,0,0,0.3)" },
  { label: "3D Pop", value: "2px 2px 0 rgba(0,0,0,0.5), 4px 4px 0 rgba(0,0,0,0.2)" },
  { label: "Retro Drop", value: "3px 3px 0 rgba(0,0,0,0.6)" },
];

const ROTATION_PRESETS = [0, 45, 90, 180];

export default function ToolPanel({
  activeTool, bodyColor, isUploading,
  onToolSelect, onColorSelect, onAddText, onAddPreset, onUploadClick, onAddLogoUrl,
  onAddSvgElement, onApplyTemplate,
  availableColors, colorsJson, textElements = [], onUpdateTextElement, onRemoveElement,
  activeElement, onUpdateElement, onCopyElement, garmentType, activeSide,
  previewSize = "M", onPreviewSizeChange,
}: ToolPanelProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [propertiesTab, setPropertiesTab] = useState<PropertiesTab>("typography");
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState("");
  const [hexInput, setHexInput] = useState("");
  const [showPaletteSection, setShowPaletteSection] = useState(false);

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

  useEffect(() => {
    if (activeElement) {
      setPropertiesTab(activeElement.type === "logo" ? "transform" : "typography");
    }
  }, [activeElement?.id]);

  const details = activeElement ? getElementDetails(activeElement, garmentType, activeSide, previewSize) : null;

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

  const handleWidthChange = (val: number) => {
    if (!activeElement || isNaN(val) || val <= 0) return;
    const scale = SIZE_SCALES[previewSize] || 1.0;
    const isSleeve = activeSide === "left" || activeSide === "right";
    const physicalWidthInches = isSleeve ? 4 : 12;
    const pxPerInch = (printableWidthPx / physicalWidthInches) * scale;
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

  const applyPresetSizeAndPosition = (
    targetWidthInches: number,
    positionType: "left-chest" | "center" | "locker-patch" | "oversized" | "sleeve-center"
  ) => {
    if (!activeElement) return;
    const isSleeve = activeSide === "left" || activeSide === "right";
    const physicalWidthInches = isSleeve ? 4 : 12;
    const pxPerInch = printableWidthPx / physicalWidthInches;
    const aspectRatio = activeElement.width / activeElement.height;
    const targetPx = targetWidthInches * pxPerInch;
    let newWidth: number, newHeight: number;
    if (aspectRatio >= 1) { newWidth = targetPx; newHeight = targetPx / aspectRatio; }
    else { newHeight = targetPx; newWidth = targetPx * aspectRatio; }
    newWidth = Math.max(20, Math.min(560, Math.round(newWidth)));
    newHeight = Math.max(20, Math.min(560, Math.round(newHeight)));
    let newX = activeElement.x, newY = activeElement.y;
    if (positionType === "left-chest") {
      newX = Math.round(printableLeftPx + (printableWidthPx * 0.72) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx * 0.25) - (newHeight / 2));
    } else if (positionType === "locker-patch") {
      newX = Math.round(printableLeftPx + (printableWidthPx / 2) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx * 0.18) - (newHeight / 2));
    } else if (positionType === "oversized" || positionType === "sleeve-center") {
      newX = Math.round(printableLeftPx + (printableWidthPx / 2) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx / 2) - (newHeight / 2));
    } else {
      newX = Math.round(printableLeftPx + (printableWidthPx / 2) - (newWidth / 2));
      newY = Math.round(printableTopPx + (printableHeightPx * 0.38) - (newHeight / 2));
    }
    newX = Math.max(0, Math.min(560 - newWidth, newX));
    newY = Math.max(0, Math.min(560 - newHeight, newY));
    const ratio = newWidth / activeElement.width;
    const updates: Partial<DesignElement> = { width: newWidth, height: newHeight, x: newX, y: newY };
    if (activeElement.type === "text" && activeElement.fontSize) {
      updates.fontSize = Math.round(activeElement.fontSize * ratio);
    }
    onUpdateElement?.(activeElement.id, updates);
  };

  const bump = (delta: number) => {
    if (!activeElement) return;
    const next = Math.max(8, Math.min(200, (activeElement.fontSize || 24) + delta));
    onUpdateElement?.(activeElement.id, { fontSize: next });
  };

  const currentColor = activeElement?.color || "#111111";
  const currentColorName = TEXT_COLORS.find(c => c.hex.toLowerCase() === currentColor.toLowerCase())?.name || "Color";
  const currentPrintType = activeElement?.printType || "dtf";

  const currentStrokeWidth = (() => {
    if (!activeElement?.WebkitTextStroke) return 0;
    const match = activeElement.WebkitTextStroke.match(/^(\d+(?:\.\d+)?)px/);
    return match ? parseFloat(match[1]) : 0;
  })();
  const currentStrokeColor = (() => {
    if (!activeElement?.WebkitTextStroke) return "#000000";
    const parts = activeElement.WebkitTextStroke.split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : "#000000";
  })();

  const filteredFonts = useMemo(() => {
    if (!fontSearchQuery) return FONT_CATEGORIES;
    const q = fontSearchQuery.toLowerCase();
    return FONT_CATEGORIES.map(cat => ({
      ...cat,
      fonts: cat.fonts.filter(f => f.toLowerCase().includes(q))
    })).filter(cat => cat.fonts.length > 0);
  }, [fontSearchQuery]);

  const applyTextCase = (mode: "upper" | "lower" | "title") => {
    if (!activeElement) return;
    if (mode === "upper") onUpdateElement?.(activeElement.id, { uppercase: true, textTransform: "uppercase" });
    else if (mode === "lower") onUpdateElement?.(activeElement.id, { uppercase: false, textTransform: "lowercase" });
    else onUpdateElement?.(activeElement.id, { uppercase: false, textTransform: "capitalize" });
  };

  const isTextElement = activeElement?.type === "text" || activeElement?.type === "preset";
  const PROPERTIES_TABS: { key: PropertiesTab; label: string }[] = isTextElement
    ? [{ key: "typography", label: "Typography" }, { key: "transform", label: "Transform" }, { key: "print", label: "Print & Finish" }]
    : [{ key: "transform", label: "Transform" }, { key: "print", label: "Print & Finish" }];

  return (
    <>
      {/* ── ICON RAIL ── */}
      <div className={styles.leftSidebar}>
        {SIDEBAR_TOOLS.map(({ key, icon: Icon, label, hideWhenNoElement }) => {
          if (hideWhenNoElement && !activeElement) return null;
          return (
            <button key={key}
              className={`${styles.sidebarToolBtn} ${activeTool === key ? styles.sidebarToolActive : ""}`}
              onClick={() => onToolSelect(activeTool === key ? null : key)}
            >
              <Icon size={22} className={styles.sidebarToolIcon} strokeWidth={1.8} />
              <span className={styles.sidebarToolLabel}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── FLYOUT PANEL ── */}
      {activeTool && (
        <div className={styles.contextPanel}>
          <div className={styles.contextHeader}>
            <div className={styles.contextTitle}>{PANEL_TITLES[activeTool] || activeTool}</div>
            <button className={styles.closeContextBtn} onClick={() => onToolSelect(null)} title="Close">
              <ChevronLeft size={18} className={styles.collapseChevronDesktop} />
              <X size={18} className={styles.collapseChevronMobile} />
            </button>
          </div>

          {activeTool === "Templates" && <TemplatesPanel onApplyTemplate={(elements) => onApplyTemplate?.(elements)} />}
          {activeTool === "Text" && (
            <TextPanel textElements={textElements} onAddText={onAddText} onAddPreset={onAddPreset}
              onUpdateTextElement={onUpdateTextElement} onRemoveElement={onRemoveElement} />
          )}
          {activeTool === "Uploads" && <UploadsPanel isUploading={isUploading} onUploadClick={onUploadClick} onAddLogoUrl={onAddLogoUrl} />}
          {activeTool === "Garment" && (
            <GarmentPanel bodyColor={bodyColor} onColorSelect={onColorSelect} availableColors={availableColors} colorsJson={colorsJson} />
          )}

          {/* ── PROPERTIES PANEL ── */}
          {activeTool === "Properties" && (
            <div className={styles.contextBody} style={{ gap: '0', display: 'flex', flexDirection: 'column', padding: 0 }}>
              {!activeElement || !details ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>No element selected</p>
                  <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>Click on any text or logo on the preview to customize its properties.</p>
                </div>
              ) : (
                <>
                  <div className={styles.editDrawerHeader} style={{ padding: '14px 18px 12px', margin: 0 }}>
                    <span className={styles.editDrawerTitle}>
                      {activeElement.type === "text" ? "Edit Text" : activeElement.type === "preset" ? "Edit Preset" : "Edit Logo"}
                    </span>
                    {activeElement.type === "logo" && details.dpi && (
                      <span className={`${styles.dpiPill} ${details.dpi >= 300 ? styles.dpiPillGood : details.dpi >= 150 ? styles.dpiPillFair : styles.dpiPillBad}`}
                        title={`Original: ${activeElement.originalWidth}x${activeElement.originalHeight}px`}
                      >
                        {details.dpi >= 300 ? "300+ DPI" : details.dpi >= 150 ? `${details.dpi} DPI` : `${details.dpi} DPI`}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '0 18px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(activeElement.type === "text" || activeElement.type === "preset") && (
                      <>
                        {activeElement.type === "preset" ? (() => {
                          const presetDef = TEXT_PRESETS.find(p => p.id === activeElement.presetId);
                          const isArray = Array.isArray(activeElement.presetText);
                          const lines = isArray ? (activeElement.presetText as string[]) : [(activeElement.presetText as string) || ""];
                          if (presetDef && presetDef.elements.length > 1) {
                            return presetDef.elements.map((el, i) => (
                              <input key={i} type="text" className={styles.editTextInput}
                                value={lines[i] !== undefined ? lines[i] : (el.value || "")}
                                onChange={(e) => {
                                  const newLines = [...lines];
                                  while (newLines.length < presetDef.elements.length) newLines.push(presetDef.elements[newLines.length].value || "");
                                  newLines[i] = e.target.value;
                                  onUpdateElement?.(activeElement.id, { presetText: newLines });
                                }}
                                placeholder={`Text ${i + 1}`} />
                            ));
                          }
                          return (
                            <input type="text" className={styles.editTextInput}
                              value={isArray ? lines.join("") : (activeElement.presetText as string || "")}
                              onChange={(e) => onUpdateElement?.(activeElement.id, { presetText: e.target.value })}
                              placeholder="Type your text..." />
                          );
                        })() : (
                          <input type="text" className={styles.editTextInput}
                            value={activeElement.value}
                            onChange={(e) => onUpdateElement?.(activeElement.id, { value: e.target.value })}
                            placeholder="Type your text..." />
                        )}
                      </>
                    )}
                  </div>

                  <div className={styles.inspectorTabs}>
                    <div className={styles.inspectorTabBar}>
                      {PROPERTIES_TABS.map(tab => (
                        <button key={tab.key}
                          className={`${styles.inspectorTab} ${propertiesTab === tab.key ? styles.inspectorTabActive : ""}`}
                          onClick={() => setPropertiesTab(tab.key)}>{tab.label}</button>
                      ))}
                    </div>
                    <div className={styles.inspectorTabContent}>
                      {propertiesTab === "typography" && isTextElement && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {activeElement.type === "text" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className={styles.editSectionLabel}>Font Family</span>
                              <div style={{ position: 'relative' }}>
                                <button
                                  className={styles.editFontSelect}
                                  onClick={() => setShowFontPicker(v => !v)}
                                >
                                  <span style={{ fontFamily: activeElement.fontFamily || "Inter", fontSize: "0.92rem", fontWeight: 500 }}>
                                    {activeElement.fontFamily || "Inter"}
                                  </span>
                                  <ChevronDown size={14} color="#64748B" />
                                </button>
                                {showFontPicker && (
                                  <div className={styles.fontPickerDropdown}>
                                    <input type="text" className={styles.fontPickerSearch} placeholder="Search fonts..."
                                      value={fontSearchQuery} onChange={(e) => setFontSearchQuery(e.target.value)} autoFocus />
                                    <div className={styles.fontPickerList}>
                                      {filteredFonts.map(cat => (
                                        <div key={cat.label}>
                                          <div className={styles.fontPickerCategoryLabel}>{cat.label}</div>
                                          {cat.fonts.map(f => (
                                            <button key={f}
                                              className={`${styles.fontPickerItem} ${(activeElement.fontFamily || "Inter") === f ? styles.fontPickerItemActive : ""}`}
                                              style={{ fontFamily: f }}
                                              onClick={() => { onUpdateElement?.(activeElement.id, { fontFamily: f }); setShowFontPicker(false); setFontSearchQuery(""); }}>
                                              {f}
                                            </button>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {activeElement.type === "text" && (
                            <div className={styles.editFontRow}>
                              <div className={styles.editFontSizeGroup}>
                                <button className={styles.editFontSizeBtn} onClick={() => bump(-1)}><Minus size={14} /></button>
                                <span className={styles.editFontSizeValue}>{activeElement.fontSize || 24}</span>
                                <button className={styles.editFontSizeBtn} onClick={() => bump(1)}><Plus size={14} /></button>
                              </div>
                              <div ref={wrapRef} style={{ position: 'relative' }}>
                                <button className={styles.editColorBtn} onClick={() => setShowColorPicker(v => !v)}>
                                  <span className={styles.editColorDot} style={{ backgroundColor: currentColor, border: currentColor.toUpperCase() === "#FFFFFF" ? "1.5px solid #D1D5DB" : "none" }} />
                                  <span className={styles.editColorName}>{currentColorName}</span>
                                  <ChevronDown size={12} color="#94A3B8" />
                                </button>
                                {showColorPicker && (
                                  <div className={styles.tfColorDropdown} style={{ left: 0, right: 'auto', width: '240px', zIndex: 100 }}>
                                    <div style={{ padding: '8px 8px 6px', borderBottom: '1px solid #F1F5F9' }}>
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>#</span>
                                        <input type="text" value={hexInput}
                                          onChange={(e) => setHexInput(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && hexInput.length >= 3) {
                                              const hex = `#${hexInput.length === 3 ? hexInput.split('').map(c => c + c).join('') : hexInput}`;
                                              onUpdateElement?.(activeElement.id, { color: hex });
                                              setShowColorPicker(false); setHexInput("");
                                            }
                                          }}
                                          placeholder="Hex code"
                                          style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '6px', padding: '5px 8px', fontSize: '0.78rem', fontFamily: 'monospace', outline: 'none' }} />
                                      </div>
                                    </div>
                                    <button onClick={() => setShowPaletteSection(v => !v)}
                                      style={{ width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      Curated Palettes
                                      <ChevronDown size={10} style={{ transform: showPaletteSection ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    </button>
                                    {showPaletteSection && (
                                      <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {CURATED_PALETTES.map(palette => (
                                          <div key={palette.label}>
                                            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{palette.label}</div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                              {palette.colors.map(c => (
                                                <button key={c.hex}
                                                  onClick={() => { onUpdateElement?.(activeElement.id, { color: c.hex }); setShowColorPicker(false); }}
                                                  title={c.name}
                                                  style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c.hex, border: c.hex.toUpperCase() === '#FFFFFF' ? '1.5px solid #D1D5DB' : '1.5px solid transparent', cursor: 'pointer', transition: 'transform 0.15s' }}
                                                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }} />
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className={styles.tfColorDropdownGrid}>
                                      {TEXT_COLORS.map((c) => (
                                        <button key={c.hex}
                                          className={`${styles.tfColorOption} ${currentColor.toLowerCase() === c.hex.toLowerCase() ? styles.tfColorOptionActive : ""}`}
                                          onClick={() => { onUpdateElement?.(activeElement.id, { color: c.hex }); setShowColorPicker(false); }}
                                          title={c.name}>
                                          <span className={styles.tfColorOptionDot} style={{ backgroundColor: c.hex, border: c.hex.toUpperCase() === "#FFFFFF" ? "1.5px solid #D1D5DB" : "none" }} />
                                          <span className={styles.tfColorOptionName}>{c.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {activeElement.type === "text" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className={styles.editSectionLabel}>Formatting</span>
                              <div className={styles.formatBar}>
                                <button className={`${styles.formatBtn} ${activeElement.fontWeight === "bold" ? styles.formatBtnActive : ""}`}
                                  onClick={() => onUpdateElement?.(activeElement.id, { fontWeight: activeElement.fontWeight === "bold" ? "normal" : "bold" })}><Bold size={16} strokeWidth={2.5} /></button>
                                <button className={`${styles.formatBtn} ${activeElement.fontStyle === "italic" ? styles.formatBtnActive : ""}`}
                                  onClick={() => onUpdateElement?.(activeElement.id, { fontStyle: activeElement.fontStyle === "italic" ? "normal" : "italic" })}><Italic size={16} strokeWidth={2.5} /></button>
                                <button className={`${styles.formatBtn} ${activeElement.textDecoration === "underline" ? styles.formatBtnActive : ""}`}
                                  onClick={() => onUpdateElement?.(activeElement.id, { textDecoration: activeElement.textDecoration === "underline" ? "none" : "underline" })}><Underline size={16} strokeWidth={2.5} /></button>
                                <div style={{ width: 1, height: 20, background: '#CBD5E1', margin: '0 2px' }} />
                                <button className={`${styles.formatBtn} ${activeElement.textAlign === "left" ? styles.formatBtnActive : ""}`}
                                  onClick={() => onUpdateElement?.(activeElement.id, { textAlign: "left" })}><AlignLeft size={16} strokeWidth={2} /></button>
                                <button className={`${styles.formatBtn} ${activeElement.textAlign === "center" || !activeElement.textAlign ? styles.formatBtnActive : ""}`}
                                  onClick={() => onUpdateElement?.(activeElement.id, { textAlign: "center" })}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                          {activeElement.type === "text" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className={styles.editSectionLabel}>Text Case</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className={`${styles.caseBtn} ${activeElement.uppercase || activeElement.textTransform === "uppercase" ? styles.caseBtnActive : ""}`} onClick={() => applyTextCase("upper")}>AB</button>
                                <button className={`${styles.caseBtn} ${activeElement.textTransform === "lowercase" ? styles.caseBtnActive : ""}`} onClick={() => applyTextCase("lower")}>ab</button>
                                <button className={`${styles.caseBtn} ${activeElement.textTransform === "capitalize" ? styles.caseBtnActive : ""}`} onClick={() => applyTextCase("title")}>Ab</button>
                              </div>
                            </div>
                          )}
                          {activeElement.type === "text" && (<>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.editSectionLabel}>Letter Spacing</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0F172A' }}>{activeElement.letterSpacing ?? 0}px</span>
                              </div>
                              <input type="range" min={-2} max={20} step={0.5} value={activeElement.letterSpacing ?? 0}
                                onChange={(e) => onUpdateElement?.(activeElement.id, { letterSpacing: parseFloat(e.target.value) })} className={styles.sizeSliderTrack} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.editSectionLabel}>Line Height</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0F172A' }}>{(activeElement.lineHeight ?? 1.2).toFixed(1)}</span>
                              </div>
                              <input type="range" min={0.8} max={3.0} step={0.1} value={activeElement.lineHeight ?? 1.2}
                                onChange={(e) => onUpdateElement?.(activeElement.id, { lineHeight: parseFloat(e.target.value) })} className={styles.sizeSliderTrack} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.editSectionLabel}>Outline / Stroke</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0F172A' }}>{currentStrokeWidth}px</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="range" min={0} max={8} step={0.5} value={currentStrokeWidth}
                                  onChange={(e) => { const w = parseFloat(e.target.value); onUpdateElement?.(activeElement.id, { WebkitTextStroke: w > 0 ? `${w}px ${currentStrokeColor}` : "" }); }}
                                  className={styles.sizeSliderTrack} style={{ flex: 1 }} />
                                <input type="color" value={currentStrokeColor}
                                  onChange={(e) => { if (currentStrokeWidth > 0) onUpdateElement?.(activeElement.id, { WebkitTextStroke: `${currentStrokeWidth}px ${e.target.value}` }); }}
                                  style={{ width: '28px', height: '28px', border: '1.5px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', padding: '1px' }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className={styles.editSectionLabel}>Text Shadow</span>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                                {TEXT_SHADOW_PRESETS.map(preset => {
                                  const isActive = (activeElement.textShadow || "none") === preset.value || (!activeElement.textShadow && preset.value === "none");
                                  return (
                                    <button key={preset.label} className={`${styles.shadowPresetBtn} ${isActive ? styles.shadowPresetBtnActive : ""}`}
                                      onClick={() => onUpdateElement?.(activeElement.id, { textShadow: preset.value === "none" ? "" : preset.value })}>
                                      <span style={{ fontSize: '0.88rem', fontWeight: 700, textShadow: preset.value === "none" ? "none" : preset.value }}>A</span>
                                      <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>{preset.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>)}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className={styles.editSectionLabel}>Opacity</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0F172A' }}>{Math.round((activeElement.opacity ?? 1) * 100)}%</span>
                            </div>
                            <input type="range" min={10} max={100} step={5} value={Math.round((activeElement.opacity ?? 1) * 100)}
                              onChange={(e) => onUpdateElement?.(activeElement.id, { opacity: parseInt(e.target.value) / 100 })} className={styles.sizeSliderTrack} />
                          </div>
                        </div>
                      )}

                      {propertiesTab === "transform" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                          {/* ── SIZE CONTROL ── */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.sectionHeaderRow}>
                              <span className={styles.editSectionLabel}>Size</span>
                              <span className={styles.propertyValueReadout}>{details?.widthInches ? `${details.widthInches}"` : '0"'}</span>
                            </div>
                            <div className={styles.sizeSliderRow}>
                              <button
                                type="button"
                                className={styles.sizeStepperBtn}
                                onClick={() => { if (details && details.widthInches > 0.5) handleWidthChange(Math.round((details.widthInches - 0.5) * 10) / 10); }}
                                title="Decrease Size"
                                aria-label="Decrease size"
                              >
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <div className={styles.sizeSliderContainer}>
                                <input
                                  type="range"
                                  className={styles.sizeSliderTrack}
                                  min={activeSide === "left" || activeSide === "right" ? 0.5 : 1}
                                  max={activeSide === "left" || activeSide === "right" ? 4 : 12}
                                  step={0.1}
                                  value={details?.widthInches || 1}
                                  onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
                                  aria-label="Element size"
                                />
                              </div>
                              <button
                                type="button"
                                className={styles.sizeStepperBtn}
                                onClick={() => {
                                  if (!details) return;
                                  const max = (activeSide === "left" || activeSide === "right") ? 4 : 12;
                                  if (details.widthInches < max) handleWidthChange(Math.round((details.widthInches + 0.5) * 10) / 10);
                                }}
                                title="Increase Size"
                                aria-label="Increase size"
                              >
                                <Plus size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>

                          {/* ── ROTATION CONTROL ── */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.sectionHeaderRow}>
                              <span className={styles.editSectionLabel}>Rotation</span>
                              <span className={styles.propertyValueReadout}>{activeElement.rotation || 0}°</span>
                            </div>
                            <div className={styles.segmentedControl}>
                              {ROTATION_PRESETS.map(deg => (
                                <button
                                  key={deg}
                                  type="button"
                                  className={`${styles.segmentedBtn} ${(activeElement.rotation || 0) === deg ? styles.segmentedBtnActive : ""}`}
                                  onClick={() => onUpdateElement?.(activeElement.id, { rotation: deg })}
                                  aria-label={`Rotate ${deg} degrees`}
                                >
                                  {deg}°
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ── POSITION PRESETS ── */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.sectionHeaderRow}>
                              <span className={styles.editSectionLabel}>Position Presets</span>
                            </div>
                            <div className={styles.presetGrid2x2}>
                              {activeSide === "front" ? (
                                <>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 3.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(3.5, "left-chest")}
                                  >
                                    <span className={styles.presetItemTitle}>Left Chest</span>
                                    <span className={styles.presetItemSize}>3.5″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 8.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(8.5, "center")}
                                  >
                                    <span className={styles.presetItemTitle}>Center</span>
                                    <span className={styles.presetItemSize}>8.5″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 11.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(11.5, "oversized")}
                                  >
                                    <span className={styles.presetItemTitle}>Oversized</span>
                                    <span className={styles.presetItemSize}>11.5″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 3.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(3.5, "locker-patch")}
                                  >
                                    <span className={styles.presetItemTitle}>Back Neck</span>
                                    <span className={styles.presetItemSize}>3.5″</span>
                                  </button>
                                </>
                              ) : (activeSide === "left" || activeSide === "right") ? (
                                <>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 1.0) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(1.0, "sleeve-center")}
                                  >
                                    <span className={styles.presetItemTitle}>Mini</span>
                                    <span className={styles.presetItemSize}>1″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 1.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(1.5, "sleeve-center")}
                                  >
                                    <span className={styles.presetItemTitle}>Small</span>
                                    <span className={styles.presetItemSize}>1.5″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 2.0) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(2.0, "sleeve-center")}
                                  >
                                    <span className={styles.presetItemTitle}>Medium</span>
                                    <span className={styles.presetItemSize}>2″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 2.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(2.5, "sleeve-center")}
                                  >
                                    <span className={styles.presetItemTitle}>Large</span>
                                    <span className={styles.presetItemSize}>2.5″</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 3.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(3.5, "locker-patch")}
                                  >
                                    <span className={styles.presetItemTitle}>Top Patch</span>
                                    <span className={styles.presetItemSize}>3.5″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 8.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(8.5, "center")}
                                  >
                                    <span className={styles.presetItemTitle}>Center</span>
                                    <span className={styles.presetItemSize}>8.5″</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.presetItemBtn} ${details && Math.abs(details.widthInches - 11.5) < 0.15 ? styles.presetItemBtnActive : ""}`}
                                    onClick={() => applyPresetSizeAndPosition(11.5, "oversized")}
                                    style={{ gridColumn: 'span 2' }}
                                  >
                                    <span className={styles.presetItemTitle}>Full Back</span>
                                    <span className={styles.presetItemSize}>11.5″</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* ── ALIGN & FLIP ── */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.sectionHeaderRow}>
                              <span className={styles.editSectionLabel}>Align & Flip</span>
                            </div>
                            <div className={styles.alignFlipGrid}>
                              <button
                                type="button"
                                className={styles.editorToolBtn}
                                onClick={() => { if (!activeElement) return; onUpdateElement?.(activeElement.id, { x: Math.round(printableLeftPx + (printableWidthPx / 2) - (activeElement.width / 2)) }); }}
                                title="Center Horizontally"
                              >
                                <AlignCenterHorizontal size={16} strokeWidth={2} />
                                <span>Center H</span>
                              </button>
                              <button
                                type="button"
                                className={styles.editorToolBtn}
                                onClick={() => { if (!activeElement) return; onUpdateElement?.(activeElement.id, { y: Math.round(printableTopPx + (printableHeightPx / 2) - (activeElement.height / 2)) }); }}
                                title="Center Vertically"
                              >
                                <AlignCenterVertical size={16} strokeWidth={2} />
                                <span>Center V</span>
                              </button>
                              <button
                                type="button"
                                className={`${styles.editorToolBtn} ${activeElement.flipX ? styles.editorToolBtnActive : ""}`}
                                onClick={() => onUpdateElement?.(activeElement.id, { flipX: !activeElement.flipX })}
                                title="Flip Horizontally"
                              >
                                <FlipHorizontal2 size={16} strokeWidth={2} />
                                <span>Flip H</span>
                              </button>
                              <button
                                type="button"
                                className={`${styles.editorToolBtn} ${activeElement.flipY ? styles.editorToolBtnActive : ""}`}
                                onClick={() => onUpdateElement?.(activeElement.id, { flipY: !activeElement.flipY })}
                                title="Flip Vertically"
                              >
                                <FlipVertical2 size={16} strokeWidth={2} />
                                <span>Flip V</span>
                              </button>
                            </div>
                          </div>

                          {/* ── ACTIONS (DUPLICATE & DELETE) ── */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.sectionHeaderRow}>
                              <span className={styles.editSectionLabel}>Actions</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <button
                                type="button"
                                className={styles.actionBtnSecondary}
                                onClick={(e) => onCopyElement?.(activeElement.id, e)}
                              >
                                <Copy size={15} strokeWidth={2} />
                                <span>Duplicate</span>
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtnDanger}
                                onClick={() => onRemoveElement?.(activeElement.id)}
                              >
                                <Trash2 size={15} strokeWidth={2} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>

                          {/* ── OPACITY FOR LOGO ── */}
                          {activeElement.type === "logo" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div className={styles.sectionHeaderRow}>
                                <span className={styles.editSectionLabel}>Opacity</span>
                                <span className={styles.propertyValueReadout}>{Math.round((activeElement.opacity ?? 1) * 100)}%</span>
                              </div>
                              <div className={styles.sizeSliderRow}>
                                <div className={styles.sizeSliderContainer}>
                                  <input
                                    type="range"
                                    min={10}
                                    max={100}
                                    step={5}
                                    value={Math.round((activeElement.opacity ?? 1) * 100)}
                                    onChange={(e) => onUpdateElement?.(activeElement.id, { opacity: parseInt(e.target.value) / 100 })}
                                    className={styles.sizeSliderTrack}
                                    aria-label="Element opacity"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {propertiesTab === "print" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span className={styles.editSectionLabel}>Print Method</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(["dtf", "screen", "embroidery"] as const).map(pt => (
                                <button key={pt} className={`${styles.printCardEnhanced} ${currentPrintType === pt ? styles.printCardEnhancedActive : ""}`}
                                  onClick={() => onUpdateElement?.(activeElement.id, { printType: pt })}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                    <div>
                                      <div className={styles.printCardName}>{pt === "dtf" ? "DTF (Direct to Film)" : pt === "screen" ? "Screen Printing" : "Embroidery"}</div>
                                      <div className={styles.printCardDesc}>{pt === "dtf" ? "Multi-color & photos" : pt === "screen" ? "Bold text & bulk" : "Premium 3D thread"}</div>
                                    </div>
                                    <span className={styles.printCardBadge} style={{ background: pt === "dtf" ? '#EFF6FF' : pt === "screen" ? '#F5F3FF' : '#FEF3C7', color: pt === "dtf" ? '#1D4ED8' : pt === "screen" ? '#6D28D9' : '#B45309' }}>
                                      {pt === "dtf" ? "Vibrant" : pt === "screen" ? "Classic" : "Textured"}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span className={styles.editSectionLabel}>{currentPrintType === "embroidery" ? "Embroidery Colors" : "Design Colors"}</span>
                            <div className={styles.colorTypePills}>
                              <button className={`${styles.colorTypePill} ${details?.embroideryType === "mono" ? styles.colorTypePillActive : ""}`}
                                onClick={() => onUpdateElement?.(activeElement.id, { embroideryType: "mono" })}>Mono Color</button>
                              <button className={`${styles.colorTypePill} ${details?.embroideryType === "multi" ? styles.colorTypePillActive : ""}`}
                                onClick={() => onUpdateElement?.(activeElement.id, { embroideryType: "multi" })}>{currentPrintType === "embroidery" ? "Multi Color" : "Colorful"}</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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
