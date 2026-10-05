import { GARMENTS } from "./fabric-data";
import { DesignElement } from "@/types/customizer";

export interface ElementDetails {
  widthInches: number;
  heightInches: number;
  area: number;
  printType: "dtf" | "screen" | "embroidery" | "sublimation";
  printLabel: string;
  cost: number;
  dpi: number | null;
  dpiQuality: "Good" | "Fair" | "Bad" | null;
  embroideryType?: "mono" | "multi";
}

export const SIZE_SCALES = {
  S: 1.111,   // 20" / 18" chest (logo looks larger)
  M: 1.000,   // 20" / 20" chest (baseline)
  L: 0.909,   // 20" / 22" chest (logo looks smaller)
  XL: 0.833,  // 20" / 24" chest
  XXL: 0.769  // 20" / 26" chest
};

export function getElementDetails(
  el: DesignElement,
  garmentType: string,
  activeSide: string,
  previewSize: "S" | "M" | "L" | "XL" | "XXL" = "M"
): ElementDetails {
  const currentGarment = GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"];
  const sidePrintable = (currentGarment.printableArea as any)?.[activeSide] || currentGarment.printableArea;
  const printableWidthPercent = parseFloat(sidePrintable?.width || "40%") / 100;

  const printableWidthPx = 560 * printableWidthPercent;

  const isSleeve = activeSide === "left" || activeSide === "right";
  const physicalWidthInches = isSleeve ? 4 : 12;

  const scale = SIZE_SCALES[previewSize] || 1.0;
  const pxPerInch = (printableWidthPx / physicalWidthInches) * scale;

  const widthInches = Math.round((el.width / pxPerInch) * 100) / 100;
  const heightInches = Math.round((el.height / pxPerInch) * 100) / 100;
  const area = Math.round((widthInches * heightInches) * 100) / 100;

  // Treat sublimation as dtf if it was previously set
  let printType = el.printType || "dtf";
  if (printType === "sublimation") {
    printType = "dtf";
  }

  const size = Math.max(widthInches, heightInches);
  let cost = 40;
  let label = "DTF Printing";
  
  // embroideryType (mono or multi) is used as the color mode selector for ALL print types
  const embroideryType: "mono" | "multi" = el.embroideryType || (el.type === "text" ? "mono" : "multi");
  const isMono = embroideryType === "mono";

  if (printType === "embroidery") {
    if (activeSide === "back") {
      label = "Embroidery (Back)";
      // Back Embroidery: size <= 10 costs 100rs for both mono and multi color
      if (size <= 10) {
        cost = 100;
      } else {
        cost = 100 + (size - 10) * 20; // progressive scale above 10 inches
      }
    } else {
      // Front Embroidery
      if (isMono) {
        label = "Embroidery (Mono Color)";
        if (size <= 4) {
          cost = 40;
        } else {
          cost = 40 + (size - 4) * 15;
        }
      } else {
        label = "Embroidery (Multi Color)";
        if (size <= 4) {
          cost = 55;
        } else {
          cost = 55 + (size - 4) * 15;
        }
      }
    }
  } else if (printType === "screen") {
    label = isMono ? "Screen Printing (Mono Color)" : "Screen Printing (Colorful)";
    if (activeSide === "back") {
      // Back Screen Printing: Horizontal is 60rs, Vertical is 75rs
      const isHorizontal = widthInches > heightInches;
      if (isHorizontal) {
        if (size <= 10) {
          cost = 60;
        } else {
          cost = 60 + (size - 10) * 12;
        }
      } else {
        if (size <= 10) {
          cost = 75;
        } else {
          cost = 75 + (size - 10) * 15;
        }
      }
    } else {
      // Front Screen Printing: Mono 35rs, Colorful 40rs
      if (size <= 4) {
        cost = isMono ? 35 : 40;
      } else {
        cost = (isMono ? 35 : 40) + (size - 4) * 10;
      }
    }
  } else {
    // DTF Printing
    label = isMono ? "DTF Printing (Mono Color)" : "DTF Printing (Colorful)";
    if (activeSide === "back") {
      // Back DTF Printing: Horizontal is 60rs, Vertical is 75rs
      const isHorizontal = widthInches > heightInches;
      if (isHorizontal) {
        if (size <= 10) {
          cost = 60;
        } else {
          cost = 60 + (size - 10) * 12;
        }
      } else {
        if (size <= 10) {
          cost = 75;
        } else {
          cost = 75 + (size - 10) * 15;
        }
      }
    } else {
      // Front DTF Printing: Mono 35rs, Colorful 40rs
      if (size <= 4) {
        cost = isMono ? 35 : 40;
      } else {
        cost = (isMono ? 35 : 40) + (size - 4) * 10;
      }
    }
  }

  // Cost rounded to nearest integer
  cost = Math.round(cost);

  // Calculate DPI if it is a logo and has original dimensions
  let dpi: number | null = null;
  let dpiQuality: "Good" | "Fair" | "Bad" | null = null;

  if (el.type === "logo" && el.originalWidth) {
    dpi = Math.round(el.originalWidth / widthInches);
    if (dpi >= 300) {
      dpiQuality = "Good";
    } else if (dpi >= 150) {
      dpiQuality = "Fair";
    } else {
      dpiQuality = "Bad";
    }
  }

  return {
    widthInches: Math.round(widthInches * 100) / 100,
    heightInches: Math.round(heightInches * 100) / 100,
    area: Math.round(area * 100) / 100,
    printType,
    printLabel: label,
    cost,
    dpi,
    dpiQuality,
    embroideryType,
  };
}

