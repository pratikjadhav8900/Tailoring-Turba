"use client";
import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import styles from "../PoloCustomizer.module.css";

interface ElementDef {
  id: string;
  name: string;
  category: string;
  tags: string[];
  svg: string;
}

const ELEMENT_CATEGORIES = [
  { key: "All", icon: "🔲", label: "All" },
  { key: "Shapes", icon: "◆", label: "Shapes" },
  { key: "Badges", icon: "🛡️", label: "Badges" },
  { key: "Numbers", icon: "#", label: "Numbers" },
  { key: "Icons", icon: "★", label: "Icons" },
  { key: "Lines", icon: "—", label: "Lines" },
  { key: "Banners", icon: "🎗️", label: "Banners" },
];

const BUILT_IN_ELEMENTS: ElementDef[] = [
  { id: "el-circle", name: "Circle", category: "Shapes", tags: ["circle", "round", "shape", "ring", "dot", "disc"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="currentColor"/></svg>` },
  { id: "el-square", name: "Square", category: "Shapes", tags: ["square", "box", "rect", "shape", "block"], svg: `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="currentColor"/></svg>` },
  { id: "el-triangle", name: "Triangle", category: "Shapes", tags: ["triangle", "delta", "pyramid", "arrow", "shape"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill="currentColor"/></svg>` },
  { id: "el-diamond", name: "Diamond", category: "Shapes", tags: ["diamond", "rhombus", "gem", "shape"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,2 98,50 50,98 2,50" fill="currentColor"/></svg>` },
  { id: "el-hexagon", name: "Hexagon", category: "Shapes", tags: ["hexagon", "polygon", "honeycomb", "shape"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,2 93,25 93,75 50,98 7,75 7,25" fill="currentColor"/></svg>` },
  { id: "el-star", name: "Star", category: "Shapes", tags: ["star", "favorite", "rank", "winner", "award", "shape", "rating"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,2 61,38 98,38 68,60 79,96 50,74 21,96 32,60 2,38 39,38" fill="currentColor"/></svg>` },
  { id: "el-rounded-rect", name: "Rounded Rect", category: "Shapes", tags: ["rounded", "rect", "card", "pill", "shape"], svg: `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="16" fill="currentColor"/></svg>` },
  { id: "el-ring", name: "Ring", category: "Shapes", tags: ["ring", "circle", "outline", "border", "loop"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8"/></svg>` },

  { id: "el-shield", name: "Shield", category: "Badges", tags: ["shield", "badge", "security", "crest", "guard", "sports", "team", "football", "club"], svg: `<svg viewBox="0 0 100 120"><path d="M50 5 L95 25 L95 65 Q95 105 50 115 Q5 105 5 65 L5 25 Z" fill="currentColor"/></svg>` },
  { id: "el-badge-circle", name: "Circle Badge", category: "Badges", tags: ["badge", "circle", "round", "seal", "stamp", "vintage", "logo"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>` },
  { id: "el-crest", name: "Crest", category: "Badges", tags: ["crest", "badge", "shield", "heraldry", "royal", "team", "club", "sports"], svg: `<svg viewBox="0 0 100 120"><path d="M50 5 L90 20 L90 70 Q90 110 50 115 Q10 110 10 70 L10 20 Z" fill="none" stroke="currentColor" stroke-width="4"/><line x1="10" y1="45" x2="90" y2="45" stroke="currentColor" stroke-width="2"/></svg>` },
  { id: "el-emblem", name: "Emblem", category: "Badges", tags: ["emblem", "badge", "star", "vintage", "patch", "military", "sports"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"/><polygon points="50,15 58,38 82,38 63,52 70,75 50,62 30,75 37,52 18,38 42,38" fill="currentColor"/></svg>` },

  { id: "el-num-0", name: "0", category: "Numbers", tags: ["number", "0", "zero", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">0</text></svg>` },
  { id: "el-num-1", name: "1", category: "Numbers", tags: ["number", "1", "one", "jersey", "sports", "digit", "first"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">1</text></svg>` },
  { id: "el-num-2", name: "2", category: "Numbers", tags: ["number", "2", "two", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">2</text></svg>` },
  { id: "el-num-3", name: "3", category: "Numbers", tags: ["number", "3", "three", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">3</text></svg>` },
  { id: "el-num-4", name: "4", category: "Numbers", tags: ["number", "4", "four", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">4</text></svg>` },
  { id: "el-num-5", name: "5", category: "Numbers", tags: ["number", "5", "five", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">5</text></svg>` },
  { id: "el-num-6", name: "6", category: "Numbers", tags: ["number", "6", "six", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">6</text></svg>` },
  { id: "el-num-7", name: "7", category: "Numbers", tags: ["number", "7", "seven", "jersey", "sports", "digit", "lucky"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">7</text></svg>` },
  { id: "el-num-8", name: "8", category: "Numbers", tags: ["number", "8", "eight", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">8</text></svg>` },
  { id: "el-num-9", name: "9", category: "Numbers", tags: ["number", "9", "nine", "jersey", "sports", "digit"], svg: `<svg viewBox="0 0 60 80"><text x="50%" y="72" text-anchor="middle" font-family="Impact" font-size="72" fill="currentColor">9</text></svg>` },

  { id: "el-star-icon", name: "Star Icon", category: "Icons", tags: ["star", "icon", "sparkle", "award", "rank", "sports", "rating"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,5 61,38 98,38 68,60 79,96 50,74 21,96 32,60 2,38 39,38" fill="currentColor"/></svg>` },
  { id: "el-heart", name: "Heart", category: "Icons", tags: ["heart", "love", "like", "favorite", "valentine", "care"], svg: `<svg viewBox="0 0 100 100"><path d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C40 5 47 12 50 18 C53 12 60 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z" fill="currentColor"/></svg>` },
  { id: "el-lightning", name: "Lightning", category: "Icons", tags: ["lightning", "bolt", "thunder", "power", "energy", "flash", "electric", "fast", "speed", "sports"], svg: `<svg viewBox="0 0 100 100"><polygon points="60,2 25,55 48,55 40,98 75,45 52,45" fill="currentColor"/></svg>` },
  { id: "el-crown", name: "Crown", category: "Icons", tags: ["crown", "king", "queen", "royal", "luxury", "champion", "winner", "vip", "gold"], svg: `<svg viewBox="0 0 100 80"><polygon points="5,65 15,20 30,40 50,10 70,40 85,20 95,65" fill="currentColor"/><rect x="5" y="65" width="90" height="10" rx="2" fill="currentColor"/></svg>` },
  { id: "el-flame", name: "Flame", category: "Icons", tags: ["flame", "fire", "hot", "burn", "heat", "energy", "beast", "streetwear", "gym"], svg: `<svg viewBox="0 0 80 100"><path d="M40 2 C55 25 70 35 70 55 C70 78 57 95 40 95 C23 95 10 78 10 55 C10 35 25 25 40 2Z M40 60 C32 60 25 68 25 78 C25 88 32 95 40 95 C48 95 55 88 55 78 C55 68 48 60 40 60Z" fill="currentColor"/></svg>` },

  { id: "el-line-h", name: "Line", category: "Lines", tags: ["line", "divider", "separator", "rule", "horizontal", "stripe", "border"], svg: `<svg viewBox="0 0 200 20"><line x1="5" y1="10" x2="195" y2="10" stroke="currentColor" stroke-width="3"/></svg>` },
  { id: "el-line-thick", name: "Thick Line", category: "Lines", tags: ["thick", "line", "bar", "heavy", "divider", "stripe"], svg: `<svg viewBox="0 0 200 20"><line x1="5" y1="10" x2="195" y2="10" stroke="currentColor" stroke-width="6"/></svg>` },
  { id: "el-divider", name: "Divider", category: "Lines", tags: ["divider", "vintage", "decorative", "ornament", "flourish", "dot"], svg: `<svg viewBox="0 0 200 20"><line x1="5" y1="10" x2="80" y2="10" stroke="currentColor" stroke-width="2"/><circle cx="100" cy="10" r="4" fill="currentColor"/><line x1="120" y1="10" x2="195" y2="10" stroke="currentColor" stroke-width="2"/></svg>` },

  { id: "el-ribbon", name: "Ribbon Banner", category: "Banners", tags: ["ribbon", "banner", "scroll", "badge", "vintage", "label", "header"], svg: `<svg viewBox="0 0 200 60"><polygon points="10,15 30,5 30,55 10,45 0,50 0,10" fill="currentColor" opacity="0.7"/><rect x="25" y="10" width="150" height="40" rx="4" fill="currentColor"/><polygon points="190,15 170,5 170,55 190,45 200,50 200,10" fill="currentColor" opacity="0.7"/></svg>` },
  { id: "el-banner-curved", name: "Curved Banner", category: "Banners", tags: ["banner", "curve", "arc", "ribbon", "scroll", "label", "vintage"], svg: `<svg viewBox="0 0 200 60"><path d="M5 30 Q100 0 195 30 Q100 60 5 30Z" fill="currentColor"/></svg>` },
];

interface ElementsPanelProps {
  onAddElement: (element: { svg: string; name: string; color?: string }) => void;
}

export default function ElementsPanel({ onAddElement }: ElementsPanelProps) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [tintColor, setTintColor] = useState("#111111");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BUILT_IN_ELEMENTS.filter((el) => {
      if (q) {
        const matchName = el.name.toLowerCase().includes(q);
        const matchCat = el.category.toLowerCase().includes(q);
        const matchTags = el.tags.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()));
        const isSearchMatch = matchName || matchCat || matchTags;
        if (!isSearchMatch) return false;
      }
      if (category !== "All" && el.category !== category) {
        if (!q) return false;
      }
      return true;
    });
  }, [category, search]);

  return (
    <div className={styles.contextBody}>
      <div className={styles.panelSearchWrap}>
        <Search size={14} className={styles.panelSearchIcon} />
        <input
          type="text"
          className={styles.panelSearchInput}
          placeholder="Search elements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.categoryScroll}>
        {ELEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`${styles.categoryChip} ${category === cat.key ? styles.categoryChipActive : ""}`}
            onClick={() => setCategory(cat.key)}
          >
            <span style={{ fontSize: "0.7em" }}>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 0 4px" }}>
        <span className={styles.editSectionLabel}>Tint Color</span>
        <input
          type="color"
          value={tintColor}
          onChange={(e) => setTintColor(e.target.value)}
          style={{ width: "24px", height: "24px", border: "1.5px solid #E2E8F0", borderRadius: "6px", cursor: "pointer", padding: "1px" }}
        />
      </div>

      <div className={styles.elementsGrid}>
        {filtered.map((el) => (
          <button
            key={el.id}
            className={styles.elementCard}
            onClick={() => onAddElement({ svg: el.svg, name: el.name, color: tintColor })}
            title={el.name}
          >
            <div
              className={styles.elementPreview}
              style={{ color: tintColor }}
              dangerouslySetInnerHTML={{ __html: el.svg }}
            />
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p>No elements found.</p>
        </div>
      )}
    </div>
  );
}
