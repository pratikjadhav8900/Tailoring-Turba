"use client";
import React from "react";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Trash2 } from "lucide-react";
import styles from "./PoloCustomizer.module.css";
import { DesignElement } from "@/types/customizer";

interface FormattingToolbarProps {
  activeEl: DesignElement;
  onUpdate: (id: string, updates: Partial<DesignElement>) => void;
  onRemove: (id: string, e?: React.SyntheticEvent) => void;
}

export default function FormattingToolbar({
  activeEl,
  onUpdate,
  onRemove,
}: FormattingToolbarProps) {
  if (activeEl.type !== "text") return null;

  return (
    <div 
      className={styles.formattingToolbarFloating}
      style={{
        position: 'absolute',
        top: `${activeEl.y - 80}px`,
        left: `${activeEl.x + (activeEl.width / 2)}px`,
        transform: 'translateX(-50%)',
        zIndex: 100
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <select 
        className={styles.toolSelect}
        value={activeEl.fontFamily || "Inter"}
        onChange={(e) => onUpdate(activeEl.id, { fontFamily: e.target.value })}
        style={{ width: '120px', fontWeight: 600 }}
      >
        <option value="Inter">Inter</option>
        <option value="Outfit">Outfit</option>
        <option value="Oswald">Oswald</option>
        <option value="Montserrat">Montserrat</option>
        <option value="Playfair Display">Playfair Display</option>
        <option value="Bebas Neue">Bebas Neue</option>
      </select>

      <div className={styles.divider}></div>

      <div className={styles.toolGroup}>
        <input 
          type="color" 
          className={styles.toolColor} 
          value={activeEl.color || "#000000"} 
          onChange={(e) => onUpdate(activeEl.id, { color: e.target.value })} 
        />
      </div>
      
      <div className={styles.toolGroup}>
        <button className={`${styles.toolBtn} ${activeEl.fontWeight === "bold" ? styles.toolBtnActive : ""}`} onClick={() => onUpdate(activeEl.id, { fontWeight: activeEl.fontWeight === "bold" ? "normal" : "bold" })}><Bold size={16} /></button>
        <button className={`${styles.toolBtn} ${activeEl.fontStyle === "italic" ? styles.toolBtnActive : ""}`} onClick={() => onUpdate(activeEl.id, { fontStyle: activeEl.fontStyle === "italic" ? "normal" : "italic" })}><Italic size={16} /></button>
        <button className={`${styles.toolBtn} ${activeEl.textDecoration === "underline" ? styles.toolBtnActive : ""}`} onClick={() => onUpdate(activeEl.id, { textDecoration: activeEl.textDecoration === "underline" ? "none" : "underline" })}><Underline size={16} /></button>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.toolGroup}>
        <button 
          className={`${styles.toolBtn} ${activeEl.textAlign === "center" ? styles.toolBtnActive : ""}`} 
          onClick={() => onUpdate(activeEl.id, { textAlign: "center" })}
        >
          <AlignCenter size={16} />
        </button>
      </div>
      
      <button className={`${styles.toolBtn} ${styles.toolBtnDanger}`} onClick={(e) => onRemove(activeEl.id, e)}><Trash2 size={16} /></button>
    </div>
  );
}
