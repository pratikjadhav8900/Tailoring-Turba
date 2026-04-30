"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Rnd } from "react-rnd";
import { Type, UploadCloud, Image as ImageIcon, Layers, Palette, X, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ScanText, RotateCw, Move } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement, CustomizerState, Side } from "@/types/customizer";
import { GARMENTS, FABRICS, COLOR_PRESETS } from "@/lib/fabric-data";

type GarmentKey = keyof typeof GARMENTS;
type ActiveTool = "Text" | "Uploads" | "Elements" | "Colors" | null;

interface Props {
  onChange?: (state: CustomizerState) => void;
  initialState?: CustomizerState | null;
  isPreviewMode?: boolean;
}

export default function PoloCustomizer({ onChange, initialState, isPreviewMode }: Props) {
  const [garmentType] = useState<GarmentKey>((initialState?.garmentType as GarmentKey) || "round-neck");
  const [activeSide, setActiveSide] = useState<Side>("front");
  const [bodyColor, setBodyColor] = useState(initialState?.bodyColor || "#111111");
  const [activeTool, setActiveTool] = useState<ActiveTool>("Text");
  const [frontElements, setFrontElements] = useState<DesignElement[]>(initialState?.frontElements || []);
  const [backElements, setBackElements] = useState<DesignElement[]>(initialState?.backElements || []);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep a stable ref to activeSide so upload handler never has stale closure
  const activeSideRef = useRef<Side>("front");
  useEffect(() => { activeSideRef.current = activeSide; }, [activeSide]);

  const elements = activeSide === "front" ? frontElements : backElements;
  const setElements = activeSide === "front" ? setFrontElements : setBackElements;

  // History Stack Logic
  const [history, setHistory] = useState<{ bodyColor: string, frontElements: DesignElement[], backElements: DesignElement[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isFirstMount = useRef(true);
  const isUndoingRef = useRef(false);
  const saveHistoryRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isFirstMount.current) {
      const initialStateData = { 
        bodyColor, 
        frontElements: JSON.parse(JSON.stringify(frontElements)), 
        backElements: JSON.parse(JSON.stringify(backElements)) 
      };
      setHistory([initialStateData]);
      setHistoryIndex(0);
      isFirstMount.current = false;
      return;
    }
    
    // If we are currently performing an undo/redo, don't record this change as a new history entry
    if (isUndoingRef.current) {
      return;
    }
    
    if (saveHistoryRef.current) clearTimeout(saveHistoryRef.current);
    
    saveHistoryRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHist = prev.slice(0, historyIndex + 1);
        const newState = { 
          bodyColor, 
          frontElements: JSON.parse(JSON.stringify(frontElements)), 
          backElements: JSON.parse(JSON.stringify(backElements)) 
        };
        // Avoid duplicate history entries if nothing actually changed
        const lastState = newHist[newHist.length - 1];
        if (lastState && JSON.stringify(lastState) === JSON.stringify(newState)) return prev;
        
        return [...newHist, newState];
      });
      setHistoryIndex(prev => prev + 1);
    }, 400); // Slightly faster debounce
    
  }, [bodyColor, frontElements, backElements]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleUndo = () => {
      if (historyIndex > 0) {
        const prevState = history[historyIndex - 1];
        isUndoingRef.current = true;
        setBodyColor(prevState.bodyColor);
        setFrontElements(JSON.parse(JSON.stringify(prevState.frontElements)));
        setBackElements(JSON.parse(JSON.stringify(prevState.backElements)));
        setHistoryIndex(historyIndex - 1);
        // Reset the undoing flag after a short delay to allow effects to run
        setTimeout(() => { isUndoingRef.current = false; }, 100);
      }
    };
    
    const handleRedo = () => {
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        isUndoingRef.current = true;
        setBodyColor(nextState.bodyColor);
        setFrontElements(JSON.parse(JSON.stringify(nextState.frontElements)));
        setBackElements(JSON.parse(JSON.stringify(nextState.backElements)));
        setHistoryIndex(historyIndex + 1);
        // Reset the undoing flag after a short delay to allow effects to run
        setTimeout(() => { isUndoingRef.current = false; }, 100);
      }
    };

    window.addEventListener('undo-customizer', handleUndo);
    window.addEventListener('redo-customizer', handleRedo);
    
    // Broadcast bounds to parent
    window.dispatchEvent(new CustomEvent('history-bounds', { 
      detail: { canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 } 
    }));

    return () => {
      window.removeEventListener('undo-customizer', handleUndo);
      window.removeEventListener('redo-customizer', handleRedo);
    };
  }, [history, historyIndex]);

  useEffect(() => {
    if (onChange) {
      onChange({ bodyColor, garmentType, frontElements, backElements });
    }
  }, [frontElements, backElements, bodyColor, garmentType, onChange]);

  const addText = () => {
    const id = Date.now().toString();
    setElements([...elements, {
      id, type: "text",
      x: 200, y: 250, width: 200, height: 50,
      value: "Add Text", color: "#000000",
      fontFamily: "Inter", fontWeight: "bold", textAlign: "center", rotation: 0
    }]);
    setActiveElementId(id);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newEl = {
      id: Date.now().toString(), type: "logo" as const,
      x: 200, y: 200, width: 150, height: 150,
      value: url, color: "",
    };
    // Use activeSideRef to avoid stale closure when switching sides
    if (activeSideRef.current === "front") {
      setFrontElements(prev => [...prev, newEl]);
    } else {
      setBackElements(prev => [...prev, newEl]);
    }
    // Reset file input so the same image can be uploaded again
    e.target.value = "";
  };

  const removeElement = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (activeElementId === id) setActiveElementId(null);
    requestAnimationFrame(() => {
      if (activeSide === "front") setFrontElements((p) => p.filter((el) => el.id !== id));
      else setBackElements((p) => p.filter((el) => el.id !== id));
    });
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const currentImg = GARMENTS[garmentType][activeSide];
  const activeEl = elements.find((e) => e.id === activeElementId) as DesignElement | undefined;

  return (
    <div className={styles.wrapper}>
      {/* LEFT SIDEBAR */}
      {!isPreviewMode && (
        <div className={styles.leftSidebar}>
          <button 
            className={`${styles.sidebarToolBtn} ${activeTool === "Text" ? styles.sidebarToolActive : ""}`}
            onClick={() => setActiveTool("Text")}
          >
            <Type size={24} className={styles.sidebarToolIcon} />
            <span className={styles.sidebarToolLabel}>Text</span>
          </button>
          
          <button 
            className={`${styles.sidebarToolBtn} ${activeTool === "Uploads" ? styles.sidebarToolActive : ""}`}
            onClick={() => setActiveTool("Uploads")}
          >
            <UploadCloud size={24} className={styles.sidebarToolIcon} />
            <span className={styles.sidebarToolLabel}>Uploads</span>
          </button>

          <button 
            className={`${styles.sidebarToolBtn} ${activeTool === "Colors" ? styles.sidebarToolActive : ""}`}
            onClick={() => setActiveTool("Colors")}
          >
            <Palette size={24} className={styles.sidebarToolIcon} />
            <span className={styles.sidebarToolLabel}>Colors</span>
          </button>
        </div>
      )}

      {/* CONTEXT PANEL */}
      {activeTool && !isPreviewMode && (
        <div className={styles.contextPanel}>
          <div className={styles.contextHeader}>
            <div className={styles.contextTitle}>
              {activeTool === "Text" && "Add text to your design"}
              {activeTool === "Uploads" && "Upload assets"}
              {activeTool === "Colors" && "Change Garment Color"}
            </div>
            <button className={styles.closeContextBtn} onClick={() => setActiveTool(null)}>
              <X size={20} />
            </button>
          </div>
          
          <div className={styles.contextBody}>
            {activeTool === "Text" && (
              <>
                <div className={styles.contextHint}>Click the button below to add text to your design</div>
                <button className={styles.addAssetBtn} onClick={addText}>
                  <Type size={18} /> Add a text box
                </button>
              </>
            )}

            {activeTool === "Uploads" && (
              <>
                <div className={styles.contextHint}>Upload logos, SVGs, or high-res images.</div>
                <button className={styles.addAssetBtn} onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud size={18} /> Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />
              </>
            )}

            {activeTool === "Colors" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    onClick={() => setBodyColor(p.hex)}
                    title={p.name}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: p.hex,
                      border: p.hex === "#FFFFFF" ? "1px solid #D1D5DB" : "none",
                      boxShadow: bodyColor === p.hex ? '0 0 0 2px white, 0 0 0 4px #25338B' : 'none',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CANVAS AREA */}
      <div className={styles.canvasArea} onClick={() => setActiveElementId(null)}>
        
        {/* Right Side Thumbnails */}
        <div className={styles.rightThumbnails}>
          <button 
            className={`${styles.thumbnailBtn} ${activeSide === "front" ? styles.thumbnailBtnActive : ""}`}
            onClick={(e) => { e.stopPropagation(); setActiveSide("front"); }}
          >
            <div className={styles.thumbnailImgWrap}>
              <Image src={GARMENTS[garmentType].front} alt="Front" fill style={{objectFit: 'contain'}} />
            </div>
            <span className={styles.thumbnailLabel}>Front</span>
          </button>
          <button 
            className={`${styles.thumbnailBtn} ${activeSide === "back" ? styles.thumbnailBtnActive : ""}`}
            onClick={(e) => { e.stopPropagation(); setActiveSide("back"); }}
          >
            <div className={styles.thumbnailImgWrap}>
              <Image src={GARMENTS[garmentType].back} alt="Back" fill style={{objectFit: 'contain'}} />
            </div>
            <span className={styles.thumbnailLabel}>Back</span>
          </button>
        </div>

        <div className={styles.garmentContainer}>
          <Image
            src={currentImg}
            alt="Garment"
            fill
            className={styles.garmentImage}
            style={{ mixBlendMode: 'darken' }}
            priority
          />

          {/* Printable Area Bounding Box */}
          {!isPreviewMode && <div className={styles.printableArea}></div>}

          {/* Floating Formatting Toolbar */}
          {activeEl && !isPreviewMode && (
            <div 
              className={styles.formattingToolbarFloating}
              style={{
                top: Math.max(10, activeEl.y - 65),
                left: activeEl.x + (activeEl.width / 2),
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {activeEl.type === "text" && (
                <>
                  <select 
                    className={styles.toolSelect}
                    value={activeEl.fontFamily || "Inter"}
                    onChange={(e) => updateElement(activeEl.id, { fontFamily: e.target.value })}
                    style={{ width: '120px', fontWeight: 600 }}
                  >
                    <option value="Inter">Canva Sans</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Oswald">Oswald</option>
                  </select>

                  <div className={styles.toolGroup} style={{ background: 'transparent' }}>
                    <button className={styles.toolBtn} onClick={(e) => {
                      e.stopPropagation();
                      const scale = 0.95;
                      const newWidth = activeEl.width * scale;
                      const newHeight = activeEl.height * scale;
                      updateElement(activeEl.id, { 
                        width: newWidth, 
                        height: newHeight,
                        x: activeEl.x + (activeEl.width - newWidth) / 2,
                        y: activeEl.y + (activeEl.height - newHeight) / 2
                      });
                    }}>-</button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '30px', textAlign: 'center' }}>
                      {Math.round(Math.min(activeEl.width / (Math.max(1, ...activeEl.value.split('\n').map(l => l.length)) * 0.6 + 1), (activeEl.height / Math.max(1, activeEl.value.split('\n').length)) * 0.8))}
                    </span>
                    <button className={styles.toolBtn} onClick={(e) => {
                      e.stopPropagation();
                      const scale = 1.05;
                      const newWidth = activeEl.width * scale;
                      const newHeight = activeEl.height * scale;
                      updateElement(activeEl.id, { 
                        width: newWidth, 
                        height: newHeight,
                        x: activeEl.x - (newWidth - activeEl.width) / 2,
                        y: activeEl.y - (newHeight - activeEl.height) / 2
                      });
                    }}>+</button>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.toolGroup}>
                    <input type="color" className={styles.toolColor} value={activeEl.color || "#000000"} onChange={(e) => updateElement(activeEl.id, { color: e.target.value })} />
                  </div>
                  
                  <div className={styles.toolGroup}>
                    <button className={`${styles.toolBtn} ${activeEl.fontWeight === "bold" ? styles.toolBtnActive : ""}`} onClick={() => updateElement(activeEl.id, { fontWeight: activeEl.fontWeight === "bold" ? "normal" : "bold" })}><Bold size={16} /></button>
                    <button className={`${styles.toolBtn} ${activeEl.fontStyle === "italic" ? styles.toolBtnActive : ""}`} onClick={() => updateElement(activeEl.id, { fontStyle: activeEl.fontStyle === "italic" ? "normal" : "italic" })}><Italic size={16} /></button>
                    <button className={`${styles.toolBtn} ${activeEl.textDecoration === "underline" ? styles.toolBtnActive : ""}`} onClick={() => updateElement(activeEl.id, { textDecoration: activeEl.textDecoration === "underline" ? "none" : "underline" })}><Underline size={16} /></button>
                    <button className={`${styles.toolBtn} ${activeEl.uppercase ? styles.toolBtnActive : ""}`} onClick={() => updateElement(activeEl.id, { uppercase: !activeEl.uppercase })}><Type size={16} /></button>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.toolGroup}>
                    <button 
                      className={`${styles.toolBtn} ${activeEl.textAlign ? styles.toolBtnActive : ""}`} 
                      onClick={() => {
                        const nextAlign = { "left": "center", "center": "right", "right": "justify", "justify": "left" }[activeEl.textAlign || "center"] as "left" | "center" | "right" | "justify";
                        updateElement(activeEl.id, { textAlign: nextAlign });
                      }}
                      title="Align Text"
                    >
                      {activeEl.textAlign === "left" && <AlignLeft size={16} />}
                      {activeEl.textAlign === "center" && <AlignCenter size={16} />}
                      {activeEl.textAlign === "right" && <AlignRight size={16} />}
                      {(activeEl.textAlign === "justify" || !activeEl.textAlign) && <AlignLeft size={16} />}
                    </button>
                  </div>
                  
                  <div className={styles.divider}></div>
                </>
              )}
              
              <button className={`${styles.toolBtn} ${styles.toolBtnDanger}`} onClick={(e) => removeElement(activeEl.id, e)} title="Delete Element"><Trash2 size={16} /></button>
            </div>
          )}

          {/* Draggable Elements */}
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
              onDragStop={(_, d) => updateElement(el.id, { x: d.x, y: d.y })}
              onResizeStop={(_, __, ref, ___, pos) => updateElement(el.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
              disableDragging={!isActive || isPreviewMode}
              enableResizing={isActive && !isPreviewMode}
              resizeHandleClasses={{
                top: "react-resizable-handle-n",
                right: "react-resizable-handle-e",
                bottom: "react-resizable-handle-s",
                left: "react-resizable-handle-w",
                topRight: "react-resizable-handle-ne",
                bottomRight: "react-resizable-handle-se",
                bottomLeft: "react-resizable-handle-sw",
                topLeft: "react-resizable-handle-nw",
              }}
            >
              <div className={styles.rndContent} style={{ transform: `rotate(${el.rotation || 0}deg)`, transition: 'transform 0.2s ease', width: '100%', height: '100%' }} onClick={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                {el.type === "text" ? (
                  <textarea
                    className={`${styles.rndText} customizer-drag-handle`}
                    value={el.value}
                    spellCheck={false}
                    onChange={(e) => updateElement(el.id, { value: e.target.value })}
                    onBlur={() => {
                      if (el.value.trim() === "") {
                        removeElement(el.id);
                      }
                    }}
                    style={{
                      color: el.color,
                      fontSize: `${Math.min(el.width / (Math.max(1, ...el.value.split('\n').map(l => l.length)) * 0.6 + 1), (el.height / Math.max(1, el.value.split('\n').length)) * 0.8)}px`,
                      fontFamily: el.fontFamily || "Inter",
                      fontWeight: el.fontWeight || "normal",
                      fontStyle: el.fontStyle || "normal",
                      textAlign: el.textAlign || "center",
                      textDecoration: el.textDecoration || "none",
                      textTransform: el.uppercase ? "uppercase" : "none",
                      letterSpacing: `${el.letterSpacing || 0}px`,
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  />
                ) : (
                  <img src={el.value} alt="logo" draggable={false} className="customizer-drag-handle" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: isActive ? "auto" : "none" }} />
                )}
              </div>
              
              {/* Canva floating buttons below active element */}
              {isActive && (
                <div className={styles.floatingActionBtns}>
                  <div className={styles.circleActionBtn} onClick={(e) => { e.stopPropagation(); updateElement(el.id, { rotation: ((el.rotation || 0) + 90) % 360 }); }} title="Rotate 90°"><RotateCw size={14} /></div>
                  <div className={`${styles.circleActionBtn} customizer-drag-handle`} title="Move"><Move size={14} /></div>
                </div>
              )}
            </Rnd>
            );
          })}
        </div>
      </div>
    </div>
  );
}