export function getPrintableAreaDimensionsPx(
  garmentType: string,
  activeSide: string
) {
  const currentGarment = GARMENTS[garmentType as keyof typeof GARMENTS] || GARMENTS["round-neck"];
  const sidePrintable = (currentGarment.printableArea as any)?.[activeSide] || currentGarment.printableArea;
  const printableWidthPercent = parseFloat(sidePrintable?.width || "40%") / 100;
  const printableHeightPercent = parseFloat(sidePrintable?.height || "50%") / 100;

  return {
    widthPx: 560 * printableWidthPercent,
    heightPx: 560 * printableHeightPercent,
  };
}

export function getProductColors(
  name: string = "",
  description: string = "",
  features: string[] = [],
  colorsCount?: number | null
): string[] {
  const lowerName = name.toLowerCase();
  const lowerDesc = (description || "").toLowerCase();
  const featuresText = (features || []).join(" ").toLowerCase();

  let colors: string[] = [];

  // Special Check 1: AWG Label Green / Solid Polo
  if (lowerName.includes("label green") || lowerName.includes("label solid")) {
    if (lowerName.includes("solid")) {
      colors = ["#142D4D", "#C72020", "#1A4BB8"];
    } else {
      colors = ["#FFFFFF", "#C72020", "#1A4BB8", "#5B141D"];
    }
  }
  // Special Check 2: Magic Dryfly / Softee
  else if (lowerName.includes("dryfly") || lowerName.includes("softee")) {
    colors = ["#0A0A0A", "#FFFFFF", "#A0A7B0", "#142D4D"];
  }
  // Special Check 3: Sports and Dryplay models (usually 10-11 options)
  else if (lowerName.includes("dryplay") || lowerName.includes("sports") || lowerName.includes("seeker")) {
    colors = ["#0A0A0A", "#FFFFFF", "#142D4D", "#1A4BB8", "#38BDF8", "#137A3B", "#3D6510", "#C72020", "#C27506", "#A0A7B0"];
  }
  // Special Check 4: Premium Crewnecks / PIMA Cotton items (typically 5, 10 or 12 options)
  else if (lowerName.includes("pima") || lowerName.includes("crewneck") || lowerName.includes("hoodie") || lowerName.includes("jacket") || lowerName.includes("bio")) {
    const count = colorsCount || 10;
    const allBioColors = [
      "#0A0A0A", // Jet Black
      "#FFFFFF", // White
      "#142D4D", // Navy
      "#3D6510", // Olive
      "#5B141D", // Maroon
      "#1A4BB8", // Royal Blue
      "#137A3B", // Forest Green
      "#A0A7B0", // Grey Melange
      "#C72020", // Independence Red
      "#C27506", // Gold
      "#004b6b", // Turba Blue
      "#38BDF8", // Sky Blue
    ];

    if (count <= 4) {
      colors = ["#0A0A0A", "#FFFFFF", "#142D4D", "#A0A7B0"];
    } else if (count === 5) {
      colors = ["#0A0A0A", "#FFFFFF", "#142D4D", "#5B141D", "#A0A7B0"];
    } else if (count === 6) {
      colors = ["#0A0A0A", "#FFFFFF", "#142D4D", "#5B141D", "#A0A7B0", "#3D6510"];
    } else if (count === 7) {
      colors = ["#0A0A0A", "#FFFFFF", "#142D4D", "#5B141D", "#A0A7B0", "#3D6510", "#137A3B"];
    } else {
      colors = allBioColors.slice(0, Math.min(count, allBioColors.length));
    }
  }
  // Fallback to a standard list matched to colorsCount
  else {
    const defaultColors = [
      "#0A0A0A", // Black
      "#FFFFFF", // White
      "#142D4D", // Navy
      "#A0A7B0", // Grey
      "#3D6510", // Olive
      "#5B141D", // Maroon
      "#1A4BB8", // Royal
      "#C72020", // Red
    ];
    colors = defaultColors;
  }

  // Ensure colors array respects the colorsCount if provided
  if (colorsCount && colorsCount > 0) {
    return colors.slice(0, colorsCount);
  }
  return colors.length > 0 ? colors : ["#0A0A0A", "#FFFFFF", "#142D4D", "#A0A7B0"];
}

