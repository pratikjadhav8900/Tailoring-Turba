/**
 * Centralized eCommerce Product Catalog Taxonomy & Configuration
 * Provides strict typing, hierarchical mappings, and backward-compatible helper utilities.
 */

export const DEPARTMENTS = [
  "Apparel",
  "Corporate Wear",
  "Uniforms",
  "Hospitality",
  "Industrial Wear",
  "Activewear",
  "Accessories"
] as const;

export type DepartmentType = typeof DEPARTMENTS[number];

export const CATEGORIES_BY_DEPARTMENT: Record<string, string[]> = {
  "Apparel": ["Tops", "Bottomwear", "Outerwear", "Formalwear", "Innerwear / Basics", "Sets / Co-ords"],
  "Corporate Wear": ["Corporate Tops", "Executive Shirts", "Blazers & Suits", "Corporate Trousers", "Polo Uniforms"],
  "Uniforms": ["Corporate Uniforms", "Medical / Healthcare", "Hospitality / F&B", "Security / Field Staff", "Industrial / Safety", "School & College"],
  "Hospitality": ["Chef Coats", "Server Shirts", "Aprons", "Housekeeping Sets", "Front Desk Suits"],
  "Industrial Wear": ["Coveralls / Boiler Suits", "High-Vis Vests", "Work Trousers", "Lab Coats", "Safety Jackets"],
  "Activewear": ["Gym T-Shirts", "Track Pants", "Performance Polos", "Running Shorts", "Compression Wear"],
  "Accessories": ["Headwear / Caps", "Bags & Totes", "Socks", "Masks", "Aprons", "Belts & Ties"]
};

export const PRODUCT_TYPES_BY_CATEGORY: Record<string, string[]> = {
  // Apparel & Tops
  "Tops": ["Polo", "Crewneck", "T-Shirt", "Shirt", "Tank Top", "Crop Top", "Henley", "Kurti"],
  "Bottomwear": ["Trouser", "Chinos", "Track Pants", "Shorts", "Jeans", "Cargo Pants", "Leggings"],
  "Outerwear": ["Hoodie", "Sweatshirt", "Jacket", "Windbreaker", "Bomber Jacket", "Blazer", "Sweater", "Vest / Gilet"],
  "Formalwear": ["Formal Shirt", "Formal Trouser", "Blazer", "Suit Set", "Waistcoat"],
  "Innerwear / Basics": ["Undershirt", "Vest", "Boxers"],
  "Sets / Co-ords": ["Tracksuit", "Uniform Set", "Lounge Set"],

  // Corporate & Uniforms
  "Corporate Tops": ["Polo", "Executive Shirt", "Corporate Blouse"],
  "Executive Shirts": ["Formal Shirt", "Oxford Shirt", "Spread Collar Shirt"],
  "Blazers & Suits": ["Single Breasted Blazer", "Double Breasted Blazer", "Full Suit"],
  "Corporate Trousers": ["Formal Trouser", "Chinos", "Flexi-Waist Trouser"],
  "Polo Uniforms": ["Polo", "Tipped Polo", "Pique Polo"],

  "Corporate Uniforms": ["Polo", "Formal Shirt", "Trouser", "Blazer"],
  "Medical / Healthcare": ["Scrubs Top", "Scrubs Pant", "Lab Coat", "Doctor Coat", "Patient Gown"],
  "Hospitality / F&B": ["Chef Coat", "Chef Trouser", "Server Shirt", "Apron", "Waistcoat"],
  "Security / Field Staff": ["Security Shirt", "Cargo Trouser", "Field Jacket", "Cap"],
  "Industrial / Safety": ["Coverall", "High-Vis Jacket", "Safety Vest", "Work Trouser"],
  "School & College": ["School Polo", "School Shirt", "Skirt / Pinafore", "Shorts / Trousers", "Blazer"],

  // Hospitality
  "Chef Coats": ["Executive Chef Coat", "Double Breasted Coat", "Short Sleeve Chef Jacket"],
  "Server Shirts": ["Polo", "Mandarin Shirt", "Classic Shirt"],
  "Aprons": ["Bib Apron", "Waist Apron", "Cross-Back Apron"],
  "Housekeeping Sets": ["Tunic & Trouser", "Housekeeping Shirt"],
  "Front Desk Suits": ["Blazer", "Formal Trouser", "Waistcoat"],

  // Industrial
  "Coveralls / Boiler Suits": ["Heavy Duty Coverall", "Cotton Coverall", "Reflective Coverall"],
  "High-Vis Vests": ["Reflective Safety Vest", "Mesh Safety Vest"],
  "Work Trousers": ["Cargo Work Trouser", "Reinforced Knee Trouser"],
  "Lab Coats": ["Standard Lab Coat", "Anti-Static Lab Coat", "Doctor Apron"],
  "Safety Jackets": ["Parka Jacket", "High-Vis Windbreaker"],

  // Activewear
  "Gym T-Shirts": ["T-Shirt", "Sleeveless Tee", "Compression Tee"],
  "Track Pants": ["Track Pants", "Joggers", "Tapered Track Pants"],
  "Performance Polos": ["Dry-Fit Polo", "Active Polo"],
  "Running Shorts": ["Running Shorts", "2-in-1 Shorts"],
  "Compression Wear": ["Compression Top", "Compression Tights"],

  // Accessories
  "Headwear / Caps": ["Baseball Cap", "Trucker Cap", "Beanie", "Bucket Hat", "Chef Hat"],
  "Bags & Totes": ["Canvas Tote", "Drawstring Bag", "Duffel Bag", "Backpack"],
  "Socks": ["Crew Socks", "Ankle Socks", "Cushioned Sports Socks"],
  "Masks": ["3-Ply Fabric Mask", "N95 Styled Mask"],
  "Belts & Ties": ["Formal Tie", "Bow Tie", "Webbing Belt"]
};

