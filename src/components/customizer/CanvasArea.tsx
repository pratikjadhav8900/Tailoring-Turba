"use client";
import React, { useState, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { Move, RotateCw, Trash2, Check } from "lucide-react";
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
  onElementClick: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>, skipHistory?: boolean) => void;
  onRemoveElement: (id: string, e?: React.SyntheticEvent) => void;
  onDragStart: () => void;
  onDragStop: () => void;
  children?: React.ReactNode;
}

// ── Mobile double-tap edit modal ──────────────────────────────────
function MobileTextEditModal({
  value,
  onDone,
}: {
  value: string;
  onDone: (newValue: string) => void;
}) {
  const [draft, setDraft] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    // Auto-focus and move cursor to end
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={() => onDone(draft)}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          borderRadius: "20px 20px 0 0",
          padding: "20px 16px 32px",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>Edit Text</span>
          <button
            onClick={() => onDone(draft)}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 20px",
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <Check size={16} /> Done
          </button>
        </div>
        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            fontSize: 18,
            padding: "12px",
            border: "2px solid #6c3fc8",
            borderRadius: 12,
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            background: "#faf8ff",
            color: "#111",
          }}
          placeholder="Type your text here…"
        />
        <p style={{ fontSize: 12, color: "#888", marginTop: 8, textAlign: "center" }}>
          Tap outside or press Done to save
        </p>
      </div>
    </div>
  );
}

export default function CanvasArea({
  garmentType,
  activeSide,
  bodyColor,
  elements,
  activeElementId,
  isPreviewMode,
  isDragging,
  mockupId,
  onElementClick,
  onUpdateElement,
  onRemoveElement,
  onDragStart,
  onDragStop,
  children,
}: CanvasAreaProps) {
  const currentGarment = GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"];
  const currentImg = currentGarment[activeSide] || currentGarment["front"];

  // Double-tap to edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef<Record<string, number>>({});

  const handleElementTap = useCallback(
    (el: DesignElement, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      // Select element first
      onElementClick(el.id);

      if (el.type !== "text" || isPreviewMode) return;

      // Count taps within 300 ms
      tapCountRef.current[el.id] = (tapCountRef.current[el.id] || 0) + 1;

      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapTimerRef.current = setTimeout(() => {
        if ((tapCountRef.current[el.id] || 0) >= 2) {
          setEditingId(el.id);
        }
        tapCountRef.current[el.id] = 0;
      }, 300);
    },
    [onElementClick, isPreviewMode]
  );

  const handleEditDone = useCallback(
    (id: string, newValue: string) => {
      setEditingId(null);
      if (!newValue.trim()) {
        onRemoveElement(id);
      } else {
        onUpdateElement(id, { value: newValue });
      }
    },
    [onUpdateElement, onRemoveElement]
  );

  return (
    <div className={styles.canvasArea} onClick={() => onElementClick(null)}>
      <div id={mockupId} className={styles.garmentContainer}>
        {/* Color Layer */}
        <div 
          className={styles.garmentColorLayer} 
          style={{ 
            backgroundColor: bodyColor,
            maskImage: `url(${currentImg})`,
            WebkitMaskImage: `url(${currentImg})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        {/* Shadow/Texture Layer */}
        <img
          key={`${garmentType}-${activeSide}`}
          src={currentImg}
          alt="Garment"
          className={styles.garmentBaseImage}
          style={{ mixBlendMode: 'multiply', opacity: 0.8 }}
        />

        {!isPreviewMode && (
          <div 
            className={styles.printableArea}
            style={{
              top: currentGarment.printableArea?.top || "18%",
              left: currentGarment.printableArea?.left || "28%",
              width: currentGarment.printableArea?.width || "44%",
              height: currentGarment.printableArea?.height || "60%",
            }}
          ></div>
        )}

        {elements.map((el) => {
          const isActive = el.id === activeElementId && !isPreviewMode;
          return (
            <Rnd
              key={el.id}
              className={`${styles.rndBox} ${isActive ? styles.rndBoxActive : ""}`}
              bounds="parent"
              dragHandleClassName="customizer-drag-handle"
              position={{ x: el.x, y: el.y }}
              size={{ width: el.width, height: el.height }}
              onDragStart={onDragStart}
              onDragStop={(_, d) => {
                onDragStop();
                onUpdateElement(el.id, { x: d.x, y: d.y });
              }}
              onResizeStop={(_, __, ref, ___, pos) => onUpdateElement(el.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
              disableDragging={!isActive || isPreviewMode}
              enableResizing={isActive && !isPreviewMode}
            >
              <div 
                className={styles.rndContent} 
                style={{ transform: `rotate(${el.rotation || 0}deg)`, width: '100%', height: '100%' }} 
                onClick={(e) => handleElementTap(el, e)}
                onTouchEnd={(e) => handleElementTap(el, e as unknown as React.TouchEvent)}
              >
                {el.type === "text" ? (
                  <>
                    <textarea
                      className={`${styles.rndText} customizer-drag-handle`}
                      value={el.value}
                      spellCheck={false}
                      readOnly
                      onChange={() => {}}
                      placeholder="Tap to select"
                      style={{
                        color: el.color,
                        fontSize: `${Math.min(el.width / (Math.max(1, ...el.value.split('\n').map(l => l.length)) * 0.6 + 1), (el.height / Math.max(1, el.value.split('\n').length)) * 0.8)}px`,
                        fontFamily: el.fontFamily || "Inter",
                        fontWeight: el.fontWeight || "normal",
                        fontStyle: el.fontStyle || "normal",
                        textAlign: el.textAlign || "center",
                        textDecoration: el.textDecoration || "none",
                        textTransform: el.uppercase ? "uppercase" : "none",
                        cursor: "pointer",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                    />
                  </>
                ) : (
                  <img src={el.value} alt="logo" draggable={false} className="customizer-drag-handle" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>
              
              {isActive && !isDragging && (
                <div className={styles.floatingActionBtns}>
                  <div className={styles.circleActionBtn} onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { rotation: ((el.rotation || 0) + 90) % 360 }); }}><RotateCw size={14} /></div>
                  <div className={`${styles.circleActionBtn} customizer-drag-handle`}><Move size={14} /></div>
                  <div className={`${styles.circleActionBtn} ${styles.circleActionBtnDanger}`} onClick={(e) => onRemoveElement(el.id, e)}><Trash2 size={14} /></div>
                </div>
              )}
            </Rnd>
          );
        })}

        {children}
      </div>

      {/* Mobile text edit modal — renders outside the garment container so it fills the screen */}
      {editingId && (() => {
        const editEl = elements.find(e => e.id === editingId);
        return editEl ? (
          <MobileTextEditModal
            value={editEl.value}
            onDone={(newValue) => handleEditDone(editingId, newValue)}
          />
        ) : null;
      })()}
    </div>
  );
}
