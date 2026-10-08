"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";
import styles from "../PoloCustomizer.module.css";

interface Template {
  id: string;
  name: string;
  category: string;
  tags: string[];
  thumbnail: string;
  elements: {
    type: "text" | "logo";
    value: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
    fontSize?: number;
    textTransform?: string;
    letterSpacing?: number;
  }[];
}

const TEMPLATE_CATEGORIES = [
  "All",
  "Streetwear",
  "Sports Jersey",
  "Corporate",
  "Typography",
  "Vintage Badge",
  "Minimalist",
  "Anime & Gaming",
  "Gym & Fitness",
];

const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "tpl-street-bold",
    name: "Bold Street",
    category: "Streetwear",
    tags: ["streetwear", "urban", "street", "culture", "skate", "hiphop", "youth", "fashion"],
    thumbnail: "",
    elements: [
      { type: "text", value: "STREET", x: 180, y: 180, width: 200, height: 60, color: "#FFFFFF", fontFamily: "Bebas Neue", fontWeight: "bold", fontSize: 52, textTransform: "uppercase", letterSpacing: 6 },
      { type: "text", value: "CULTURE", x: 180, y: 240, width: 200, height: 40, color: "#EF4444", fontFamily: "Bebas Neue", fontWeight: "bold", fontSize: 36, textTransform: "uppercase", letterSpacing: 12 },
    ],
  },
  {
    id: "tpl-jersey-01",
    name: "Classic Jersey",
    category: "Sports Jersey",
    tags: ["sports", "jersey", "player", "number", "team", "football", "basketball", "cricket", "athletic", "varsity", "college"],
    thumbnail: "",
    elements: [
      { type: "text", value: "07", x: 200, y: 160, width: 160, height: 100, color: "#FFFFFF", fontFamily: "Impact", fontWeight: "bold", fontSize: 88 },
      { type: "text", value: "PLAYER", x: 200, y: 270, width: 160, height: 30, color: "#FFFFFF", fontFamily: "Oswald", fontWeight: "bold", fontSize: 22, textTransform: "uppercase", letterSpacing: 4 },
    ],
  },
  {
    id: "tpl-jersey-varsity",
    name: "Varsity 99",
    category: "Sports Jersey",
    tags: ["sports", "jersey", "varsity", "college", "champions", "number", "team", "athletics", "99"],
    thumbnail: "",
    elements: [
      { type: "text", value: "CHAMPS", x: 180, y: 160, width: 200, height: 30, color: "#F59E0B", fontFamily: "Oswald", fontWeight: "bold", fontSize: 24, textTransform: "uppercase", letterSpacing: 8 },
      { type: "text", value: "99", x: 200, y: 195, width: 160, height: 90, color: "#FFFFFF", fontFamily: "Impact", fontWeight: "bold", fontSize: 84 },
      { type: "text", value: "DIVISION ONE", x: 180, y: 285, width: 200, height: 25, color: "#94A3B8", fontFamily: "Montserrat", fontSize: 13, textTransform: "uppercase", letterSpacing: 5 },
    ],
  },
  {
    id: "tpl-gym-beast",
    name: "Iron Fitness",
    category: "Gym & Fitness",
    tags: ["gym", "fitness", "workout", "bodybuilding", "iron", "muscle", "beast", "power", "heavy", "sports"],
    thumbnail: "",
    elements: [
      { type: "text", value: "IRON", x: 190, y: 180, width: 180, height: 50, color: "#FFFFFF", fontFamily: "Impact", fontWeight: "bold", fontSize: 54, letterSpacing: 4 },
      { type: "text", value: "BARBELL CLUB", x: 180, y: 235, width: 200, height: 25, color: "#F59E0B", fontFamily: "Oswald", fontSize: 16, textTransform: "uppercase", letterSpacing: 6 },
      { type: "text", value: "NO PAIN NO GAIN", x: 190, y: 265, width: 180, height: 20, color: "#64748B", fontFamily: "Montserrat", fontSize: 11, letterSpacing: 4 },
    ],
  },
  {
    id: "tpl-corp-clean",
    name: "Corporate Clean",
    category: "Corporate",
    tags: ["corporate", "company", "business", "workwear", "office", "startup", "professional", "minimal"],
    thumbnail: "",
    elements: [
      { type: "text", value: "COMPANY", x: 200, y: 200, width: 160, height: 40, color: "#1E3A5F", fontFamily: "Montserrat", fontWeight: "bold", fontSize: 20, textTransform: "uppercase", letterSpacing: 3 },
      { type: "text", value: "Est. 2024", x: 220, y: 240, width: 120, height: 24, color: "#64748B", fontFamily: "Montserrat", fontSize: 14 },
    ],
  },
  {
    id: "tpl-corp-tech",
    name: "Tech Studio",
    category: "Corporate",
    tags: ["corporate", "tech", "software", "agency", "developer", "studio", "modern", "clean", "startup"],
    thumbnail: "",
    elements: [
      { type: "text", value: "NEXUS", x: 190, y: 190, width: 180, height: 40, color: "#38BDF8", fontFamily: "Montserrat", fontWeight: "bold", fontSize: 28, letterSpacing: 8 },
      { type: "text", value: "LABS & CO.", x: 200, y: 235, width: 160, height: 25, color: "#FFFFFF", fontFamily: "Montserrat", fontSize: 14, letterSpacing: 4 },
    ],
  },
  {
    id: "tpl-typo-stack",
    name: "Stacked Type",
    category: "Typography",
    tags: ["typography", "design", "quote", "creative", "words", "text", "minimalist", "art"],
    thumbnail: "",
    elements: [
      { type: "text", value: "DESIGN", x: 180, y: 180, width: 200, height: 50, color: "#111111", fontFamily: "Bebas Neue", fontWeight: "bold", fontSize: 48, letterSpacing: 8 },
      { type: "text", value: "is thinking", x: 195, y: 228, width: 170, height: 28, color: "#64748B", fontFamily: "Playfair Display", fontSize: 20 },
      { type: "text", value: "made visual", x: 195, y: 258, width: 170, height: 28, color: "#64748B", fontFamily: "Playfair Display", fontSize: 20 },
    ],
  },
  {
    id: "tpl-typo-hustle",
    name: "Stay Relentless",
    category: "Typography",
    tags: ["typography", "quote", "motivation", "hustle", "mindset", "focus", "gym", "streetwear"],
    thumbnail: "",
    elements: [
      { type: "text", value: "STAY", x: 190, y: 180, width: 180, height: 40, color: "#94A3B8", fontFamily: "Oswald", fontWeight: "bold", fontSize: 32, letterSpacing: 6 },
      { type: "text", value: "RELENTLESS", x: 170, y: 220, width: 220, height: 50, color: "#FFFFFF", fontFamily: "Impact", fontWeight: "bold", fontSize: 44, letterSpacing: 3 },
      { type: "text", value: "EVERY SINGLE DAY", x: 180, y: 270, width: 200, height: 20, color: "#EF4444", fontFamily: "Montserrat", fontSize: 11, letterSpacing: 5 },
    ],
  },
  {
    id: "tpl-vintage-badge",
    name: "Vintage Circle",
    category: "Vintage Badge",
    tags: ["vintage", "retro", "badge", "heritage", "classic", "motor", "1984", "distressed", "old school"],
    thumbnail: "",
    elements: [
      { type: "text", value: "ESTABLISHED", x: 195, y: 175, width: 170, height: 20, color: "#C75B39", fontFamily: "Oswald", fontWeight: "bold", fontSize: 12, textTransform: "uppercase", letterSpacing: 6 },
      { type: "text", value: "BRAND", x: 200, y: 200, width: 160, height: 50, color: "#2D5F2E", fontFamily: "Abril Fatface", fontSize: 42 },
      { type: "text", value: "— 2024 —", x: 220, y: 255, width: 120, height: 20, color: "#C75B39", fontFamily: "Oswald", fontSize: 14, letterSpacing: 4 },
    ],
  },
  {
    id: "tpl-minimal-01",
    name: "Minimal Mark",
    category: "Minimalist",
    tags: ["minimalist", "minimal", "initial", "monogram", "luxury", "aesthetic", "simple", "clean", "single letter"],
    thumbnail: "",
    elements: [
      { type: "text", value: "M", x: 260, y: 200, width: 40, height: 60, color: "#111111", fontFamily: "Playfair Display", fontWeight: "bold", fontSize: 48 },
    ],
  },
  {
    id: "tpl-street-neon",
    name: "Neon Drip",
    category: "Streetwear",
    tags: ["streetwear", "neon", "cyber", "glow", "vibes", "rave", "techno", "urban", "acid"],
    thumbnail: "",
    elements: [
      { type: "text", value: "NEON", x: 190, y: 190, width: 180, height: 60, color: "#BEFF00", fontFamily: "Impact", fontWeight: "bold", fontSize: 56, letterSpacing: 4 },
      { type: "text", value: "VIBES ONLY", x: 200, y: 250, width: 160, height: 24, color: "#00E5FF", fontFamily: "Oswald", fontSize: 16, textTransform: "uppercase", letterSpacing: 8 },
    ],
  },
  {
    id: "tpl-anime-arcade",
    name: "Cyber Tokyo",
    category: "Anime & Gaming",
    tags: ["anime", "gaming", "tokyo", "arcade", "cyberpunk", "japan", "manga", "gamer", "pixel"],
    thumbnail: "",
    elements: [
      { type: "text", value: "TOKYO", x: 190, y: 180, width: 180, height: 45, color: "#F43F5E", fontFamily: "Impact", fontWeight: "bold", fontSize: 48, letterSpacing: 6 },
      { type: "text", value: "CYBERPUNK", x: 180, y: 230, width: 200, height: 25, color: "#A855F7", fontFamily: "Bebas Neue", fontSize: 24, letterSpacing: 6 },
      { type: "text", value: "東京・2077", x: 200, y: 260, width: 160, height: 25, color: "#38BDF8", fontFamily: "Montserrat", fontSize: 14, letterSpacing: 4 },
    ],
  },
  {
    id: "tpl-jersey-back",
    name: "Back Number",
    category: "Sports Jersey",
    tags: ["sports", "jersey", "number", "back", "player", "surname", "23", "team", "football", "cricket"],
    thumbnail: "",
    elements: [
      { type: "text", value: "SURNAME", x: 180, y: 160, width: 200, height: 30, color: "#FFFFFF", fontFamily: "Oswald", fontWeight: "bold", fontSize: 24, textTransform: "uppercase", letterSpacing: 6 },
      { type: "text", value: "23", x: 220, y: 200, width: 120, height: 100, color: "#FFFFFF", fontFamily: "Impact", fontWeight: "bold", fontSize: 96 },
    ],
  },
];

