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
      colors = ["#1E3A5F", "#DC2626", "#2563EB"]; // Denim (Navy), Red, Royal
    } else {
      colors = ["#FFFFFF", "#DC2626", "#2563EB", "#7F1D1D"]; // White, Red, Royal, Maroon
    }
  }
  // Special Check 2: Magic Dryfly / Softee
  else if (lowerName.includes("dryfly") || lowerName.includes("softee")) {
    colors = ["#111111", "#FFFFFF", "#9CA3AF", "#1E3A5F"]; // Black, White, Grey Melange, Navy
  }
  // Special Check 3: Sports and Dryplay models (usually 10-11 options)
  else if (lowerName.includes("dryplay") || lowerName.includes("sports") || lowerName.includes("seeker")) {
    colors = ["#111111", "#FFFFFF", "#1E3A5F", "#2563EB", "#38BDF8", "#16A34A", "#4D7C0F", "#DC2626", "#D97706", "#9CA3AF"];
  }
  // Special Check 4: Premium Crewnecks / PIMA Cotton items (typically 5, 10 or 12 options)
  else if (lowerName.includes("pima") || lowerName.includes("crewneck") || lowerName.includes("hoodie") || lowerName.includes("jacket") || lowerName.includes("bio")) {
    const count = colorsCount || 10;
    const allBioColors = [
      "#111111", // Jet Black
      "#FFFFFF", // White
      "#1E3A5F", // Navy
      "#4D7C0F", // Olive
      "#7F1D1D", // Maroon
      "#2563EB", // Royal Blue
      "#16A34A", // Forest Green
      "#9CA3AF", // Grey Melange
      "#DC2626", // Independence Red
      "#D97706", // Gold
      "#004b6b", // Turba Blue
      "#38BDF8", // Sky Blue
    ];

    if (count <= 4) {
      colors = ["#111111", "#FFFFFF", "#1E3A5F", "#9CA3AF"];
    } else if (count === 5) {
      colors = ["#111111", "#FFFFFF", "#1E3A5F", "#7F1D1D", "#9CA3AF"];
    } else if (count === 6) {
      colors = ["#111111", "#FFFFFF", "#1E3A5F", "#7F1D1D", "#9CA3AF", "#4D7C0F"];
    } else if (count === 7) {
      colors = ["#111111", "#FFFFFF", "#1E3A5F", "#7F1D1D", "#9CA3AF", "#4D7C0F", "#16A34A"];
    } else {
      colors = allBioColors.slice(0, Math.min(count, allBioColors.length));
    }
  }
  // Fallback to a standard list matched to colorsCount
  else {
    const defaultColors = [
      "#111111", // Black
      "#FFFFFF", // White
      "#1E3A5F", // Navy
      "#9CA3AF", // Grey
      "#4D7C0F", // Olive
      "#7F1D1D", // Maroon
      "#2563EB", // Royal
      "#DC2626", // Red
    ];
    colors = defaultColors;
  }

  // Ensure colors array respects the colorsCount if provided
  if (colorsCount && colorsCount > 0) {
    return colors.slice(0, colorsCount);
  }
  return colors.length > 0 ? colors : ["#111111", "#FFFFFF", "#1E3A5F", "#9CA3AF"];
}
