"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, CustomizerState, Side } from "@/types/customizer";
import CanvasArea from "./CanvasArea";
import ToolPanel from "./ToolPanel";
import Image from "next/image";
import { GARMENTS } from "@/lib/fabric-data";
import { ALL_PRESETS as TEXT_PRESETS } from "@/lib/presets";

type ActiveTool = "Templates" | "Elements" | "Text" | "Brand" | "Uploads" | "Garment" | "Properties" | null;

interface Props {
  onChange?: (state: CustomizerState) => void;
  initialState?: CustomizerState | null;
  isPreviewMode?: boolean;
  activeSide?: Side;
  onSideChange?: (side: Side) => void;
  mockupId?: string;
  garmentType?: any;
  availableColors?: string[];
  colorsJson?: any;
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
  colorsJson,
}: Props) {
  const garmentType = propGarmentType || initialState?.garmentType || "round-neck";
  const [internalSide, setInternalSide] = useState<Side>("front");
  const activeSide = propSide || internalSide;
  const setActiveSide = onSideChange || setInternalSide;

  const [bodyColor, setBodyColor] = useState(initialState?.bodyColor || "transparent");
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [frontElements, setFrontElements] = useState<DesignElement[]>(initialState?.frontElements || []);
  const [backElements, setBackElements] = useState<DesignElement[]>(initialState?.backElements || []);
  const [leftElements, setLeftElements] = useState<DesignElement[]>(initialState?.leftElements || []);
  const [rightElements, setRightElements] = useState<DesignElement[]>(initialState?.rightElements || []);
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

  useEffect(() => {
    if (activeSide === "left" || activeSide === "right") {
      setZoom(3.0);
    } else {
      setZoom(1.52);
    }
  }, [activeSide]);



  // --- History (Undo/Redo) System ---
  const [history, setHistory] = useState<DesignElement[][]>([]);
  const [backHistory, setBackHistory] = useState<DesignElement[][]>([]);
  const [leftHistory, setLeftHistory] = useState<DesignElement[][]>([]);
  const [rightHistory, setRightHistory] = useState<DesignElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backHistoryIndex, setBackHistoryIndex] = useState(-1);
  const [leftHistoryIndex, setLeftHistoryIndex] = useState(-1);
  const [rightHistoryIndex, setRightHistoryIndex] = useState(-1);
  const isInternalChange = useRef(false);

  const pushToHistory = (newFront: DesignElement[], newBack: DesignElement[], newLeft: DesignElement[], newRight: DesignElement[]) => {
    if (isInternalChange.current) return;
    setHistory(prev => [...prev.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(newFront))]);
    setBackHistory(prev => [...prev.slice(0, backHistoryIndex + 1), JSON.parse(JSON.stringify(newBack))]);
    setLeftHistory(prev => [...prev.slice(0, leftHistoryIndex + 1), JSON.parse(JSON.stringify(newLeft))]);
    setRightHistory(prev => [...prev.slice(0, rightHistoryIndex + 1), JSON.parse(JSON.stringify(newRight))]);
    
    setHistoryIndex(prev => prev + 1);
    setBackHistoryIndex(prev => prev + 1);
    setLeftHistoryIndex(prev => prev + 1);
    setRightHistoryIndex(prev => prev + 1);
  };

  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(frontElements))]);
      setBackHistory([JSON.parse(JSON.stringify(backElements))]);
      setLeftHistory([JSON.parse(JSON.stringify(leftElements))]);
      setRightHistory([JSON.parse(JSON.stringify(rightElements))]);
      setHistoryIndex(0);
      setBackHistoryIndex(0);
      setLeftHistoryIndex(0);
      setRightHistoryIndex(0);
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
      setLeftElements(JSON.parse(JSON.stringify(leftHistory[prevIdx])));
      setRightElements(JSON.parse(JSON.stringify(rightHistory[prevIdx])));
      setHistoryIndex(prevIdx);
      setBackHistoryIndex(prevIdx);
      setLeftHistoryIndex(prevIdx);
      setRightHistoryIndex(prevIdx);
      setTimeout(() => { isInternalChange.current = false; }, 0);
    };
    const handleRedo = () => {
      if (historyIndex >= history.length - 1) return;
      isInternalChange.current = true;
      const nextIdx = historyIndex + 1;
      setFrontElements(JSON.parse(JSON.stringify(history[nextIdx])));
      setBackElements(JSON.parse(JSON.stringify(backHistory[nextIdx])));
      setLeftElements(JSON.parse(JSON.stringify(leftHistory[nextIdx])));
      setRightElements(JSON.parse(JSON.stringify(rightHistory[nextIdx])));
      setHistoryIndex(nextIdx);
      setBackHistoryIndex(nextIdx);
      setLeftHistoryIndex(nextIdx);
      setRightHistoryIndex(nextIdx);
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

  const elements = activeSide === "front" ? frontElements : activeSide === "back" ? backElements : activeSide === "left" ? leftElements : rightElements;

  const setElementsWithHistory = (newElements: DesignElement[]) => {
    const isFront = activeSide === "front";
    const isBack = activeSide === "back";
    const isLeft = activeSide === "left";
    const isRight = activeSide === "right";
    const nextFront = isFront ? newElements : frontElements;
    const nextBack = isBack ? newElements : backElements;
    const nextLeft = isLeft ? newElements : leftElements;
    const nextRight = isRight ? newElements : rightElements;
    
    if (isFront) setFrontElements(newElements);
    else if (isBack) setBackElements(newElements);
    else if (isLeft) setLeftElements(newElements);
    else if (isRight) setRightElements(newElements);
    
    pushToHistory(nextFront, nextBack, nextLeft, nextRight);
  };

  const handleElementClick = (id: string | null) => {
    // If we're deselecting the current active element, check if it's empty
    if (activeElementId && id !== activeElementId) {
      const activeEl = elements.find(e => e.id === activeElementId);
      if (activeEl) {
        if (activeEl.type === "text" && (!activeEl.value || !activeEl.value.trim())) {
          // Remove from state directly to avoid circular dependencies
          const newElements = elements.filter(el => el.id !== activeElementId);
          if (activeSide === "front") setFrontElements(newElements);
          else if (activeSide === "back") setBackElements(newElements);
          else if (activeSide === "left") setLeftElements(newElements);
          else if (activeSide === "right") setRightElements(newElements);
        } else if (activeEl.type === "preset") {
          const isArray = Array.isArray(activeEl.presetText);
          const lines = isArray ? (activeEl.presetText as string[]) : [(activeEl.presetText as string) || ""];
          if (!lines.some(line => line && line.trim())) {
            const newElements = elements.filter(el => el.id !== activeElementId);
            if (activeSide === "front") setFrontElements(newElements);
            else if (activeSide === "back") setBackElements(newElements);
            else if (activeSide === "left") setLeftElements(newElements);
            else if (activeSide === "right") setRightElements(newElements);
          }
        }
      }
    }
    setActiveElementId(id);
  };

  useEffect(() => {
    if (onChange) {
      onChange({ bodyColor, garmentType, frontElements, backElements, leftElements, rightElements, previewSize });
    }
  }, [frontElements, backElements, leftElements, rightElements, bodyColor, garmentType, previewSize]);

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
    handleElementClick(id);
    setActiveTool(null);
  };

  const addPreset = (presetId: string, text: string | string[]) => {
    const preset = TEXT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const id = Date.now().toString();
    
    let width = preset.width;
    let height = preset.height;
    if (width > 200) {
      const ratio = 200 / width;
      width = 200;
      height = height * ratio;
    }
    
    const x = Math.round((560 - width) / 2);
    const y = Math.round((560 - height) / 2);

    const newEl: DesignElement = {
      id,
      type: "preset",
      x,
      y,
      width,
      height,
      value: "",
      color: "",
      printType: "dtf",
      originalWidth: preset.width,
      originalHeight: preset.height,
      presetId,
      presetText: text,
      rotation: 0,
    };
    setElementsWithHistory([...elements, newEl]);
    handleElementClick(id);
    setActiveTool(null);
  };

  const addSvgElement = (element: { svg: string; name: string; color?: string }) => {
    const id = Date.now().toString();
    const width = 100;
    const height = 100;
    const x = Math.round((560 - width) / 2);
    const y = Math.round((560 - height) / 2);
    const newEl: DesignElement = {
      id,
      type: "logo",
      x,
      y,
      width,
      height,
      value: `data:image/svg+xml,${encodeURIComponent(element.svg.replace('currentColor', element.color || '#111111'))}`,
      color: element.color || "#111111",
      printType: "dtf",
      originalWidth: 400,
      originalHeight: 400,
    };
    setElementsWithHistory([...elements, newEl]);
    handleElementClick(id);
    setActiveTool(null);
  };

  const applyTemplate = (templateElements: any[]) => {
    const newElements = templateElements.map((el: any, i: number) => ({
      id: `${Date.now()}-${i}`,
      type: "text" as const,
      x: el.x || 200,
      y: el.y || 200,
      width: el.width || 160,
      height: el.height || 48,
      value: el.value || "Text",
      color: el.color || "#000000",
      fontFamily: el.fontFamily || "Inter",
      fontWeight: el.fontWeight || "bold",
      textAlign: "center" as const,
      rotation: 0,
      fontSize: el.fontSize || 24,
      textTransform: el.textTransform,
      letterSpacing: el.letterSpacing,
    }));
    setElementsWithHistory([...elements, ...newElements]);
    if (newElements.length > 0) {
      handleElementClick(newElements[0].id);
    }
    setActiveTool(null);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    // Snapshot which side is active *now*, before any async operations
    // (on mobile the file picker can trigger re-renders that change activeSide)
    const sideAtStart = activeSideRef.current;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isLogo", "true");
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

      // Use functional updaters to always get the freshest array from React,
      // and use sideAtStart (captured before async gap) to target the correct side.
      // This fixes the mobile stale-closure bug where elements/activeSide were
      // captured before the file picker opened and the bottom sheet closed.
      if (sideAtStart === "front") {
        setFrontElements(prev => [...prev, newEl]);
      } else if (sideAtStart === "back") {
        setBackElements(prev => [...prev, newEl]);
      } else if (sideAtStart === "left") {
        setLeftElements(prev => [...prev, newEl]);
      } else {
        setRightElements(prev => [...prev, newEl]);
      }
      setActiveTool(null);
    } catch (err) {
      console.error("Logo upload error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Called by ToolPanel QR modal once mobile image URL is ready
  const addLogoFromUrl = async (url: string) => {
    try {
      const img = new window.Image();
      img.src = url;
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

      const x = Math.round((560 - width) / 2);
      const y = 180;

      const currentElements = activeSideRef.current === "front" ? frontElements : activeSideRef.current === "back" ? backElements : activeSideRef.current === "left" ? leftElements : rightElements;
      const newEl: DesignElement = {
        id: Date.now().toString(),
        type: "logo",
        x,
        y,
        width,
        height,
        value: url,
        color: "",
        printType: "dtf",
        originalWidth,
        originalHeight,
      };
      
      const nextFront = activeSideRef.current === "front" ? [...currentElements, newEl] : frontElements;
      const nextBack = activeSideRef.current === "back" ? [...currentElements, newEl] : backElements;
      const nextLeft = activeSideRef.current === "left" ? [...currentElements, newEl] : leftElements;
      const nextRight = activeSideRef.current === "right" ? [...currentElements, newEl] : rightElements;

      if (activeSideRef.current === "front") setFrontElements(nextFront);
      else if (activeSideRef.current === "back") setBackElements(nextBack);
      else if (activeSideRef.current === "left") setLeftElements(nextLeft);
      else if (activeSideRef.current === "right") setRightElements(nextRight);

      pushToHistory(nextFront, nextBack, nextLeft, nextRight);
      setActiveTool(null);
    } catch (err) {
      console.error("Mobile logo add error:", err);
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
    else if (activeSide === "back") setBackElements(newElements);
    else if (activeSide === "left") setLeftElements(newElements);
    else if (activeSide === "right") setRightElements(newElements);
    
    if (!skipHistory) {
      const nextFront = activeSide === "front" ? newElements : frontElements;
      const nextBack = activeSide === "back" ? newElements : backElements;
      const nextLeft = activeSide === "left" ? newElements : leftElements;
      const nextRight = activeSide === "right" ? newElements : rightElements;
      pushToHistory(nextFront, nextBack, nextLeft, nextRight);
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
      handleElementClick(newId);
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
          handleElementClick(newId);
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
    <div 
      className={styles.wrapper} 
      style={isPreviewMode ? { height: '100%', minHeight: 'auto', background: 'transparent' } : undefined}
    >
      {/* Left icon sidebar + context panel */}
      {!isPreviewMode && (
        <ToolPanel
          activeTool={activeTool as any}
          bodyColor={bodyColor}
          isUploading={isUploading}
          onToolSelect={setActiveTool as any}
          onColorSelect={setBodyColor}
          onAddText={addText}
          onAddPreset={addPreset}
          onUploadClick={() => fileInputRef.current?.click()}
          onAddLogoUrl={addLogoFromUrl}
          onAddSvgElement={addSvgElement}
          onApplyTemplate={applyTemplate}
          availableColors={availableColors}
          colorsJson={colorsJson}
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
          onElementClick={handleElementClick}
          onUpdateElement={updateElement}
          onRemoveElement={removeElement}
          onCopyElement={copyElement}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
          previewSize={previewSize}
          colorsJson={colorsJson}
        >
          {/* Side Switcher Thumbnails & Preview Size Selector */}
          {!isPreviewMode && (
            <div className={styles.rightThumbnails}>
              {(["front", "back", "left"] as Side[]).map((side) => {
                const garment = (GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"]) as any;
                const img = garment[side];
                if (!img) return null;
                return (
                  <button
                    key={side}
                    className={`${styles.thumbnailBtn} ${activeSide === side ? styles.thumbnailBtnActive : ""}`}
                    onClick={() => {
                      handleElementClick(null);
                      setActiveSide(side);
                    }}
                  >
                    <div className={styles.thumbnailImgWrap}>
                      <Image
                        src={img}
                        alt={side === "left" ? "Sleeves" : side}
                        fill
                        className={styles.garmentImage}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <span className={styles.thumbnailLabel}>
                      {side === "left" ? "Sleeves" : side.charAt(0).toUpperCase() + side.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CanvasArea>
      </div>
    </div>
  );
}