interface TemplatesPanelProps {
  onApplyTemplate: (elements: Template["elements"]) => void;
}

export default function TemplatesPanel({ onApplyTemplate }: TemplatesPanelProps) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = BUILT_IN_TEMPLATES.filter((t) => {
    const q = search.trim().toLowerCase();
    
    // If search term is provided, match name, category, tags, and all inner text values
    if (q) {
      const matchName = t.name.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchTags = t.tags.some((tag) => tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase()));
      const matchElements = t.elements.some((el) => el.value.toLowerCase().includes(q));
      
      const isSearchMatch = matchName || matchCat || matchTags || matchElements;
      if (!isSearchMatch) return false;
    }

    // Category pill filter
    if (category !== "All" && t.category !== category) {
      // If user typed a search that specifically matched this template, keep it; otherwise filter by category
      if (!q) return false;
    }

    return true;
  });

  return (
    <div className={styles.contextBody}>
      <div className={styles.panelSearchWrap}>
        <Search size={14} className={styles.panelSearchIcon} />
        <input
          type="text"
          className={styles.panelSearchInput}
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.categoryScroll}>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryChip} ${category === cat ? styles.categoryChipActive : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.templateGrid}>
        {filtered.map((tpl) => (
          <button
            key={tpl.id}
            className={styles.templateCard}
            onClick={() => onApplyTemplate(tpl.elements)}
            title={tpl.name}
          >
            <div className={styles.templatePreview}>
              {tpl.elements.map((el, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${((el.x - 150) / 260) * 100}%`,
                    top: `${((el.y - 150) / 200) * 100}%`,
                    color: el.color || "#111",
                    fontFamily: el.fontFamily || "Inter",
                    fontWeight: el.fontWeight || "normal",
                    fontSize: `${(el.fontSize || 24) * 0.35}px`,
                    textTransform: (el.textTransform as any) || "none",
                    letterSpacing: el.letterSpacing ? `${el.letterSpacing * 0.35}px` : "normal",
                    whiteSpace: "nowrap",
                    lineHeight: 1.1,
                  }}
                >
                  {el.value}
                </div>
              ))}
            </div>
            <span className={styles.templateName}>{tpl.name}</span>
            <span className={styles.templateCategory}>{tpl.category}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p>No templates found.</p>
          <p style={{ fontSize: "0.75rem" }}>Try a different category or search term.</p>
        </div>
      )}
    </div>
  );
}