export const ALL_PRODUCT_TYPES = Array.from(
  new Set(Object.values(PRODUCT_TYPES_BY_CATEGORY).flat())
).sort();

export const STYLES_BY_PRODUCT_TYPE: Record<string, string[]> = {
  "Polo": ["Classic Polo Collar", "Tipped Collar", "Mandarin / Band Collar", "Zipper Polo", "Button-Down Collar", "Contrast Placket"],
  "Crewneck": ["Classic Crewneck", "Ribbed Collar", "Drop Shoulder", "Oversized Fit", "Raglan Sleeve", "Raw Edge"],
  "Hoodie": ["Pullover Hoodie", "Full-Zip Hoodie", "Quarter-Zip Hoodie", "Oversized Hoodie", "Cropped Hoodie", "Kangaroo Pocket"],
  "T-Shirt": ["Round Neck", "V-Neck", "Oversized / Boxy", "Slim Fit", "Raglan", "Henley Placket", "Pocket Tee", "Longline"],
  "Shirt": ["Button-Down Collar", "Spread Collar", "Mandarin Collar", "Camp / Cuban Collar", "Formal Dress Shirt", "Casual Oxford"],
  "Trouser": ["Formal Flat-Front", "Flexi-Waist / Elasticated", "Pleated", "Chino Fit", "Cargo Style", "Tapered Fit", "Straight Leg"],
  "Jacket": ["Zip-Up Bomber", "Windcheater", "Softshell", "Fleece Lined", "Puffer", "Coach Jacket"],
  "Sweatshirt": ["Crewneck Sweatshirt", "Half-Zip Sweatshirt", "Fleece Pullover", "Drop Shoulder Sweatshirt"],
  "Chinos": ["Slim Fit Chino", "Regular Fit Chino", "Stretch Chino"],
  "Track Pants": ["Cuffed Joggers", "Straight Leg Track Pant", "Zipper Ankle Jogger"],
  "Shorts": ["Bermuda Shorts", "Cargo Shorts", "Board Shorts", "Sweat Shorts"],
  "Lab Coat": ["Standard Length", "Knee Length", "Short Coat", "Press Button Fastening"],
  "Chef Coat": ["Traditional Double Breasted", "Modern Zipper Chef Coat", "Breathable Mesh Back"]
};

export const ALL_STYLES = Array.from(
  new Set(Object.values(STYLES_BY_PRODUCT_TYPE).flat())
).sort();

export const GENDERS = ["Men", "Women", "Unisex", "Kids"] as const;
export type GenderType = typeof GENDERS[number];

export const QUALITY_TIERS = ["Basic", "Standard", "Premium", "Luxury"] as const;
export type QualityTierType = typeof QUALITY_TIERS[number];

export const FITS = [
  "Regular",
  "Slim",
  "Relaxed",
  "Oversized",
  "Boxy",
  "Tailored",
  "Custom Fit"
] as const;

export const NECK_TYPES = [
  "Round / Crew Neck",
  "Polo Collar",
  "V-Neck",
  "Mandarin / Band Collar",
  "Hooded",
  "Spread Collar",
  "Button-Down Collar",
  "Boat Neck",
  "Square Neck",
  "Henley"
] as const;

