// ─── Garments ────────────────────────────────────────────────────────────────
export const GARMENTS = {
  "round-neck": {
    label: "Round Neck",
    front: "/mockups/round.png?v=2",
    back: "/mockups/round_back.png?v=2",
  },
  "v-neck": {
    label: "V-Neck",
    front: "/mockups/vneck.png?v=2",
    back: "/mockups/vneck_back.png?v=2",
  },
  polo: {
    label: "Polo Shirt",
    front: "/mockups/polo.png?v=2",
    back: "/mockups/polo_back.png?v=2",
  },
};

// ─── Fabric Catalogue (from Products_Available.pdf) ──────────────────────────
export type FabricCategory = "dryfit" | "cotton" | "polycotton" | "interlock" | "organic" | "premium";

export interface Fabric {
  id: string;
  brand: string;
  fabric: string;
  gsm: number;
  category: FabricCategory;
  priceRange: string;
  sizes: string;
  garments: Array<keyof typeof GARMENTS>;
  tag?: string;
  images: {
    base: string; // Used for the listing card
  };
}

export const FABRICS: Fabric[] = [
  // Dryfit / Polyester
  { id: "magic-dryfly",   brand: "Magic Dryfly",     fabric: "Polyester Salina",          gsm: 120, category: "dryfit",     priceRange: "₹100–₹120/pc", sizes: "S–XXL",   garments: ["round-neck","v-neck"],          tag: "Lightweight", images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "awg-dryfit",     brand: "Awg Dryfit",       fabric: "Polyester Microdryfit",      gsm: 150, category: "dryfit",     priceRange: "₹115–₹140/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck"],          tag: "Sports",      images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "awg-irun",       brand: "Awg IRUN",         fabric: "MicroPolyester Knit",        gsm: 170, category: "dryfit",     priceRange: "₹165–₹190/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "magic-dryplay",  brand: "Magic Dryplay",    fabric: "Nirmal Knit",                gsm: 180, category: "dryfit",     priceRange: "₹224–₹232/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],          tag: "Bestseller",  images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "infinity",       brand: "Infinity",         fabric: "Nirmal Knit Micro Dryfit",   gsm: 180, category: "dryfit",     priceRange: "₹135–₹160/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "softee",         brand: "Softee",           fabric: "Polyester Microdryfit",      gsm: 150, category: "dryfit",     priceRange: "₹100–₹125/pc", sizes: "XS–3XL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "awg-golfer",     brand: "AWG Golfer",       fabric: "Micro Drifit Polyester",     gsm: 200, category: "dryfit",     priceRange: "₹520–₹600/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Sports",      images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "drypolo",        brand: "Drypolo",          fabric: "Mag Cool Fabric",            gsm: 200, category: "dryfit",     priceRange: "₹270–₹325/pc", sizes: "S–3XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Polycotton
  { id: "rufty-dtg",      brand: "Rufty DTG",        fabric: "Polycotton 50:50",           gsm: 190, category: "polycotton", priceRange: "₹165–₹190/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],          tag: "Print-Ready", images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "magic-solids",   brand: "Magic Solids",     fabric: "PolyCotton 60:40",           gsm: 220, category: "polycotton", priceRange: "₹339–₹456/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Bestseller",  images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "rufty-x",        brand: "Rufty X",          fabric: "PolyCotton 60:40",           gsm: 230, category: "polycotton", priceRange: "₹339–₹456/pc", sizes: "S–3XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "awg-super",      brand: "AWG Super Fastee", fabric: "Polycotton Blend",           gsm: 250, category: "polycotton", priceRange: "₹380–₹445/pc", sizes: "S–4XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "awg-de-green",   brand: "AWG/DE Green Polo",fabric: "Cotton Mix",                 gsm: 240, category: "polycotton", priceRange: "₹250–₹300/pc", sizes: "S–3XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Pure Cotton
  { id: "magic-bio",      brand: "Magic Bio",        fabric: "Super Cotton Biowash",       gsm: 180, category: "cotton",     priceRange: "₹243–₹319/pc", sizes: "S–XXXL",  garments: ["round-neck"],                   tag: "Bestseller",  images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "magic-bio-f",    brand: "Magic Bio Girls",  fabric: "Super Cotton Biowash",       gsm: 180, category: "cotton",     priceRange: "₹249–₹333/pc", sizes: "XS–2XL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "rufty-cn",       brand: "Rufty Crewneck",   fabric: "Combed Cotton Biowash",      gsm: 200, category: "cotton",     priceRange: "₹307–₹406/pc", sizes: "S–XXXL",  garments: ["round-neck"],                                       images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "scott-basic",    brand: "Scott Basic",      fabric: "Super Combed Cotton",        gsm: 170, category: "cotton",     priceRange: "₹180–₹200/pc", sizes: "S–5XL",   garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "folkswear-bio",  brand: "Folkswear Bio",    fabric: "Pure Cotton Biowash",        gsm: 180, category: "cotton",     priceRange: "₹195–₹230/pc", sizes: "XS–3XL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "fling-solid",    brand: "Fling Solid",      fabric: "Combed Cotton",              gsm: 250, category: "cotton",     priceRange: "₹380–₹460/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck","polo"],                         images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "rufty-solid",    brand: "Rufty Solid",      fabric: "Pure Cotton Biowash",        gsm: 260, category: "cotton",     priceRange: "₹486–₹652/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "seeker",         brand: "Seeker",           fabric: "Nirmal Knit",                gsm: 180, category: "cotton",     priceRange: "₹180–₹225/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "mexmy",          brand: "Mexmy",            fabric: "Pure Cotton",                gsm: 220, category: "cotton",     priceRange: "₹280–₹340/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  
  // Interlock
  { id: "wh-interlock",   brand: "Wild Horn Interlock",fabric: "Pure Cotton Interlock",    gsm: 280, category: "interlock",  priceRange: "₹704–₹942/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "6-degree",       brand: "6 Degree",         fabric: "Pure Cotton Interlock",      gsm: 240, category: "interlock",  priceRange: "₹430–₹500/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "spark",          brand: "SPARK",            fabric: "Premium Biowash Cotton",     gsm: 300, category: "interlock",  priceRange: "₹535–₹630/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Organic
  { id: "scott-sp",       brand: "Scott Organic",    fabric: "Organic Cotton",             gsm: 300, category: "organic",    priceRange: "₹535–₹630/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Eco",         images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Premium Blend
  { id: "magic-io",       brand: "Magic IO",         fabric: "Cotton In / Polyester Out",  gsm: 220, category: "premium",    priceRange: "₹403–₹543/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Best of Both",images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "rufty-sports",   brand: "Rufty Sports",     fabric: "Cotton In / Polyester Out",  gsm: 240, category: "premium",    priceRange: "₹537–₹710/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Sports",      images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "wh-jaquard",     brand: "Wild Horn Jaquard",fabric: "Cotton Biowash Jaquard",     gsm: 260, category: "premium",    priceRange: "₹576–₹760/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
];

export const FABRIC_CATEGORIES: { key: FabricCategory | "all"; label: string; emoji: string }[] = [
  { key: "all",        label: "All",          emoji: "🧵" },
  { key: "dryfit",     label: "Dryfit",       emoji: "💧" },
  { key: "polycotton", label: "Polycotton",   emoji: "🔀" },
  { key: "cotton",     label: "Pure Cotton",  emoji: "🌿" },
  { key: "interlock",  label: "Interlock",    emoji: "🔗" },
  { key: "organic",    label: "Organic",      emoji: "🌱" },
  { key: "premium",    label: "Premium",      emoji: "⭐" },
];

export const TAG_COLORS: Record<string, string> = {
  Bestseller:    "#F59E0B",
  Lightweight:   "#06B6D4",
  Sports:        "#8B5CF6",
  "Print-Ready": "#10B981",
  Eco:           "#16A34A",
  Premium:       "#DC2626",
  "Best of Both":"#0EA5E9",
};

export const COLOR_PRESETS = [
  { name: "White",         hex: "#FFFFFF" },
  { name: "Black",         hex: "#111111" },
  { name: "Turba Blue",    hex: "#004b6b" },
  { name: "Navy",          hex: "#1E3A5F" },
  { name: "Royal Blue",    hex: "#2563EB" },
  { name: "Sky Blue",      hex: "#38BDF8" },
  { name: "Forest Green",  hex: "#16A34A" },
  { name: "Olive",         hex: "#4D7C0F" },
  { name: "Crimson",       hex: "#DC2626" },
  { name: "Maroon",        hex: "#7F1D1D" },
  { name: "Gold",          hex: "#D97706" },
  { name: "Grey Melange",  hex: "#9CA3AF" },
];
