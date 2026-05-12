"use client";
import React from "react";
import { Type, UploadCloud, Palette, X } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { COLOR_PRESETS } from "@/lib/fabric-data";

type ActiveTool = "Text" | "Uploads" | "Elements" | "Colors" | null;

interface ToolPanelProps {
  activeTool: ActiveTool;
  bodyColor: string;
  isUploading: boolean;
  onToolSelect: (tool: ActiveTool) => void;
  onColorSelect: (color: string) => void;
  onAddText: () => void;
  onUploadClick: () => void;
  availableColors?: string[];
}

export default function ToolPanel({
  activeTool,
  bodyColor,
  isUploading,
  onToolSelect,
  onColorSelect,
  onAddText,
  onUploadClick,
  availableColors,
}: ToolPanelProps) {
  return (
    <>
      <div className={styles.leftSidebar}>
        <button 
          className={`${styles.sidebarToolBtn} ${activeTool === "Text" ? styles.sidebarToolActive : ""}`}
          onClick={() => onToolSelect("Text")}
        >
          <Type size={24} className={styles.sidebarToolIcon} />
          <span className={styles.sidebarToolLabel}>Text</span>
        </button>
        
        <button 
          className={`${styles.sidebarToolBtn} ${activeTool === "Uploads" ? styles.sidebarToolActive : ""}`}
          onClick={() => onToolSelect("Uploads")}
        >
          <UploadCloud size={24} className={styles.sidebarToolIcon} />
          <span className={styles.sidebarToolLabel}>Uploads</span>
        </button>

        <button 
          className={`${styles.sidebarToolBtn} ${activeTool === "Colors" ? styles.sidebarToolActive : ""}`}
          onClick={() => onToolSelect("Colors")}
        >
          <Palette size={24} className={styles.sidebarToolIcon} />
          <span className={styles.sidebarToolLabel}>Colors</span>
        </button>



      </div>

      {activeTool && (
        <div className={styles.contextPanel}>
          <div className={styles.contextHeader}>
            <div className={styles.contextTitle}>
              {activeTool === "Text" && "Add text to your design"}
              {activeTool === "Uploads" && "Upload assets"}
              {activeTool === "Colors" && "Change Garment Color"}
            </div>
            <button className={styles.closeContextBtn} onClick={() => onToolSelect(null)}>
              <X size={20} />
            </button>
          </div>
          
          <div className={styles.contextBody}>
            {activeTool === "Text" && (
              <button className={styles.addAssetBtn} onClick={onAddText}>
                <Type size={18} /> Add a text box
              </button>
            )}

            {activeTool === "Uploads" && (
              <button className={styles.addAssetBtn} onClick={onUploadClick} disabled={isUploading}>
                {isUploading ? "Uploading..." : <><UploadCloud size={18} /> Upload Image</>}
              </button>
            )}

            {activeTool === "Colors" && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {(availableColors?.map(hex => ({ hex, name: hex })) || COLOR_PRESETS).map((p) => (
                  <button
                    key={p.hex}
                    onClick={() => onColorSelect(p.hex)}
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
    </>
  );
}
