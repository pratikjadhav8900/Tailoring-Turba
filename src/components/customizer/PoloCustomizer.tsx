"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Rnd } from "react-rnd";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Trash2, Type, MoveVertical, ScanText } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, CustomizerState, Side } from "@/types/customizer";

import { GARMENTS, FABRICS, FABRIC_CATEGORIES, TAG_COLORS, COLOR_PRESETS, FabricCategory, Fabric } from "@/lib/fabric-data";

// Types
type GarmentKey = keyof typeof GARMENTS;

interface Props {
  onChange?: (state: CustomizerState) => void;
  initialState?: CustomizerState | null;
}

// Component
export default function PoloCustomizer({ onChange, initialState }: Props) {
  const [garmentType, setGarmentType] = useState<GarmentKey>((initialState?.garmentType as GarmentKey) || "round-neck");
  const [activeSide, setActiveSide]   = useState<Side>("front");
  const [isFlipping, setIsFlipping]   = useState(false);
  const initialFabric = initialState?.fabricId ? FABRICS.find(f => f.id === initialState.fabricId) : null;
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(initialFabric || null);
  const [bodyColor, setBodyColor]     = useState(initialState?.bodyColor || "#FFFFFF");

  // Update fabric when initialState changes
  useEffect(() => {
    if (initialState?.fabricId) {
      const fabric = FABRICS.find(f => f.id === initialState.fabricId);
      if (fabric) {
        setSelectedFabric(fabric);
      }
    }
  }, [initialState?.fabricId]);

  // Separate element lists per side
  const [frontElements, setFrontElements] = useState<DesignElement[]>(initialState?.frontElements || [
    { 
      id: "f1", type: "text", x: 120, y: 170, width: 170, height: 55, 
      value: "YOUR TEAM", color: "#000000", fontFamily: "Inter",
      fontWeight: "bold", textAlign: "center", uppercase: true 
    },
  ]);
  const [backElements, setBackElements] = useState<DesignElement[]>(initialState?.backElements || []);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // helpers
  const elements    = activeSide === "front" ? frontElements : backElements;
  const setElements = activeSide === "front" ? setFrontElements : setBackElements;

  useEffect(() => {
    if (onChange) {
      onChange({
        bodyColor,
        garmentType,
        frontElements,
        backElements,
      });
    }
  }, [frontElements, backElements, bodyColor, garmentType, onChange]);

  const flip = (side: Side) => {
    if (side === activeSide) return;
    setActiveElementId(null);
    setIsFlipping(true);
    setTimeout(() => {
      setActiveSide(side);
      setIsFlipping(false);
    }, 260);
  };

  const addText = () => {
    const id = Date.now().toString();
    setElements([...elements, {
      id, type: "text",
      x: 130, y: 200, width: 160, height: 52,
      value: "ADD TEXT", color: bodyColor === "#111111" ? "#FFFFFF" : "#000000",
      fontFamily: "Inter", fontWeight: "bold", textAlign: "center"
    }]);
    setActiveElementId(id);
  };

  const removeElement = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    // Clear active element immediately
    if (activeElementId === id) setActiveElementId(null);
    
    // Remove element without setTimeout to avoid DOM manipulation issues
    const removeId = () => {
      if (activeSide === "front") {
        setFrontElements((prev) => prev.filter((el) => el.id !== id));
      } else {
        setBackElements((prev) => prev.filter((el) => el.id !== id));
      }
    };
    
    // Use requestAnimationFrame for safer DOM manipulation
    requestAnimationFrame(removeId);
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements((prev) => {
      try {
        return prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      } catch (error) {
        console.error('Error updating element:', error);
        return prev; // Return previous state on error
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setElements([...elements, {
      id: Date.now().toString(), type: "logo",
      x: 120, y: 160, width: 140, height: 140,
      value: url, color: "",
    }]);
  };

  
  const currentImg = GARMENTS[garmentType][activeSide];

  // frontCount / backCount badges
  const frontCount = frontElements.length;
  const backCount  = backElements.length;

  const activeEl = elements.find((e) => e.id === activeElementId) as DesignElement | undefined;

  // render
  return (
    <div className={styles.wrapper}>

      {/* LEFT - Preview Canvas */}
      <div className={styles.leftCol}>
        {/* Front / Back switcher */}
        <div className={styles.sideToggle}>
          <button
            className={`${styles.sideBtn} ${activeSide === "front" ? styles.sideBtnActive : ""}`}
            onClick={() => flip("front")}
          >
            <span className={styles.sideBtnIcon}>T</span>
            Front
            {frontCount > 0 && <span className={styles.sideDot}>{frontCount}</span>}
          </button>
          <button
            className={`${styles.sideBtn} ${activeSide === "back" ? styles.sideBtnActive : ""}`}
            onClick={() => flip("back")}
          >
            <span className={styles.sideBtnIcon}>T</span>
            Back
            {backCount > 0 && <span className={styles.sideDot}>{backCount}</span>}
          </button>
        </div>

        {/* Canvas */}
        <div 
          className={`${styles.preview} ${isFlipping ? styles.previewFlip : ""}`}
          onClick={() => setActiveElementId(null)}
        >
          <div className={styles.garmentContainer}>
            <Image
              key={`${garmentType}-${activeSide}`}
              src={currentImg}
              alt={`${GARMENTS[garmentType].label} ${activeSide}`}
              fill
              className={styles.garmentImage}
              priority
            />
            {/* Side label watermark */}
            <div className={styles.sideWatermark}>
              {activeSide === "front" ? "FRONT" : "BACK"}
            </div>
          </div>

          {/* Canva-Style Floating Toolbar */}
          {activeEl && activeEl.type === "text" && (
            <div 
              className={styles.formattingToolbarFloating}
              style={{
                top: Math.max(10, activeEl.y - 75),
                left: activeEl.x + (activeEl.width / 2),
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Font Family */}
              <select 
                className={styles.toolSelect}
                value={activeEl.fontFamily || "Inter"}
                onChange={(e) => updateElement(activeEl.id, { fontFamily: e.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Oswald">Oswald</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair</option>
                <option value="Bebas Neue">Bebas Neue</option>
                <option value="Caveat">Caveat</option>
                <option value="Pacifico">Pacifico</option>
                <option value="Righteous">Righteous</option>
                <option value="Anton">Anton</option>
                <option value="Lora">Lora</option>
              </select>

              {/* Formatting Toggles */}
              <div className={styles.toolGroup}>
                <button 
                  className={`${styles.toolBtn} ${activeEl.fontWeight === "bold" ? styles.toolBtnActive : ""}`}
                  onClick={() => updateElement(activeEl.id, { fontWeight: activeEl.fontWeight === "bold" ? "normal" : "bold" })}
                  title="Bold"
                ><Bold size={16} /></button>
                <button 
                  className={`${styles.toolBtn} ${activeEl.fontStyle === "italic" ? styles.toolBtnActive : ""}`}
                  onClick={() => updateElement(activeEl.id, { fontStyle: activeEl.fontStyle === "italic" ? "normal" : "italic" })}
                  title="Italic"
                ><Italic size={16} /></button>
                <button 
                  className={`${styles.toolBtn} ${activeEl.textDecoration === "underline" ? styles.toolBtnActive : ""}`}
                  onClick={() => updateElement(activeEl.id, { textDecoration: activeEl.textDecoration === "underline" ? "none" : "underline" })}
                  title="Underline"
                ><Underline size={16} /></button>
                <button 
                  className={`${styles.toolBtn} ${activeEl.uppercase ? styles.toolBtnActive : ""}`}
                  onClick={() => updateElement(activeEl.id, { uppercase: !activeEl.uppercase })}
                  title="Uppercase"
                ><Type size={16} /></button>
              </div>

              {/* Alignment */}
              <div className={styles.toolGroup}>
                <button 
                  className={`${styles.toolBtn} ${activeEl.textAlign === "left" ? styles.toolBtnActive : ""}`}
                  onClick={() => updateElement(activeEl.id, { textAlign: "left" })}
                ><AlignLeft size={16} /></button>
                <button 
                  className={`${styles.toolBtn} ${activeEl.textAlign === "center" ? styles.toolBtnActive : ""}`}
                  onClick={() => updateElement(activeEl.id, { textAlign: "center" })}
                ><AlignCenter size={16} /></button>
                <button 
                  className={`${styles.toolBtn} ${activeEl.textAlign === "right" ? styles.toolBtnActive : ""}`}
                  onClick={() => updateElement(activeEl.id, { textAlign: "right" })}
                ><AlignRight size={16} /></button>
              </div>

              {/* Spacing & Utilities */}
              <div className={styles.toolGroup}>
                <button 
                  className={styles.toolBtn}
                  onClick={() => updateElement(activeEl.id, { letterSpacing: (activeEl.letterSpacing || 0) + 1 })}
                  title="Increase Letter Spacing"
                ><ScanText size={16} /></button>
                <input
                  type="color"
                  className={styles.toolColor}
                  value={activeEl.color || "#000000"}
                  onChange={(e) => updateElement(activeEl.id, { color: e.target.value })}
                  title="Text Color"
                />
              </div>
              
              <button 
                className={`${styles.toolBtn} ${styles.toolBtnDanger}`}
                onClick={(e) => removeElement(activeEl.id, e)}
                title="Delete Element"
              ><Trash2 size={16} /></button>
            </div>
          )}

          {/* Draggable elements */}
          {elements.map((el) => {
            const isActive = el.id === activeElementId;
            return (
            <Rnd
              key={el.id}
              className={`${styles.rndBox} ${isActive ? styles.rndBoxActive : ""}`}
              bounds="parent"
              position={{ x: el.x, y: el.y }}
              size={{ width: el.width, height: el.height }}
              onDragStop={(_, d) => {
                try {
                  updateElement(el.id, { x: d.x, y: d.y });
                } catch (error) {
                  console.error('Error updating element position:', error);
                }
              }}
              onResizeStop={(_, __, ref, ___, pos) => {
                try {
                  updateElement(el.id, {
                    width: parseInt(ref.style.width) || el.width,
                    height: parseInt(ref.style.height) || el.height,
                    ...pos,
                  });
                } catch (error) {
                  console.error('Error updating element size:', error);
                }
              }}
              disableDragging={!isActive}
            >
              <div className={styles.rndContent} onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveElementId(el.id);
                }} onDoubleClick={(e) => {
                  // Double-click to focus and edit text
                  const textarea = e.currentTarget.querySelector('textarea');
                  if (textarea) {
                    e.stopPropagation();
                    textarea.focus();
                    textarea.select();
                  }
                }}>
                {el.type === "text" ? (
                  <textarea
                    className={styles.rndText}
                    value={el.value}
                    spellCheck={false}
                    onChange={(e) => updateElement(el.id, { value: e.target.value })}
                    onFocus={(e) => {
                      // When editing, disable dragging temporarily
                      e.target.style.pointerEvents = 'auto';
                    }}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) {
                        // Use a timeout to avoid DOM manipulation conflicts
                        setTimeout(() => removeElement(el.id), 10);
                      }
                      // Re-enable pointer events for dragging
                      e.target.style.pointerEvents = 'none';
                    }}
                    onMouseDown={(e) => {
                      // Prevent text selection during drag, but allow when focused
                      if (e.target !== document.activeElement) {
                        e.preventDefault();
                      }
                    }}
                    style={{
                      color: el.color,
                      fontSize: `${Math.min(el.width / (Math.max(1, ...el.value.split('\n').map(l => l.length)) * 0.6 + 1), (el.height / Math.max(1, el.value.split('\n').length)) * 0.8)}px`,
                      fontFamily: el.fontFamily || "Inter",
                      fontWeight: el.fontWeight || "bold",
                      fontStyle: el.fontStyle || "normal",
                      textDecoration: el.textDecoration || "none",
                      textAlign: el.textAlign || "center",
                      textTransform: el.uppercase ? "uppercase" : "none",
                      letterSpacing: `${el.letterSpacing || 0}px`,
                      opacity: el.opacity ?? 1,
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={el.value} 
                    alt="logo" 
                    draggable={false}
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "contain",
                      pointerEvents: "none",
                      userSelect: "none",
                      WebkitUserSelect: "none"
                    }} 
                  />
                )}
              </div>
            </Rnd>
            );
          })}

          {/* Fabric badge */}
          {selectedFabric && (
            <div className={styles.fabricBadge}>
              {selectedFabric.brand} · {selectedFabric.gsm} GSM · {selectedFabric.priceRange}
            </div>
          )}
        </div>

        {/* Hint under canvas */}
        <p className={styles.canvasHint}>
          Select an element to edit · Drag to move · Drag corners to resize
        </p>
      </div>

      {/* RIGHT - Controls Panel */}
      <div className={styles.controls}>

        {/* Step 1: Garment */}
        <div className={styles.block}>
          <div className={styles.blockTitle}>1. Select Garment</div>
          <div className={styles.tabs}>
            {(Object.keys(GARMENTS) as GarmentKey[]).map((key) => (
              <button
                key={key}
                className={`${styles.tab} ${garmentType === key ? styles.tabActive : ""}`}
                onClick={() => setGarmentType(key)}
              >
                {GARMENTS[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Selected Fabric Details */}
        <div className={styles.block}>
          <div className={styles.blockTitle}>2. Selected Fabric Details</div>
          
          {selectedFabric && (
            <div className={styles.selectedStrip}>
              <div className={styles.selectedStripLeft}>
                <span className={styles.selectedCheck}> </span>
                <div>
                  <div className={styles.selectedName}>{selectedFabric.brand}</div>
                  <div className={styles.selectedDetail}>
                    {selectedFabric.fabric} · {selectedFabric.gsm} GSM · {selectedFabric.sizes}
                  </div>
                </div>
              </div>
              <div className={styles.selectedPrice}>{selectedFabric.priceRange}</div>
            </div>
          )}
        </div>

        {/* Step 3: Color */}
        <div className={styles.block}>
          <div className={styles.blockTitle}>3. Choose Fabric Color</div>
          <div className={styles.colorGrid}>
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.hex}
                className={`${styles.colorSwatch} ${bodyColor === p.hex ? styles.colorSwatchActive : ""}`}
                onClick={() => setBodyColor(p.hex)}
                title={p.name}
              >
                <span
                  className={styles.swatchDot}
                  style={{
                    background: p.hex,
                    border: p.hex === "#FFFFFF" ? "1px solid #D1D5DB" : "none",
                  }}
                />
                <span className={styles.swatchName}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Design */}
        <div className={styles.block}>
          <div className={styles.blockTitle}>
            4. Customize Design
            <span className={styles.sidePill}>
              Editing: <strong>{activeSide === "front" ? "Front" : "Back"}</strong>
            </span>
          </div>
          <p className={styles.hint}>
            Use the <strong>Front / Back</strong> toggle above the preview to switch sides and add different designs to each.
          </p>

          <div className={styles.designActions}>
            {/* Quick-switch side btns inside panel */}
            <div className={styles.miniSideToggle}>
              <button
                className={`${styles.miniSideBtn} ${activeSide === "front" ? styles.miniSideBtnActive : ""}`}
                onClick={() => flip("front")}
              >
                Front {frontCount > 0 && `(${frontCount})`}
              </button>
              <button
                className={`${styles.miniSideBtn} ${activeSide === "back" ? styles.miniSideBtnActive : ""}`}
                onClick={() => flip("back")}
              >
                Back {backCount > 0 && `(${backCount})`}
              </button>
            </div>

            <div className={styles.addBtns}>
              <button className={styles.addAssetBtn} onClick={addText}>
                + Add Text
              </button>
              <button className={styles.addAssetBtn} onClick={() => fileInputRef.current?.click()}>
                + Upload Logo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                style={{ display: "none" }}
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
