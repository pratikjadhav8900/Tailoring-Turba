"use client";
import React, { useState, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { Move, RotateCw, Trash2, Minus, Plus, Settings, Copy } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, Side } from "@/types/customizer";
import { GARMENTS } from "@/lib/fabric-data";
import { SIZE_SCALES } from "@/lib/customizer-utils";
import { ALL_PRESETS as TEXT_PRESETS } from "@/lib/presets";
import { motion, AnimatePresence } from "framer-motion";
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

  // Track dragging to prevent click triggers
  const hasDraggedRef = useRef(false);

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

    // Update cursor when zoom changes
    const canvas = canvasRef.current;
    if (canvas && !isPreviewMode) {
      if (zoom > 1.05) {
        canvas.style.cursor = "grab";
      } else {
        canvas.style.cursor = "";
      }
    }
  }, [zoom, onZoomChange, pan, isPreviewMode]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // In preview mode (Review tab, Order Summary), disable all zoom/pan gestures
    if (isPreviewMode) return;

    let touchStartDist = 0;
    let touchStartZoom = 1;
    let touchStartMid = { x: 0, y: 0 };
    let touchStartPan = { x: 0, y: 0 };
    let touchStartSingle = { x: 0, y: 0 };
    let isSingleFingerPan = false;

    // Mouse drag state
    let isMouseDown = false;
    let startMousePos = { x: 0, y: 0 };
    let startPan = { x: 0, y: 0 };

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
      } else {
        // Trackpad panning (two-finger scroll)
        if (zoomRef.current > 1.05) {
          e.preventDefault();
          setPan(p => ({
            x: p.x - e.deltaX,
            y: p.y - e.deltaY
          }));
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Prevent canvas panning and zoom gestures if the touch initiates on any design element, button, input, or control panel
      if (
        target.closest('.customizer-drag-handle') || 
        target.closest('[class*="rndBox"]') ||
        target.closest('[class*="topFormattingBar"]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea')
      ) {
        return;
      }

      hasDraggedRef.current = false;

      if (e.touches.length === 2) {
        e.preventDefault();
        setIsGestureActive(true);
        isSingleFingerPan = false;
        touchStartDist = getDistance(e.touches);
        touchStartZoom = zoomRef.current;
        touchStartMid = getMidpoint(e.touches);
        touchStartPan = { ...panRef.current };
      } else if (e.touches.length === 1) {
        // Prevent browser viewport scrolling only if zoomed in, so user can pan the shirt
        if (zoomRef.current > 1.05) {
          e.preventDefault();
        }
        setIsGestureActive(true);
        isSingleFingerPan = true;
        touchStartSingle = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchStartPan = { ...panRef.current };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isSingleFingerPan = false;
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
        hasDraggedRef.current = true;
      } else if (e.touches.length === 1 && isSingleFingerPan) {
        if (zoomRef.current > 1.05) {
          e.preventDefault();
        }
        const dx = e.touches[0].clientX - touchStartSingle.x;
        const dy = e.touches[0].clientY - touchStartSingle.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasDraggedRef.current = true;
        }
        setPan({
          x: touchStartPan.x + dx,
          y: touchStartPan.y + dy
        });
      }
    };

    const handleTouchEnd = () => {
      setIsGestureActive(false);
      isSingleFingerPan = false;
    };

    // Mouse drag handlers
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only pan on left click
      const target = e.target as HTMLElement;
      // Prevent panning if clicking on a design element, handle, formatted bar or control button
      if (
        target.closest('.customizer-drag-handle') || 
        target.closest('[class*="rndBox"]') || 
        target.closest('[class*="topFormattingBar"]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea')
      ) {
        return;
      }

      isMouseDown = true;
      hasDraggedRef.current = false;
      startMousePos = { x: e.clientX, y: e.clientY };
      startPan = { ...panRef.current };
      canvas.style.cursor = 'grabbing';

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - startMousePos.x;
      const dy = e.clientY - startMousePos.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: startPan.x + dx,
        y: startPan.y + dy
      });
    };

    const handleMouseUp = () => {
      if (isMouseDown) {
        isMouseDown = false;
        canvas.style.cursor = zoomRef.current > 1.05 ? 'grab' : '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    canvas.addEventListener("mousedown", handleMouseDown);

    // Initial cursor check
    if (zoomRef.current > 1.05) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = '';
    }

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (editingId) { commitEdit(); return; }
    onElementClick(null);
  };

  const zoomPct = Math.round(zoom * 100);
  const scale = isPreviewMode ? 1.0 : zoom;
  const currentPan = isPreviewMode ? { x: 0, y: 0 } : pan;
  const totalScale = scale * deviceScale;

  const motionProps = isPreviewMode ? {} : {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: "linear" as any }
  };

  return (
    <div 
      className={styles.canvasWrapper}
      style={isPreviewMode ? { minHeight: 'auto', background: 'transparent', pointerEvents: 'none', touchAction: 'auto' } : undefined}
    >
      <div
        ref={canvasRef}
        className={`${styles.canvasArea}${isPreviewMode ? ` ${styles.canvasAreaPreview}` : ''}`}
        onClick={handleCanvasClick}
        style={isPreviewMode ? { touchAction: 'auto' } : undefined}
      >
        {/* Zoomed garment container */}
        <div 
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '560px',
            height: '560px',
            transform: `translate(calc(-50% + ${currentPan.x}px), calc(-50% + ${currentPan.y}px)) scale(${totalScale})`, 
            transformOrigin: "center center", 
            transition: isGestureActive ? "none" : "transform 0.2s" 
          }}
        >
          <div id={mockupId} className={styles.garmentContainer}>
            <AnimatePresence>
              <motion.div
                key={`${garmentType}-${activeSide}`}
                {...motionProps}
                style={{ 
                  position: "absolute",
                  width: "100%",
                  height: "100%"
                }}
              >
            {/* Base photo: either the model image (baseFront) or the shirt cutout itself (front).
                We render this untouched, preserving 100% of the original photographed fabric lighting, shadows, wrinkles, and gradients. */}
            <img
              src={currentBaseImg || currentImg}
              alt="Base Garment"
              className={styles.garmentBaseImage}
              style={{ zIndex: 0 }}
              crossOrigin="anonymous"
            />
            
            {/* Color Dye Tint overlays: Rendered with blend modes directly on top of the base image */}
            {(() => {
              const isTransparent = bodyColor === "transparent";
              const effectiveColor = isTransparent ? "#ffffff" : bodyColor;
              
              // Calculate luminance to scale overlay values naturally
              const hex = effectiveColor.replace("#", "");
              const r = parseInt(hex.substring(0, 2), 16) || 0;
              const g = parseInt(hex.substring(2, 4), 16) || 0;
              const b = parseInt(hex.substring(4, 6), 16) || 0;
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              
              // Dynamic opacities to prevent flattening the fabric wrinkles and to keep dye subtle:
              // - Multiply applies color and subtractive shade depth based on target darkness.
              // - Color applies the hue/saturation tint without touching underlying luminance.
              const multiplyOpacity = isTransparent ? 0 : Math.max(0, 0.75 * (1 - luminance));
              const colorOpacity = isTransparent ? 0 : 0.70;

              // Mask properties to align overlay perfectly over the shirt shape
              const maskStyle: React.CSSProperties = {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                maskImage: `url(${currentImg})`,
                WebkitMaskImage: `url(${currentImg})`,
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                pointerEvents: "none",
              };

              return (
                <>
                  {/* Layer 1: Multiply blend mode to dye the fabric fibers, adjusting for target color darkness */}
                  {!isTransparent && (
                    <div
                      className={styles.garmentColorLayer}
                      data-html2canvas-ignore="true"
                      style={{
                        ...maskStyle,
                        backgroundColor: effectiveColor,
                        mixBlendMode: "multiply",
                        opacity: multiplyOpacity,
                        zIndex: 1,
                      }}
                    />
                  )}
                  {/* Layer 2: Color blend mode to overlay exact hue and saturation tint without flattening texture details */}
                  {!isTransparent && (
                    <div
                      className={styles.garmentColorLayer}
                      data-html2canvas-ignore="true"
                      style={{
                        ...maskStyle,
                        backgroundColor: effectiveColor,
                        mixBlendMode: "color",
                        opacity: colorOpacity,
                        zIndex: 2,
                      }}
                    />
                  )}
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
              const isSleeve = activeSide === "left" || activeSide === "right";
              const physicalWidthInches = isSleeve ? 4 : 12;
              const heightInches = physicalWidthInches * ratio;
              const heightCm = Math.round(heightInches * 2.54 * 10) / 10;
              const widthCm = Math.round(physicalWidthInches * 2.54 * 100) / 100;

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
                        ['--zoom-scale' as any]: String(zoom)
                      }}
                    >
                      {/* Pill badges — anchored to top-right of box */}
                      <div className={`${styles.areaPills} ${(activeSide === "left" || activeSide === "right") ? styles.areaPillsSmall : ""}`}>
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
                        <span className={styles.rulerTextHorizontal}>{widthCm}cm</span>
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

                    const dynamicFont = el.type === "text" ? Math.min(
                      renderWidth / (Math.max(1, ...(el.value || "").split("\n").map(l => l.length)) * 0.6 + 1),
                      (renderHeight / Math.max(1, (el.value || "").split("\n").length)) * 0.8
                    ) : 0;
                    const fontSize = el.fontSize ? Math.min(el.fontSize * sizeScale, dynamicFont) : dynamicFont;

                    return isPreviewMode ? (
                      <div
                        key={el.id}
                        className={styles.rndBox}
                        style={{
                          position: "absolute",
                          left: `${renderX}px`,
                          top: `${renderY}px`,
                          width: `${renderWidth}px`,
                          height: `${renderHeight}px`,
                          zIndex: 5,
                        }}
                      >
                        <div
                          className={styles.rndContent}
                          style={{ transform: `rotate(${el.rotation || 0}deg)`, width: "100%", height: "100%" }}
                        >
                          {el.type === "preset" ? (() => {
                            const presetDef = TEXT_PRESETS.find(p => p.id === el.presetId);
                            if (!presetDef) return null;
                            const presetScale = el.width / (el.originalWidth || presetDef.width);
                            return (
                              <div className="customizer-drag-handle" style={{ position: "relative", width: presetDef.width, height: presetDef.height, transform: `scale(${presetScale})`, transformOrigin: "top left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {presetDef.elements.map((subEl, i) => {
                                  let displayVal = subEl.value;
                                  if (el.presetText !== undefined) {
                                    if (Array.isArray(el.presetText)) {
                                      displayVal = el.presetText[i] !== undefined ? el.presetText[i] : (subEl.value || "");
                                    } else {
                                      // Fallback for old string format
                                      const inputLines = el.presetText.split("\n");
                                      if (presetDef.elements.length === 1) {
                                        displayVal = el.presetText;
                                      } else {
                                        displayVal = inputLines[i] || "";
                                      }
                                    }
                                  }
                                  
                                  // Auto-verticalize if the original preset was perfectly vertical
                                  const origVal = subEl.value || "";
                                  const origLetters = origVal.replace(/\n/g, '');
                                  const isVertical = origVal.includes('\n') && origVal.length === origLetters.length * 2 - 1;
                                  
                                  if (isVertical && displayVal && !displayVal.includes('\n')) {
                                    displayVal = displayVal.split('').join('\n');
                                  }
                                  
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        position: subEl.y !== undefined ? "absolute" : "relative",
                                        top: subEl.y !== undefined ? 0 : "auto",
                                        left: subEl.y !== undefined ? 0 : "auto",
                                        transform: subEl.y !== undefined ? `translate(${subEl.x || 0}px, ${subEl.y}px)` : "none",
                                        color: subEl.color || "#000",
                                        fontSize: `${subEl.fontSize}px`,
                                        fontFamily: subEl.fontFamily || "Inter",
                                        fontWeight: subEl.fontWeight || "normal",
                                        fontStyle: subEl.fontStyle || "normal",
                                        textTransform: subEl.uppercase ? "uppercase" : "none",
                                        letterSpacing: subEl.letterSpacing ? `${subEl.letterSpacing}px` : "normal",
                                        lineHeight: subEl.lineHeight || 1.2,
                                        textShadow: subEl.textShadow,
                                        WebkitTextStroke: subEl.WebkitTextStroke,
                                        backgroundColor: subEl.backgroundColor,
                                        backgroundImage: subEl.backgroundImage,
                                        WebkitBackgroundClip: subEl.WebkitBackgroundClip,
                                        WebkitTextFillColor: subEl.WebkitTextFillColor,
                                        padding: subEl.padding,
                                        borderRadius: subEl.borderRadius,
                                        whiteSpace: "pre-wrap",
                                        textAlign: subEl.textAlign || "center",
                                      }}
                                    >
                                      {displayVal}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })() : el.type === "text" ? (
                            <div
                              className={`${styles.rndText} customizer-drag-handle`}
                              style={{
                                color: el.color,
                                fontSize: `${fontSize}px`,
                                fontFamily: el.fontFamily ? `${el.fontFamily}, sans-serif` : "Inter, sans-serif",
                                fontWeight: el.fontWeight || "normal",
                                fontStyle: el.fontStyle || "normal",
                                textAlign: el.textAlign || "center",
                                textDecoration: el.textDecoration || "none",
                                textTransform: el.uppercase ? "uppercase" : "none",
                                cursor: "pointer",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                whiteSpace: "pre-wrap",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                width: "100%",
                                height: "100%",
                                overflow: "visible",
                                letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
                                lineHeight: el.lineHeight || 1.2,
                                textShadow: el.textShadow,
                                WebkitTextStroke: el.WebkitTextStroke,
                                backgroundColor: el.backgroundColor,
                                padding: el.padding,
                                borderRadius: el.borderRadius,
                              }}
                            >
                              {el.value.split("\n").map((line, i) => (
                                <div key={i} style={{ minHeight: "1em", width: "100%" }}>
                                  {el.uppercase ? line.toUpperCase() : line}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <img
                              src={el.value}
                              alt="logo"
                              draggable={false}
                              className="customizer-drag-handle"
                              style={{ width: "100%", height: "100%", objectFit: "contain", touchAction: "auto", pointerEvents: "none" }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
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
                          {el.type === "preset" ? (() => {
                            const presetDef = TEXT_PRESETS.find(p => p.id === el.presetId);
                            if (!presetDef) return null;
                            const presetScale = el.width / (el.originalWidth || presetDef.width);
                            return (
                              <div className="customizer-drag-handle" style={{ position: "relative", width: presetDef.width, height: presetDef.height, transform: `scale(${presetScale})`, transformOrigin: "top left", cursor: isActive ? "move" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", touchAction: isPreviewMode ? "auto" : "none" }}>
                                {presetDef.elements.map((subEl, i) => {
                                  let displayVal = subEl.value;
                                  if (el.presetText !== undefined) {
                                    if (Array.isArray(el.presetText)) {
                                      displayVal = el.presetText[i] !== undefined ? el.presetText[i] : (subEl.value || "");
                                    } else {
                                      // Fallback for old string format
                                      const inputLines = el.presetText.split("\n");
                                      if (presetDef.elements.length === 1) {
                                        displayVal = el.presetText;
                                      } else {
                                        displayVal = inputLines[i] || "";
                                      }
                                    }
                                  }
                                  
                                  // Auto-verticalize if the original preset was perfectly vertical
                                  const origVal = subEl.value || "";
                                  const origLetters = origVal.replace(/\n/g, '');
                                  const isVertical = origVal.includes('\n') && origVal.length === origLetters.length * 2 - 1;
                                  
                                  if (isVertical && displayVal && !displayVal.includes('\n')) {
                                    displayVal = displayVal.split('').join('\n');
                                  }
                                  
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        position: subEl.y !== undefined ? "absolute" : "relative",
                                        top: subEl.y !== undefined ? 0 : "auto",
                                        left: subEl.y !== undefined ? 0 : "auto",
                                        transform: subEl.y !== undefined ? `translate(${subEl.x || 0}px, ${subEl.y}px)` : "none",
                                        color: subEl.color || "#000",
                                        fontSize: `${subEl.fontSize}px`,
                                        fontFamily: subEl.fontFamily || "Inter",
                                        fontWeight: subEl.fontWeight || "normal",
                                        fontStyle: subEl.fontStyle || "normal",
                                        textTransform: subEl.uppercase ? "uppercase" : "none",
                                        letterSpacing: subEl.letterSpacing ? `${subEl.letterSpacing}px` : "normal",
                                        lineHeight: subEl.lineHeight || 1.2,
                                        textShadow: subEl.textShadow,
                                        WebkitTextStroke: subEl.WebkitTextStroke,
                                        backgroundColor: subEl.backgroundColor,
                                        backgroundImage: subEl.backgroundImage,
                                        WebkitBackgroundClip: subEl.WebkitBackgroundClip,
                                        WebkitTextFillColor: subEl.WebkitTextFillColor,
                                        padding: subEl.padding,
                                        borderRadius: subEl.borderRadius,
                                        whiteSpace: "pre-wrap",
                                        textAlign: subEl.textAlign || "center",
                                      }}
                                    >
                                      {displayVal}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })() : el.type === "text" ? (
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
                                  touchAction: isPreviewMode ? "auto" : "none",
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
                              style={{ width: "100%", height: "100%", objectFit: "contain", touchAction: isPreviewMode ? "auto" : "none", pointerEvents: isPreviewMode ? "none" : "auto" }}
                              crossOrigin="anonymous"
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
              </motion.div>
            </AnimatePresence>
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