export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex.trim());
}

export function normalizeHex(hex: string): string {
  if (!hex || typeof hex !== 'string') return "#000000";
  let clean = hex.trim();
  if (!clean.startsWith("#")) {
    clean = `#${clean}`;
  }
  if (/^#[A-Fa-f0-9]{3}$/.test(clean)) {
    clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean.toUpperCase();
}

export const COLOR_NAME_PALETTE: { hex: string; name: string; r: number; g: number; b: number }[] = [
  { hex: "#000000", name: "Black", r: 0, g: 0, b: 0 },
  { hex: "#0A0A0A", name: "Jet Black", r: 10, g: 10, b: 10 },
  { hex: "#111111", name: "Jet Black", r: 17, g: 17, b: 17 },
  { hex: "#1F2937", name: "Charcoal", r: 31, g: 41, b: 55 },
  { hex: "#374151", name: "Anthracite", r: 55, g: 65, b: 81 },
  { hex: "#4B5563", name: "Dark Grey", r: 75, g: 85, b: 99 },
  { hex: "#6B7280", name: "Slate Grey", r: 107, g: 114, b: 128 },
  { hex: "#A0A7B0", name: "Grey Melange", r: 160, g: 167, b: 176 },
  { hex: "#9CA3AF", name: "Grey Melange", r: 156, g: 163, b: 175 },
  { hex: "#D1D5DB", name: "Heather Grey", r: 209, g: 213, b: 219 },
  { hex: "#F3F4F6", name: "Off White", r: 243, g: 244, b: 246 },
  { hex: "#FFFFFF", name: "White", r: 255, g: 255, b: 255 },
  { hex: "#F5F5DC", name: "Beige", r: 245, g: 245, b: 220 },
  { hex: "#E5DCC3", name: "Cream", r: 229, g: 220, b: 195 },
  { hex: "#D2B48C", name: "Tan", r: 210, g: 180, b: 140 },
  { hex: "#C2A649", name: "Khaki", r: 194, g: 166, b: 73 },
  { hex: "#8B4513", name: "Brown", r: 139, g: 69, b: 19 },
  { hex: "#5C3A21", name: "Dark Brown", r: 92, g: 58, b: 33 },
  { hex: "#78350F", name: "Chocolate", r: 120, g: 53, b: 15 },
  { hex: "#000080", name: "Navy Blue", r: 0, g: 0, b: 128 },
  { hex: "#142D4D", name: "Navy", r: 20, g: 45, b: 77 },
  { hex: "#172A46", name: "Navy Blue", r: 23, g: 42, b: 70 },
  { hex: "#1E3A5F", name: "Navy", r: 30, g: 58, b: 95 },
  { hex: "#004B6B", name: "Turba Blue", r: 0, g: 75, b: 107 },
  { hex: "#1E40AF", name: "Dark Blue", r: 30, g: 64, b: 175 },
  { hex: "#1A4BB8", name: "Royal Blue", r: 26, g: 75, b: 184 },
  { hex: "#2563EB", name: "Royal Blue", r: 37, g: 99, b: 235 },
  { hex: "#3B82F6", name: "Cobalt Blue", r: 59, g: 130, b: 246 },
  { hex: "#38BDF8", name: "Sky Blue", r: 56, g: 189, b: 248 },
  { hex: "#0284C7", name: "Ocean Blue", r: 2, g: 132, b: 199 },
  { hex: "#BAE6FD", name: "Light Blue", r: 186, g: 230, b: 253 },
  { hex: "#0D9488", name: "Teal", r: 13, g: 148, b: 136 },
  { hex: "#06B6D4", name: "Cyan", r: 6, g: 182, b: 212 },
  { hex: "#137A3B", name: "Forest Green", r: 19, g: 122, b: 59 },
  { hex: "#16A34A", name: "Forest Green", r: 22, g: 163, b: 74 },
  { hex: "#15803D", name: "Dark Green", r: 21, g: 128, b: 61 },
  { hex: "#14532D", name: "Bottle Green", r: 20, g: 83, b: 45 },
  { hex: "#22C55E", name: "Kelly Green", r: 34, g: 197, b: 94 },
  { hex: "#3D6510", name: "Olive", r: 61, g: 101, b: 16 },
  { hex: "#4D7C0F", name: "Olive", r: 77, g: 124, b: 15 },
  { hex: "#65A30D", name: "Lime Green", r: 101, g: 163, b: 13 },
  { hex: "#84CC16", name: "Sage Green", r: 132, g: 204, b: 22 },
  { hex: "#5B141D", name: "Maroon", r: 91, g: 20, b: 29 },
  { hex: "#800000", name: "Maroon", r: 128, g: 0, b: 0 },
  { hex: "#7A1F2B", name: "Maroon", r: 122, g: 31, b: 43 },
  { hex: "#7F1D1D", name: "Maroon", r: 127, g: 29, b: 29 },
  { hex: "#991B1B", name: "Burgundy", r: 153, g: 27, b: 27 },
  { hex: "#831843", name: "Wine", r: 131, g: 24, b: 67 },
  { hex: "#C72020", name: "Independence Red", r: 199, g: 32, b: 32 },
  { hex: "#DC2626", name: "Independence Red", r: 220, g: 38, b: 38 },
  { hex: "#EF4444", name: "Red", r: 239, g: 68, b: 68 },
  { hex: "#B91C1C", name: "Crimson", r: 185, g: 28, b: 28 },
  { hex: "#EA580C", name: "Rust Orange", r: 234, g: 88, b: 12 },
  { hex: "#C2410C", name: "Rust", r: 194, g: 65, b: 12 },
  { hex: "#F97316", name: "Orange", r: 249, g: 115, b: 22 },
  { hex: "#C27506", name: "Gold", r: 194, g: 117, b: 6 },
  { hex: "#D97706", name: "Gold", r: 217, g: 119, b: 6 },
  { hex: "#F59E0B", name: "Mustard", r: 245, g: 158, b: 11 },
  { hex: "#EAB308", name: "Yellow", r: 234, g: 179, b: 8 },
  { hex: "#FDE047", name: "Lemon Yellow", r: 253, g: 224, b: 71 },
  { hex: "#7C3AED", name: "Purple", r: 124, g: 58, b: 237 },
  { hex: "#6D28D9", name: "Deep Violet", r: 109, g: 40, b: 217 },
  { hex: "#581C87", name: "Dark Purple", r: 88, g: 28, b: 135 },
  { hex: "#A855F7", name: "Lavender", r: 168, g: 85, b: 247 },
  { hex: "#C084FC", name: "Lilac", r: 192, g: 132, b: 252 },
  { hex: "#DB2777", name: "Pink", r: 219, g: 39, b: 119 },
  { hex: "#E11D48", name: "Rose", r: 225, g: 29, b: 72 },
  { hex: "#FDA4AF", name: "Baby Pink", r: 253, g: 164, b: 175 },
  { hex: "#FB7185", name: "Coral", r: 251, g: 113, b: 133 },
  { hex: "#F43F5E", name: "Salmon", r: 244, g: 63, b: 94 }
];

export const COLOR_NAME_MAP: Record<string, string> = Object.fromEntries(
  COLOR_NAME_PALETTE.map(c => [c.hex, c.name])
);

export function suggestColorName(hex: string): string {
  if (!isValidHex(hex)) return "Custom Color";
  const normalized = normalizeHex(hex);
  
  if (COLOR_NAME_MAP[normalized]) {
    return COLOR_NAME_MAP[normalized];
  }

  const r = parseInt(normalized.substring(1, 3), 16) || 0;
  const g = parseInt(normalized.substring(3, 5), 16) || 0;
  const b = parseInt(normalized.substring(5, 7), 16) || 0;

  let closestName = "Custom Color";
  let minDistance = Infinity;

  for (const item of COLOR_NAME_PALETTE) {
    const dr = r - item.r;
    const dg = g - item.g;
    const db = b - item.b;
    // Standard weighted RGB Euclidean distance for human perception
    const dist = (dr * dr * 0.3) + (dg * dg * 0.59) + (db * db * 0.11);
    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }

  return closestName;
}

export function getColorName(hex: string): string {
  if (!hex || hex === "transparent") return "White";
  if (COLOR_NAME_MAP[hex.toUpperCase()]) return COLOR_NAME_MAP[hex.toUpperCase()];
  if (isValidHex(hex)) return suggestColorName(hex);
  return hex;
}

export interface StructuredProductColor {
  name: string;
  value: string;
  hex: string;
  imageUrls: string[];
  image: string;
  imageUrl?: string;
}

export function getProductStructuredColors(product: any): StructuredProductColor[] {
  if (!product) return [];
  
  // If product has colorsJson already structured
  if (product.colorsJson) {
    let parsedColors = product.colorsJson;
    if (typeof parsedColors === 'string') {
      try {
        parsedColors = JSON.parse(parsedColors);
      } catch (e) {
        console.error("Failed to parse colorsJson string:", e);
        parsedColors = null;
      }
    }
    if (Array.isArray(parsedColors) && parsedColors.length > 0) {
      return parsedColors.map((c: any) => {
        const rawHex = String(c.value || c.hex || "").trim();
        const hex = isValidHex(rawHex) ? normalizeHex(rawHex) : rawHex;
        const name = String(c.name || "").trim() || getColorName(hex);
        
        // Extract multiple image URLs with backward compatibility for single image/imageUrl
        let urls: string[] = [];
        if (Array.isArray(c.imageUrls)) {
          urls = c.imageUrls.map((u: any) => String(u || "").trim()).filter(Boolean);
        } else if (c.image || c.imageUrl) {
          const single = String(c.image || c.imageUrl || "").trim();
          if (single) urls = [single];
        }

        // De-duplicate
        urls = Array.from(new Set(urls));

        const primaryImage = urls[0] || "";

        return {
          name,
          value: hex,
          hex,
          imageUrls: urls,
          image: primaryImage,
          imageUrl: primaryImage
        };
      });
    }
  }

  // Fallback to legacy availableColors array of hexes
  if (product.availableColors && Array.isArray(product.availableColors)) {
    return product.availableColors.map((hex: string) => {
      const normalized = isValidHex(hex) ? normalizeHex(hex) : hex;
      return {
        name: getColorName(normalized),
        value: normalized,
        hex: normalized,
        imageUrls: [],
        image: "",
        imageUrl: ""
      };
    });
  }

  // Fallback to product.colors count
  const colorsList = getProductColors(
    product.name || "",
    product.description || "",
    product.features || [],
    product.colors
  );
  if (colorsList && colorsList.length > 0) {
    return colorsList.map((hex: string) => {
      const normalized = isValidHex(hex) ? normalizeHex(hex) : hex;
      return {
        name: getColorName(normalized),
        value: normalized,
        hex: normalized,
        imageUrls: [],
        image: "",
        imageUrl: ""
      };
    });
  }

  return [];
}