export const SLEEVE_TYPES = [
  "Half Sleeve",
  "Full Sleeve",
  "Sleeveless",
  "3/4th Sleeve",
  "Raglan Sleeve"
] as const;

export const FABRICS = [
  "100% Combed Cotton",
  "PIMA Cotton",
  "French Terry Cotton",
  "100% Cotton Pique",
  "Poly-Cotton Blend (65/35)",
  "Polyester Micro-Pique",
  "Spandex / Cotton Lycra",
  "Dry-Fit Performance Poly",
  "100% Organic Cotton",
  "Linen Blend",
  "Fleece (Brushed)",
  "Jacquard Knit",
  "Heavyweight Loopback Cotton"
] as const;

export const PATTERNS = [
  "Solid / Plain",
  "Striped",
  "Color Block",
  "Heather / Melange",
  "Textured / Waffle",
  "Jacquard Pattern",
  "Checks",
  "Printed"
] as const;

export const STANDARD_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL"
] as const;

export const IMAGE_VIEW_TYPES = [
  "Front",
  "Back",
  "Side",
  "Detail",
  "Lifestyle",
  "Other"
] as const;

export type ImageViewType = typeof IMAGE_VIEW_TYPES[number];

export interface ProductMediaItem {
  url: string;
  sortOrder: number;
  isMain: boolean;
  viewType: ImageViewType;
  colorName?: string;
}

export interface StructuredColorVariant {
  name: string;
  hex: string;
  value: string;
  imageUrls: string[];
  image?: string;
  imageUrl?: string;
}

/**
 * Backward compatibility helpers
 */

export function deriveProductType(product: any): string {
  if (product?.productType && product.productType.trim()) {
    return product.productType.trim();
  }
  const typeStr = (product?.type || "").toLowerCase();
  const nameStr = (product?.name || "").toLowerCase();
  const catStr = (product?.category?.name || product?.category || "").toLowerCase();

  if (typeStr.includes("polo") || nameStr.includes("polo") || catStr.includes("polo")) return "Polo";
  if (typeStr.includes("hoodie") || nameStr.includes("hoodie") || catStr.includes("hoodie")) return "Hoodie";
  if (typeStr.includes("crewneck") || nameStr.includes("crewneck") || catStr.includes("crewneck")) return "Crewneck";
  if (typeStr.includes("jacket") || nameStr.includes("jacket") || catStr.includes("jacket")) return "Jacket";
  if (typeStr.includes("trouser") || nameStr.includes("trouser") || catStr.includes("trouser")) return "Trouser";
  if (typeStr.includes("lab coat") || nameStr.includes("lab coat") || catStr.includes("lab coat")) return "Lab Coat";
  if (typeStr.includes("shirt") || nameStr.includes("shirt") || catStr.includes("shirt")) return "Shirt";
  if (typeStr.includes("t-shirt") || nameStr.includes("t-shirt") || catStr.includes("t-shirt")) return "T-Shirt";

  return product?.type || "Apparel";
}

export function deriveGender(product: any): string {
  if (product?.gender && product.gender.trim()) {
    return product.gender.trim();
  }
  const name = (product?.name || "").toLowerCase();
  const type = (product?.type || "").toLowerCase();
  if (name.includes("women") || type.includes("women")) return "Women";
  if (name.includes("kid") || type.includes("kid")) return "Kids";
  if (name.includes("unisex") || type.includes("unisex")) return "Unisex";
  return "Men";
}

export function deriveQualityTier(product: any): string {
  if (product?.qualityTier && product.qualityTier.trim()) {
    return product.qualityTier.trim();
  }
  const name = (product?.name || "").toLowerCase();
  const badge = (product?.badge || "").toLowerCase();
  const cat = (product?.category?.name || product?.category || "").toLowerCase();

  if (name.includes("luxe") || cat.includes("luxe") || badge.includes("luxe")) return "Luxury";
  if (name.includes("premium") || cat.includes("premium") || badge.includes("premium")) return "Premium";
  if (name.includes("basic") || badge.includes("basic")) return "Basic";
  return "Standard";
}

/**
 * Maps productType / product to Design Studio garment mockup identifier
 */
export function deriveGarmentTypeForCustomizer(product: any): string {
  const pType = deriveProductType(product).toLowerCase();
  if (pType.includes("polo")) return "polo";
  if (pType.includes("hoodie") || pType.includes("jacket")) return "hoodie";
  if (pType.includes("round") || pType.includes("crew") || pType.includes("t-shirt") || pType.includes("oversized")) return "round-neck";
  return "round-neck";
}
