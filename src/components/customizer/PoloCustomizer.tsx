"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, CustomizerState, Side } from "@/types/customizer";
import CanvasArea from "./CanvasArea";
import ToolPanel from "./ToolPanel";
import Image from "next/image";
import { GARMENTS } from "@/lib/fabric-data";

type ActiveTool = "Text" | "Uploads" | "Colors" | "Names" | "Guide" | "Properties" | null;

interface Props {
  onChange?: (state: CustomizerState) => void;
  initialState?: CustomizerState | null;
  isPreviewMode?: boolean;
  activeSide?: Side;
  onSideChange?: (side: Side) => void;
  mockupId?: string;
  garmentType?: any;
  availableColors?: string[];
}

export default function PoloCustomizer({
  onChange,
  initialState,
  isPreviewMode,
  activeSide: propSide,
  onSideChange,
  mockupId = "customizer-mockup-area",
  garmentType: propGarmentType,
  availableColors,
}: Props) {
  const garmentType = propGarmentType || initialState?.garmentType || "round-neck";
  const [internalSide, setInternalSide] = useState<Side>("front");
  const activeSide = propSide || internalSide;
  const setActiveSide = onSideChange || setInternalSide;

  const [bodyColor, setBodyColor] = useState(initialState?.bodyColor || "transparent");
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [frontElements, setFrontElements] = useState<DesignElement[]>(initialState?.frontElements || []);
  const [backElements, setBackElements] = useState<DesignElement[]>(initialState?.backElements || []);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<"S" | "M" | "L" | "XL" | "XXL">(initialState?.previewSize || "M");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(1.52);
  const [clipboard, setClipboard] = useState<DesignElement | null>(null);

  useEffect(() => {
    if (activeElementId) {
      setActiveTool("Properties");
    } else if (activeTool === "Properties") {
      setActiveTool(null);
    }
  }, [activeElementId]);



  // --- History (Undo/Redo) System ---
  const [history, setHistory] = useState<DesignElement[][]>([]);
  const [backHistory, setBackHistory] = useState<DesignElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backHistoryIndex, setBackHistoryIndex] = useState(-1);
  const isInternalChange = useRef(false);

  const pushToHistory = (newFront: DesignElement[], newBack: DesignElement[]) => {
    if (isInternalChange.current) return;
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, JSON.parse(JSON.stringify(newFront))];
    });
    setBackHistory(prev => {
      const next = prev.slice(0, backHistoryIndex + 1);
      return [...next, JSON.parse(JSON.stringify(newBack))];
    });
    setHistoryIndex(prev => prev + 1);
    setBackHistoryIndex(prev => prev + 1);
  };

  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(frontElements))]);
      setBackHistory([JSON.parse(JSON.stringify(backElements))]);
      setHistoryIndex(0);
      setBackHistoryIndex(0);
    }
  }, []);

  useEffect(() => {
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    window.dispatchEvent(new CustomEvent("history-bounds", { detail: { canUndo, canRedo } }));
  }, [historyIndex, history.length]);

  useEffect(() => {
    const handleUndo = () => {
      if (historyIndex <= 0) return;
      isInternalChange.current = true;
      const prevIdx = historyIndex - 1;
      setFrontElements(JSON.parse(JSON.stringify(history[prevIdx])));
      setBackElements(JSON.parse(JSON.stringify(backHistory[prevIdx])));
      setHistoryIndex(prevIdx);
      setBackHistoryIndex(prevIdx);
      setTimeout(() => { isInternalChange.current = false; }, 0);
    };
    const handleRedo = () => {
      if (historyIndex >= history.length - 1) return;
      isInternalChange.current = true;
      const nextIdx = historyIndex + 1;
      setFrontElements(JSON.parse(JSON.stringify(history[nextIdx])));
      setBackElements(JSON.parse(JSON.stringify(backHistory[nextIdx])));
      setHistoryIndex(nextIdx);
      setBackHistoryIndex(nextIdx);
      setTimeout(() => { isInternalChange.current = false; }, 0);
    };
    window.addEventListener("undo-customizer", handleUndo);
    window.addEventListener("redo-customizer", handleRedo);
    return () => {
      window.removeEventListener("undo-customizer", handleUndo);
      window.removeEventListener("redo-customizer", handleRedo);
    };
  }, [history, backHistory, historyIndex]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSideRef = useRef<Side>("front");
  useEffect(() => { activeSideRef.current = activeSide; }, [activeSide]);

  const elements = activeSide === "front" ? frontElements : backElements;

  const setElementsWithHistory = (newElements: DesignElement[]) => {
    const isFront = activeSide === "front";
    const nextFront = isFront ? newElements : frontElements;
    const nextBack = isFront ? backElements : newElements;
    if (isFront) setFrontElements(newElements);
    else setBackElements(newElements);
    pushToHistory(nextFront, nextBack);
  };

  useEffect(() => {
    if (onChange) {
      onChange({ bodyColor, garmentType, frontElements, backElements, previewSize });
    }
  }, [frontElements, backElements, bodyColor, garmentType, previewSize]);

  const addText = (text?: string) => {
    const id = Date.now().toString();
    const value = text || "Add Text";
    const width = 160;
    const height = 48;
    const x = Math.round((560 - width) / 2);
    const newEl: DesignElement = {
      id,
      type: "text",
      x,
      y: 200,
      width,
      height,
      value,
      color: "#000000",
      fontFamily: "Inter",
      fontWeight: "bold",
      textAlign: "center",
      rotation: 0,
      fontSize: 24,
    };
    setElementsWithHistory([...elements, newEl]);
    setActiveElementId(id);
    setActiveTool(null);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      // Measure dimensions
      const img = new window.Image();
      img.src = data.url;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const originalWidth = img.naturalWidth || 400;
      const originalHeight = img.naturalHeight || 400;
      const aspectRatio = originalWidth / originalHeight;

      let width = 160;
      let height = 160;
      if (aspectRatio > 1) {
        height = Math.round(160 / aspectRatio);
      } else {
        width = Math.round(160 * aspectRatio);
      }

      // Center the logo in the 560px canvas
      const x = Math.round((560 - width) / 2);
      const y = 180;

      const newEl: DesignElement = {
        id: Date.now().toString(),
        type: "logo",
        x,
        y,
        width,
        height,
        value: data.url,
        color: "",
        printType: "dtf",
        originalWidth,
        originalHeight,
      };
      setElementsWithHistory([...elements, newEl]);
      setActiveTool(null);
    } catch (err) {
      console.error("Logo upload error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeElement = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (activeElementId === id) setActiveElementId(null);
    setElementsWithHistory(elements.filter(el => el.id !== id));
  };

  const updateElement = (id: string, updates: Partial<DesignElement>, skipHistory = false) => {
    const newElements = elements.map(e => e.id === id ? { ...e, ...updates } : e);
    if (activeSide === "front") setFrontElements(newElements);
    else setBackElements(newElements);
    if (!skipHistory) {
      const nextFront = activeSide === "front" ? newElements : frontElements;
      const nextBack = activeSide === "front" ? backElements : newElements;
      pushToHistory(nextFront, nextBack);
    }
  };

  const copyElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) setClipboard(JSON.parse(JSON.stringify(el)));
  };

  const pasteFromClipboard = () => {
    if (clipboard) {
      const newId = Date.now().toString();
      const pastedEl = { ...clipboard, id: newId, x: clipboard.x + 20, y: clipboard.y + 20 };
      setElementsWithHistory([...elements, pastedEl]);
      setActiveElementId(newId);
    }
  };

  // --- Keyboard Shortcuts (Copy/Paste/Delete) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (activeElementId) {
          const el = elements.find(e => e.id === activeElementId);
          if (el) {
            setClipboard(JSON.parse(JSON.stringify(el)));
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboard) {
          const newId = Date.now().toString();
          const pastedEl = { ...clipboard, id: newId, x: clipboard.x + 20, y: clipboard.y + 20 };
          setElementsWithHistory([...elements, pastedEl]);
          setActiveElementId(newId);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeElementId) {
          removeElement(activeElementId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeElementId, elements, clipboard, activeSide]);

  const activeEl = elements.find(e => e.id === activeElementId);

  return (
    <div className={styles.wrapper}>
      {/* Left icon sidebar + context panel */}
      {!isPreviewMode && (
        <ToolPanel
          activeTool={activeTool as any}
          bodyColor={bodyColor}
          isUploading={isUploading}
          onToolSelect={setActiveTool as any}
          onColorSelect={setBodyColor}
          onAddText={addText}
          onUploadClick={() => fileInputRef.current?.click()}
          availableColors={availableColors}
          textElements={elements.filter(e => e.type === "text")}
          onUpdateTextElement={(id, val) => updateElement(id, { value: val })}
          onRemoveElement={(id) => removeElement(id)}
          
          activeElement={activeEl}
          onUpdateElement={updateElement}
          onCopyElement={copyElement}
          garmentType={garmentType}
          activeSide={activeSide}
          previewSize={previewSize}
          onPreviewSizeChange={setPreviewSize}
        />
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />

      {/* Canvas column: top formatting bar + canvas + zoom */}
      <div className={styles.canvasColumn}>

        <CanvasArea
          garmentType={garmentType}
          activeSide={activeSide}
          bodyColor={bodyColor}
          elements={elements}
          activeElementId={activeElementId}
          isPreviewMode={!!isPreviewMode}
          isDragging={isDragging}
          mockupId={mockupId}
          zoom={zoom}
          onZoomChange={setZoom}
          onElementClick={setActiveElementId}
          onUpdateElement={updateElement}
          onRemoveElement={removeElement}
          onCopyElement={copyElement}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
          previewSize={previewSize}
        >
          {/* Side Switcher Thumbnails & Preview Size Selector */}
          {!isPreviewMode && (
            <div className={styles.rightThumbnails}>
              {(["front", "back"] as Side[]).map((side) => (
                <button
                  key={side}
                  className={`${styles.thumbnailBtn} ${activeSide === side ? styles.thumbnailBtnActive : ""}`}
                  onClick={() => setActiveSide(side)}
                >
                  <div className={styles.thumbnailImgWrap}>
                    <Image
                      src={(GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"])[side]}
                      alt={side}
                      fill
                      className={styles.garmentImage}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <span className={styles.thumbnailLabel}>{side.charAt(0).toUpperCase() + side.slice(1)}</span>
                </button>
              ))}

              {/* Garment Preview Size Selector */}
              <div className={styles.sizeSelectorCard}>
                <span className={styles.sizeSelectorLabel}>Preview Size</span>
                {(["S", "M", "L", "XL", "XXL"] as const).map((sz) => {
                  const chestInches = sz === "S" ? "18\"" : sz === "M" ? "20\"" : sz === "L" ? "22\"" : sz === "XL" ? "24\"" : "26\"";
                  return (
                    <button
                      key={sz}
                      type="button"
                      className={`${styles.sizeSelectorBtn} ${previewSize === sz ? styles.sizeSelectorBtnActive : ""}`}
                      onClick={() => setPreviewSize(sz)}
                      title={`Chest width: ${chestInches}`}
                    >
                      <span className={styles.sizeSelectorText}>{sz}</span>
                      <span className={styles.sizeSelectorSubtext}>{chestInches}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CanvasArea>
      </div>
    </div>
  );
}
