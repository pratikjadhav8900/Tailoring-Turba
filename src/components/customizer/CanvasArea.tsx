"use client";
import React, { useState, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { Move, RotateCw, Trash2, Minus, Plus, Settings, Copy } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, Side } from "@/types/customizer";
import { GARMENTS } from "@/lib/fabric-data";

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
  children?: React.ReactNode;
}

export default function CanvasArea({
  garmentType, activeSide, bodyColor, elements, activeElementId,
  isPreviewMode, isDragging, mockupId, zoom, onZoomChange,
  onElementClick, onUpdateElement, onRemoveElement, onCopyElement, onDragStart, onDragStop, children,
}: CanvasAreaProps) {
  const currentGarment = GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"];
  const currentImg = currentGarment[activeSide] || currentGarment["front"];

  // Inline text editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zoomRef = useRef(zoom);
  const onZoomChangeRef = useRef(onZoomChange);
  
  React.useEffect(() => {
    zoomRef.current = zoom;
    onZoomChangeRef.current = onZoomChange;
  }, [zoom, onZoomChange]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let initialDist = 0;
    let initialZoom = 1;

    const handleWheel = (e: WheelEvent) => {
      // Trackpad pinch gesture triggers wheel event with ctrlKey=true
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY;
        const newZoom = zoomRef.current - delta * 0.005;
        onZoomChangeRef.current(Math.max(0.3, Math.min(2.0, newZoom)));
      }
    };

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDist = getDistance(e.touches);
        initialZoom = zoomRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        if (initialDist > 0) {
          const dist = getDistance(e.touches);
          const scaleChange = dist / initialDist;
          const newZoom = initialZoom * scaleChange;
          onZoomChangeRef.current(Math.max(0.3, Math.min(2.0, newZoom)));
        }
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

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
  const scale = zoom;

  return (
    <div className={styles.canvasWrapper}>
      <div ref={canvasRef} className={styles.canvasArea} onClick={handleCanvasClick}>
        {/* Zoomed garment container */}
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", transition: "transform 0.2s" }}>
          <div id={mockupId} className={styles.garmentContainer}>
            {/* Color Layer */}
            <div
              className={styles.garmentColorLayer}
              style={{
                backgroundColor: bodyColor,
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
            {/* Shadow / Texture Layer */}
            <img
              key={`${garmentType}-${activeSide}`}
              src={currentImg}
              alt="Garment"
              className={styles.garmentBaseImage}
              style={{ mixBlendMode: "multiply", opacity: 0.8 }}
            />

            {/* Printable + Safety/Bleed zones */}
            {!isPreviewMode && (
              <>
                {/* Printable area box */}
                <div
                  className={styles.printableAreaBox}
                  style={{
                    top: currentGarment.printableArea?.top || "18%",
                    left: currentGarment.printableArea?.left || "28%",
                    width: currentGarment.printableArea?.width || "44%",
                    height: currentGarment.printableArea?.height || "60%",
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
                    <span className={styles.rulerTextVertical}>30.48cm</span>
                    <div className={styles.rulerLineVertical} />
                  </div>

                  {/* Bottom Ruler */}
                  <div className={styles.rulerBottom}>
                    <div className={styles.rulerLineHorizontal} />
                    <span className={styles.rulerTextHorizontal}>30.48cm</span>
                    <div className={styles.rulerLineHorizontal} />
                  </div>
                </div>
              </>
            )}

            {/* Design Elements */}
            {elements.map((el) => {
              const isActive = el.id === activeElementId && !isPreviewMode;
              const isEditing = el.id === editingId;
              const fontSize = el.fontSize
                ? el.fontSize
                : Math.min(
                    el.width / (Math.max(1, ...el.value.split("\n").map(l => l.length)) * 0.6 + 1),
                    (el.height / Math.max(1, el.value.split("\n").length)) * 0.8
                  );

              return (
                <Rnd
                  key={el.id}
                  className={`${styles.rndBox} ${isActive ? styles.rndBoxActive : ""}`}
                  bounds="parent"
                  dragHandleClassName="customizer-drag-handle"
                  position={{ x: el.x, y: el.y }}
                  size={{ width: el.width, height: el.height }}
                  onDragStart={onDragStart}
                  onDragStop={(_, d) => { onDragStop(); onUpdateElement(el.id, { x: d.x, y: d.y }); }}
                  onResizeStop={(_, __, ref, ___, pos) =>
                    onUpdateElement(el.id, {
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      ...pos,
                    })
                  }
                  disableDragging={!isActive || isPreviewMode || isEditing}
                  enableResizing={isActive && !isPreviewMode && !isEditing}
                >
                  <div
                    className={styles.rndContent}
                    style={{ transform: `rotate(${el.rotation || 0}deg)`, width: "100%", height: "100%" }}
                    onClick={(e) => handleElementClick(el, e)}
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
                        <textarea
                          className={`${styles.rndText} customizer-drag-handle`}
                          value={el.value}
                          spellCheck={false}
                          readOnly
                          onChange={() => {}}
                          placeholder="Click to select"
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
                          }}
                        />
                      )
                    ) : (
                      <img
                        src={el.value}
                        alt="logo"
                        draggable={false}
                        className="customizer-drag-handle"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
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
                      <div className={`${styles.circleActionBtn} customizer-drag-handle`} title="Move">
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

            {children}
          </div>
        </div>
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
            onClick={(e) => { e.stopPropagation(); onZoomChange(Math.min(2.0, zoom + 0.1)); }}
            title="Zoom in"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
          <div className={styles.zoomDivider} />
          <button
            className={styles.zoomBtn}
            onClick={(e) => { e.stopPropagation(); onZoomChange(0.71); }}
            title="Reset zoom"
          >
            <Settings size={15} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
