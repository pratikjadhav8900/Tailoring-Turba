"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, CustomizerState, Side } from "@/types/customizer";
import CanvasArea from "./CanvasArea";
import ToolPanel from "./ToolPanel";
import FormattingToolbar from "./FormattingToolbar";
import ThreeDPreview from "./ThreeDPreviewCanvas";
import Image from "next/image";
import { GARMENTS } from "@/lib/fabric-data";

type ActiveTool = "Text" | "Uploads" | "Elements" | "Colors" | null;

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
  availableColors
}: Props) {
  const garmentType = propGarmentType || (initialState?.garmentType) || "round-neck";
  const [internalSide, setInternalSide] = useState<Side>("front");
  const activeSide = propSide || internalSide;
  const setActiveSide = onSideChange || setInternalSide;

  const [bodyColor, setBodyColor] = useState(initialState?.bodyColor || "#111111");
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [frontElements, setFrontElements] = useState<DesignElement[]>(initialState?.frontElements || []);
  const [backElements, setBackElements] = useState<DesignElement[]>(initialState?.backElements || []);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- History (Undo/Redo) System ---
  const [history, setHistory] = useState<DesignElement[][]>([]);
  const [backHistory, setBackHistory] = useState<DesignElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backHistoryIndex, setBackHistoryIndex] = useState(-1);
  const isInternalChange = useRef(false);

  // Push to history
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

  // Initial history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(frontElements))]);
      setBackHistory([JSON.parse(JSON.stringify(backElements))]);
      setHistoryIndex(0);
      setBackHistoryIndex(0);
    }
  }, []);

  // Sync state and notify parent
  useEffect(() => {
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    window.dispatchEvent(new CustomEvent('history-bounds', { detail: { canUndo, canRedo } }));
  }, [historyIndex, history.length]);

  // Handle Global Events
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

    window.addEventListener('undo-customizer', handleUndo);
    window.addEventListener('redo-customizer', handleRedo);
    return () => {
      window.removeEventListener('undo-customizer', handleUndo);
      window.removeEventListener('redo-customizer', handleRedo);
    };
  }, [history, backHistory, historyIndex]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSideRef = useRef<Side>("front");
  useEffect(() => { activeSideRef.current = activeSide; }, [activeSide]);

  const elements = activeSide === "front" ? frontElements : backElements;
  
  // Wrap state updates to trigger history
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
      onChange({ bodyColor, garmentType, frontElements, backElements });
    }
  }, [frontElements, backElements, bodyColor, garmentType, onChange]);

  const addText = () => {
    const id = Date.now().toString();
    const newElements = [...elements, {
      id, type: "text",
      x: 200, y: 250, width: 200, height: 50,
      value: "Add Text", color: "#000000",
      fontFamily: "Inter", fontWeight: "bold", textAlign: "center", rotation: 0
    } as DesignElement];
    setElementsWithHistory(newElements);
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
      
      const newEl = {
        id: Date.now().toString(), 
        type: "logo" as const,
        x: 200, y: 200, width: 150, height: 150,
        value: data.url, 
        color: "",
      };

      const newElements = [...elements, newEl];
      setElementsWithHistory(newElements);
      setActiveTool(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeElement = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (activeElementId === id) setActiveElementId(null);
    const newElements = elements.filter(el => el.id !== id);
    setElementsWithHistory(newElements);
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

  const activeEl = elements.find(e => e.id === activeElementId);

  return (
    <div className={styles.wrapper}>
      {!isPreviewMode && (
        <ToolPanel 
          activeTool={activeTool}
          bodyColor={bodyColor}
          isUploading={isUploading}
          onToolSelect={setActiveTool}
          onColorSelect={setBodyColor}
          onAddText={addText}
          onUploadClick={() => fileInputRef.current?.click()}
          availableColors={availableColors}
        />
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} />

      <CanvasArea 
        garmentType={garmentType}
        activeSide={activeSide}
        bodyColor={bodyColor}
        elements={elements}
        activeElementId={activeElementId}
        isPreviewMode={!!isPreviewMode}
        isDragging={isDragging}
        mockupId={mockupId}
        onElementClick={setActiveElementId}
        onUpdateElement={updateElement}
        onRemoveElement={removeElement}
        onDragStart={() => setIsDragging(true)}
        onDragStop={() => setIsDragging(false)}
      >
        {activeEl && !isPreviewMode && !isDragging && (
          <FormattingToolbar 
            activeEl={activeEl}
            onUpdate={updateElement}
            onRemove={removeElement}
          />
        )}
        {/* Side Switcher Thumbnails */}
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
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <span className={styles.thumbnailLabel}>{side.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}
      </CanvasArea>


    </div>
  );
}
