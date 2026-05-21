"use client";
import React, { useState, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { Move, RotateCw, Trash2, Minus, Plus, Settings, Copy } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, Side } from "@/types/customizer";
import { GARMENTS } from "@/lib/fabric-data";
import { SIZE_SCALES } from "@/lib/customizer-utils";

interface CanvasAreaProps {
  garmentType: string;
  activeSide: Side;
  bodyColor: string;
  elements: DesignElement[];
  activeElementId: string | null;
  isPreviewMode: boolean;
  isDragging: boolean;
  mockupId: string;
  zoom: number;
  onZoomChange: (z: number) => void;
  onElementClick: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>, skipHistory?: boolean) => void;
  onRemoveElement: (id: string, e?: React.SyntheticEvent) => void;
  onCopyElement?: (id: string, e?: React.SyntheticEvent) => void;
  onDragStart: () => void;
  onDragStop: () => void;
  previewSize?: "S" | "M" | "L" | "XL" | "XXL";
  children?: React.ReactNode;
}

export default function CanvasArea({
  garmentType, activeSide, bodyColor, elements, activeElementId,
  isPreviewMode, isDragging, mockupId, zoom, onZoomChange,
  onElementClick, onUpdateElement, onRemoveElement, onCopyElement, onDragStart, onDragStop,
  previewSize = "M",
  children,
}: CanvasAreaProps) {
  const currentGarment = GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"];
  const currentImg = (currentGarment as any)[activeSide] || currentGarment["front"];
  const baseKey = `base${activeSide.charAt(0).toUpperCase() + activeSide.slice(1)}`;
  const currentBaseImg = (currentGarment as any)[baseKey];

  // Inline text editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Double-tap detection for mobile text editing
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const [deviceScale, setDeviceScale] = useState(1);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      
      // Compute scale with dynamic height fallbacks for grid mounts
      const targetW = w > 0 ? w : (isPreviewMode ? 200 : 560);
      const targetH = h > 0 ? h : (isPreviewMode ? 200 : 560);
      
      const fitWidthScale = (targetW * 0.85) / 560;
      const fitHeightScale = (targetH * 0.85) / 560;
      const computedScale = Math.min(1, fitWidthScale, fitHeightScale);
      
      console.log(`[CanvasArea] Resize: w=${w}, h=${h}, isPreviewMode=${isPreviewMode}, targetW=${targetW}, targetH=${targetH}, computedScale=${computedScale}`);
      setDeviceScale(computedScale);
    };
    
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [isPreviewMode]);

  // Advanced gestures (Two-finger pan and pinch zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isGestureActive, setIsGestureActive] = useState(false);

  const zoomRef = useRef(zoom);
  const onZoomChangeRef = useRef(onZoomChange);
  const panRef = useRef(pan);
  
  React.useEffect(() => {
    zoomRef.current = zoom;
    onZoomChangeRef.current = onZoomChange;
    panRef.current = pan;
  }, [zoom, onZoomChange, pan]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // In preview mode (Review tab, Order Summary), disable all zoom/pan gestures
    if (isPreviewMode) return;

    let touchStartDist = 0;
    let touchStartZoom = 1;
    let touchStartMid = { x: 0, y: 0 };
    let touchStartPan = { x: 0, y: 0 };

    const getMidpoint = (touches: TouchList) => {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      };
    };

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY;
        const newZoom = zoomRef.current - delta * 0.005;
        onZoomChangeRef.current(Math.max(0.3, Math.min(3.0, newZoom)));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsGestureActive(true);
        touchStartDist = getDistance(e.touches);
        touchStartZoom = zoomRef.current;
        touchStartMid = getMidpoint(e.touches);
        touchStartPan = { ...panRef.current };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        if (touchStartDist > 0) {
          const dist = getDistance(e.touches);
          const scaleChange = dist / touchStartDist;
          const newZoom = touchStartZoom * scaleChange;
          onZoomChangeRef.current(Math.max(0.3, Math.min(3.0, newZoom)));
        }
        const mid = getMidpoint(e.touches);
        const dx = mid.x - touchStartMid.x;
        const dy = mid.y - touchStartMid.y;
        setPan({
          x: touchStartPan.x + dx,
          y: touchStartPan.y + dy
        });
      }
    };

    const handleTouchEnd = () => {
      setIsGestureActive(false);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isPreviewMode]);

  const handleElementClick = useCallback(
    (el: DesignElement, e: React.MouseEvent) => {
      e.stopPropagation();
      onElementClick(el.id);

      // If already selected and it's a text element, enter inline edit mode
      if (el.id === activeElementId && el.type === "text" && !isPreviewMode && !editingId) {
        setEditDraft(el.value);
        setEditingId(el.id);
        setTimeout(() => editRef.current?.focus(), 30);
      }
    },
    [activeElementId, editingId, isPreviewMode, onElementClick]
  );

  // Double-tap handler for mobile touch devices
  const handleElementTouchEnd = useCallback(
    (el: DesignElement, e: React.TouchEvent) => {
      if (isPreviewMode || el.type !== "text") return;
      e.stopPropagation();

      const now = Date.now();
      const last = lastTapRef.current;

      if (last && last.id === el.id && now - last.time < 350) {
        // Double-tap detected — enter edit mode
        lastTapRef.current = null;
        onElementClick(el.id);
        setEditDraft(el.value);
        setEditingId(el.id);
        setTimeout(() => editRef.current?.focus(), 50);
      } else {
        lastTapRef.current = { id: el.id, time: now };
        onElementClick(el.id);
      }
    },
    [isPreviewMode, onElementClick]
  );

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    if (!editDraft.trim()) {
      onRemoveElement(editingId);
    } else {
      onUpdateElement(editingId, { value: editDraft });
    }
    setEditingId(null);
  }, [editingId, editDraft, onRemoveElement, onUpdateElement]);

  const handleCanvasClick = () => {
    if (editingId) { commitEdit(); return; }
    onElementClick(null);
  };

  const zoomPct = Math.round(zoom * 100);
  const scale = isPreviewMode ? 1.0 : zoom;
  const currentPan = isPreviewMode ? { x: 0, y: 0 } : pan;
  const totalScale = scale * deviceScale;

  return (
    <div className={styles.canvasWrapper}>
      <div ref={canvasRef} className={styles.canvasArea} onClick={handleCanvasClick}>
        {/* Zoomed garment container */}
        <div 
          style={{ 
            transform: `translate(${currentPan.x}px, ${currentPan.y}px) scale(${totalScale})`, 
            transformOrigin: "center center", 
            transition: isGestureActive ? "none" : "transform 0.2s" 
          }}
        >
          <div id={mockupId} className={styles.garmentContainer}>
            {/* Optional Base Image (e.g., Man wearing the shirt) */}
            {currentBaseImg && (
              <img
                src={currentBaseImg}
                alt="Base Mockup"
                className={styles.garmentBaseImage}
                style={{ zIndex: 0 }}
              />
            )}
            
            {/* Color & Texture Layers: Rendered for all states, using white as fallback if transparent */}
            {(() => {
              const isTransparent = bodyColor === "transparent";
              const effectiveColor = isTransparent ? "#ffffff" : bodyColor;
              
              // Determine if the color is very dark (e.g. black) to adjust opacity
              const hex = effectiveColor.replace("#", "");
              const r = parseInt(hex.substring(0,2), 16) || 0;
              const g = parseInt(hex.substring(2,4), 16) || 0;
              const b = parseInt(hex.substring(4,6), 16) || 0;
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              
              // For dark colors, use lower opacity so texture/shadows remain visible
              // For light colors (white etc.), use higher opacity
              const colorOpacity = luminance < 0.15 ? 0.72 : luminance < 0.35 ? 0.80 : 0.88;
              
              // For dark colors, boost the texture brightness so wrinkles show
              const textureFilter = luminance < 0.15 
                ? "brightness(2.2) contrast(1.3)" 
                : luminance < 0.35 
                  ? "brightness(1.5) contrast(1.15)"
                  : effectiveColor.toLowerCase() === "#ffffff" ? "none" : "brightness(1.1)";

              // Texture opacity: more visible on dark colors  
              const textureOpacity = luminance < 0.15 ? 0.70 : effectiveColor.toLowerCase() === "#ffffff" ? 1 : 0.82;

              return (
                <>
                  <div
                    className={styles.garmentColorLayer}
                    style={{
                      backgroundColor: effectiveColor,
                      opacity: colorOpacity,
                      maskImage: `url(${currentImg})`,
                      WebkitMaskImage: `url(${currentImg})`,
                      maskSize: "contain",
                      WebkitMaskSize: "contain",
                      maskRepeat: "no-repeat",
                      WebkitMaskRepeat: "no-repeat",
                      maskPosition: "center",
                      WebkitMaskPosition: "center",
                    }}
                  />
                  <img
                    key={`${garmentType}-${activeSide}`}
                    src={currentImg}
                    alt="Garment Texture"
                    className={styles.garmentBaseImage}
                    style={{ 
                      mixBlendMode: "multiply", 
                      opacity: textureOpacity,
                      filter: textureFilter,
                    }}
                  />
                </>
              );
            })()}

            {/* Printable + Safety/Bleed zones */}
            {(() => {
              const sidePrintable = (currentGarment.printableArea as any)?.[activeSide] || currentGarment.printableArea;
              const printableWidthPercent = parseFloat(sidePrintable?.width || "40%") / 100;
              const printableHeightPercent = parseFloat(sidePrintable?.height || "50%") / 100;
              const printableLeftPercent = parseFloat(sidePrintable?.left || "30%") / 100;
              const printableTopPercent = parseFloat(sidePrintable?.top || "19%") / 100;

              const printableLeftPx = 560 * printableLeftPercent;
              const printableTopPx = 560 * printableTopPercent;
              const printableWidthPx = 560 * printableWidthPercent;
              const printableHeightPx = 560 * printableHeightPercent;

              const widthPercent = parseFloat(sidePrintable?.width || "40%");
              const heightPercent = parseFloat(sidePrintable?.height || "50%");
              const ratio = heightPercent / widthPercent;
              const heightInches = 12 * ratio;
              const heightCm = Math.round(heightInches * 2.54 * 10) / 10;

              const sizeScale = 1.0;

              return (
                <>
                  {!isPreviewMode && (
                    <div
                      className={styles.printableAreaBox}
                      style={{
                        top: sidePrintable?.top || "18%",
                        left: sidePrintable?.left || "28%",
                        width: sidePrintable?.width || "44%",
                        height: sidePrintable?.height || "60%",
                      }}
                    >
                      {/* Pill badges — anchored to top-right of box */}
                      <div className={styles.areaPills}>
                        <span className={styles.areaPillSafety}>Safety Area</span>
                        <span className={styles.areaPillBleed}>Bleed</span>
                      </div>

                      {/* Left Ruler */}
                      <div className={styles.rulerLeft}>
                        <div className={styles.rulerLineVertical} />
                        <span className={styles.rulerTextVertical}>{heightCm}cm</span>
                        <div className={styles.rulerLineVertical} />
                      </div>

                      {/* Bottom Ruler */}
                      <div className={styles.rulerBottom}>
                        <div className={styles.rulerLineHorizontal} />
                        <span className={styles.rulerTextHorizontal}>30.48cm</span>
                        <div className={styles.rulerLineHorizontal} />
                      </div>
                    </div>
                  )}

                  {/* Design Elements */}
                  {elements.map((el) => {
                    const isActive = el.id === activeElementId && !isPreviewMode;
                    const isEditing = el.id === editingId;

                    const renderWidth = el.width * sizeScale;
                    const renderHeight = el.height * sizeScale;

                    const printCenterX = printableLeftPx + printableWidthPx / 2;
                    const printCenterY = printableTopPx + printableHeightPx / 2;

                    const elCenterX = el.x + el.width / 2;
                    const elCenterY = el.y + el.height / 2;

                    const renderCenterX = printCenterX + (elCenterX - printCenterX) * sizeScale;
                    const renderCenterY = printCenterY + (elCenterY - printCenterY) * sizeScale;

                    const renderX = renderCenterX - renderWidth / 2;
                    const renderY = renderCenterY - renderHeight / 2;

                    const dynamicFont = Math.min(
                      renderWidth / (Math.max(1, ...el.value.split("\n").map(l => l.length)) * 0.6 + 1),
                      (renderHeight / Math.max(1, el.value.split("\n").length)) * 0.8
                    );
                    const fontSize = el.fontSize ? Math.min(el.fontSize * sizeScale, dynamicFont) : dynamicFont;

                    return (
                      <Rnd
                        key={el.id}
                        className={`${styles.rndBox} ${isActive ? styles.rndBoxActive : ""}`}
                        bounds="parent"
                        dragHandleClassName="customizer-drag-handle"
                        position={{ x: renderX, y: renderY }}
                        size={{ width: renderWidth, height: renderHeight }}
                        scale={totalScale}
                        onDragStart={onDragStart}
                        onDragStop={(_, d) => {
                          onDragStop();
                          const bw = renderWidth / sizeScale;
                          const bh = renderHeight / sizeScale;
                          const rcx = d.x + renderWidth / 2;
                          const rcy = d.y + renderHeight / 2;
                          const bcx = printCenterX + (rcx - printCenterX) / sizeScale;
                          const bcy = printCenterY + (rcy - printCenterY) / sizeScale;
                          const bx = bcx - bw / 2;
                          const by = bcy - bh / 2;
                          onUpdateElement(el.id, { x: Math.round(bx), y: Math.round(by) });
                        }}
                        onResizeStop={(_, __, ref, ___, pos) => {
                          const bw = parseInt(ref.style.width) / sizeScale;
                          const bh = parseInt(ref.style.height) / sizeScale;
                          const rcx = pos.x + parseInt(ref.style.width) / 2;
                          const rcy = pos.y + parseInt(ref.style.height) / 2;
                          const bcx = printCenterX + (rcx - printCenterX) / sizeScale;
                          const bcy = printCenterY + (rcy - printCenterY) / sizeScale;
                          const bx = bcx - bw / 2;
                          const by = bcy - bh / 2;

                          const ratio = bw / el.width;
                          const updates: Partial<DesignElement> = {
                            width: Math.round(bw),
                            height: Math.round(bh),
                            x: Math.round(bx),
                            y: Math.round(by),
                          };
                          if (el.type === "text" && el.fontSize) {
                            updates.fontSize = Math.round(el.fontSize * ratio);
                          }

                          onUpdateElement(el.id, updates);
                        }}
                        disableDragging={!isActive || isPreviewMode || isEditing}
                        enableResizing={isActive && !isPreviewMode && !isEditing}
                      >
                  <div
                    className={styles.rndContent}
                    style={{ transform: `rotate(${el.rotation || 0}deg)`, width: "100%", height: "100%" }}
                    onClick={(e) => handleElementClick(el, e)}
                    onTouchEnd={(e) => handleElementTouchEnd(el, e)}
                  >
                    {el.type === "text" ? (
                      isEditing ? (
                        <textarea
                          ref={editRef}
                          className={styles.rndTextEditable}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") { setEditingId(null); }
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                          }}
                          style={{
                            color: el.color,
                            fontSize: `${fontSize}px`,
                            fontFamily: el.fontFamily || "Inter",
                            fontWeight: el.fontWeight || "normal",
                            fontStyle: el.fontStyle || "normal",
                            textAlign: el.textAlign || "center",
                            textDecoration: el.textDecoration || "none",
                            textTransform: el.uppercase ? "uppercase" : "none",
                          }}
                        />
                      ) : (
                        <div
                          className={`${styles.rndText} customizer-drag-handle`}
                          style={{
                            color: el.color,
                            fontSize: `${fontSize}px`,
                            fontFamily: el.fontFamily || "Inter",
                            fontWeight: el.fontWeight || "normal",
                            fontStyle: el.fontStyle || "normal",
                            textAlign: el.textAlign || "center",
                            textDecoration: el.textDecoration || "none",
                            textTransform: el.uppercase ? "uppercase" : "none",
                            cursor: isActive ? "text" : "pointer",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            whiteSpace: "pre-wrap",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
                            height: "100%",
                            width: "100%",
                            overflow: "hidden",
                            touchAction: "none",
                          }}
                        >
                          {el.value}
                        </div>
                      )
                    ) : (
                      <img
                        src={el.value}
                        alt="logo"
                        draggable={false}
                        className="customizer-drag-handle"
                        style={{ width: "100%", height: "100%", objectFit: "contain", touchAction: "none" }}
                      />
                    )}
                  </div>

                  {/* Floating action buttons */}
                  {isActive && !isDragging && !isEditing && (
                    <div className={styles.floatingActionBtns}>
                      <div
                        className={styles.circleActionBtn}
                        onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { rotation: ((el.rotation || 0) + 90) % 360 }); }}
                        title="Rotate"
                      >
                        <RotateCw size={13} />
                      </div>
                      <div
                        className={styles.circleActionBtn}
                        onClick={(e) => { e.stopPropagation(); onCopyElement?.(el.id, e); }}
                        title="Copy"
                      >
                        <Copy size={13} />
                      </div>
                      <div 
                        className={`${styles.circleActionBtn} customizer-drag-handle`} 
                        title="Move"
                        style={{ touchAction: 'none', cursor: 'grab' }}
                      >
                        <Move size={13} />
                      </div>
                      <div
                        className={`${styles.circleActionBtn} ${styles.circleActionBtnDanger}`}
                        onClick={(e) => onRemoveElement(el.id, e)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </div>
                    </div>
                  )}
                </Rnd>
              );
            })}
                </>
              );
            })()}

          </div>
        </div>
        {children}
      </div>

      {/* Zoom Controls */}
      {!isPreviewMode && (
        <div className={styles.zoomBar}>
          <button
            className={styles.zoomBtn}
            onClick={(e) => { e.stopPropagation(); onZoomChange(Math.max(0.3, zoom - 0.1)); }}
            title="Zoom out"
          >
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <span className={styles.zoomPct}>{zoomPct}%</span>
          <button
            className={styles.zoomBtn}
            onClick={(e) => { e.stopPropagation(); onZoomChange(Math.min(3.0, zoom + 0.1)); }}
            title="Zoom in"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
          <div className={styles.zoomDivider} />
          <button
            className={styles.zoomBtn}
            onClick={(e) => { e.stopPropagation(); onZoomChange(1.52); setPan({ x: 0, y: 0 }); }}
            title="Reset zoom"
          >
            <Settings size={15} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
