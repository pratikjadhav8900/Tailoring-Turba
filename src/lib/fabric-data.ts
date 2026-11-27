// ─── Garments ────────────────────────────────────────────────────────────────
export const GARMENTS = {
  "round-neck": {
    label: "Round Neck",
    front: "/mockups/man_mask_transparent.png",
    baseFront: "/mockups/man_base.png",
    back: "/mockups/round_neck_back_mask_transparent.png",
    baseBack: "/mockups/round_neck_back_base.png",
    left: "/mockups/round_neck_left_sleeve_mask.png",
    baseLeft: "/mockups/round_neck_left_sleeve_base.png",
    right: "/mockups/round_neck_left_sleeve_mask.png", // fallback for right using left image, could be styled via CSS if needed
    baseRight: "/mockups/round_neck_left_sleeve_base.png",
    printableArea: {
      front: { top: "19%", left: "25%", width: "50%", height: "55%" },
      back: { top: "18%", left: "27%", width: "46%", height: "60%" },
      left: { top: "45%", left: "55%", width: "12%", height: "18%" },
      right: { top: "45%", left: "55%", width: "12%", height: "18%" }
    }
  },
  "v-neck": {
    label: "V-Neck",
    front: "/mockups/vneck.png?v=2",
    back: "/mockups/vneck_back.png?v=2",
    printableArea: { top: "20%", left: "25%", width: "50%", height: "60%" }
  },
  polo: {
    label: "Polo Shirt",
    front: "/mockups/polo_front_mask_transparent.png",
    baseFront: "/mockups/polo_front_base.png",
    back: "/mockups/polo_back_mask_transparent.png",
    baseBack: "/mockups/polo_back_base.png",
    left: "/mockups/polo_neck_left_sleeve_mask.png",
    baseLeft: "/mockups/polo_neck_left_sleeve_base.png",
    right: "/mockups/polo_neck_left_sleeve_mask.png",
    baseRight: "/mockups/polo_neck_left_sleeve_base.png",
    printableArea: {
      front: { top: "22%", left: "25%", width: "50%", height: "60%" },
      back: { top: "17%", left: "27%", width: "46%", height: "60%" },
      left: { top: "46%", left: "54%", width: "14%", height: "20%" },
      right: { top: "46%", left: "54%", width: "14%", height: "20%" }
    }
  },
  hoodie: {
    label: "Hoodie",
    front: "/mockups/Hoodie_front_mask.png",
    baseFront: "/mockups/Hoodie_front_base.png",
    back: "/mockups/Hoodie_back_mask_transparent.png",
    baseBack: "/mockups/Hoodie_back_base.png",
    printableArea: {
      front: { top: "22%", left: "27%", width: "46%", height: "50%" },
      back: { top: "22%", left: "28%", width: "44%", height: "55%" }
    }
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
  { id: "magic-dryfly",   brand: "Salina Dryfit 120", fabric: "Polyester Salina",          gsm: 120, category: "dryfit",     priceRange: "₹100–₹120/pc", sizes: "S–XXL",   garments: ["round-neck","v-neck"],          tag: "Lightweight", images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "awg-dryfit",     brand: "Micro Dryfit 150",  fabric: "Polyester Microdryfit",      gsm: 150, category: "dryfit",     priceRange: "₹115–₹140/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck"],          tag: "Sports",      images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "awg-irun",       brand: "Knit Performance",  fabric: "MicroPolyester Knit",        gsm: 170, category: "dryfit",     priceRange: "₹165–₹190/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "magic-dryplay",  brand: "Nirmal Dryplay 180",fabric: "Nirmal Knit",                gsm: 180, category: "dryfit",     priceRange: "₹224–₹232/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],          tag: "Bestseller",  images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "infinity",       brand: "Infinity Dryfit",   fabric: "Nirmal Knit Micro Dryfit",   gsm: 180, category: "dryfit",     priceRange: "₹135–₹160/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "softee",         brand: "Softee Micro",      fabric: "Polyester Microdryfit",      gsm: 150, category: "dryfit",     priceRange: "₹100–₹125/pc", sizes: "XS–3XL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "awg-golfer",     brand: "Pro Golfer Dryfit", fabric: "Micro Drifit Polyester",     gsm: 200, category: "dryfit",     priceRange: "₹520–₹600/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Sports",      images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "drypolo",        brand: "Mag Cool Dryfit",   fabric: "Mag Cool Fabric",            gsm: 200, category: "dryfit",     priceRange: "₹270–₹325/pc", sizes: "S–3XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Polycotton
  { id: "rufty-dtg",      brand: "DTG Polycotton 190",fabric: "Polycotton 50:50",           gsm: 190, category: "polycotton", priceRange: "₹165–₹190/pc", sizes: "S–XXXL",  garments: ["round-neck","v-neck"],          tag: "Print-Ready", images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "magic-solids",   brand: "Turba Solids 220",  fabric: "PolyCotton 60:40",           gsm: 220, category: "polycotton", priceRange: "₹339–₹456/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Bestseller",  images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "rufty-x",        brand: "Turba Flex 230",    fabric: "PolyCotton 60:40",           gsm: 230, category: "polycotton", priceRange: "₹339–₹456/pc", sizes: "S–3XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "awg-super",      brand: "Super Fastee 250",  fabric: "Polycotton Blend",           gsm: 250, category: "polycotton", priceRange: "₹380–₹445/pc", sizes: "S–4XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "awg-de-green",   brand: "Green Tipping Mix", fabric: "Cotton Mix",                 gsm: 240, category: "polycotton", priceRange: "₹250–₹300/pc", sizes: "S–3XL",   garments: ["polo"],                                             images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Pure Cotton
  { id: "magic-bio",      brand: "Super Cotton Bio 180",fabric: "Super Cotton Biowash",     gsm: 180, category: "cotton",     priceRange: "₹243–₹319/pc", sizes: "S–XXXL",  garments: ["round-neck"],                   tag: "Bestseller",  images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "magic-bio-f",    brand: "Bio Cotton Cut 180", fabric: "Super Cotton Biowash",      gsm: 180, category: "cotton",     priceRange: "₹249–₹333/pc", sizes: "XS–2XL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "rufty-cn",       brand: "Combed Bio Cotton 200",fabric: "Combed Cotton Biowash",    gsm: 200, category: "cotton",     priceRange: "₹307–₹406/pc", sizes: "S–XXXL",  garments: ["round-neck"],                                       images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "scott-basic",    brand: "Super Combed Cotton 170",fabric: "Super Combed Cotton",     gsm: 170, category: "cotton",     priceRange: "₹180–₹200/pc", sizes: "S–5XL",   garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "folkswear-bio",  brand: "Pure Cotton Bio 180",fabric: "Pure Cotton Biowash",       gsm: 180, category: "cotton",     priceRange: "₹195–₹230/pc", sizes: "XS–3XL",  garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "fling-solid",    brand: "Combed Solid 250",  fabric: "Combed Cotton",              gsm: 250, category: "cotton",     priceRange: "₹380–₹460/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck","polo","hoodie"],         images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "rufty-solid",    brand: "Heavy Cotton Bio 260",fabric: "Pure Cotton Biowash",       gsm: 260, category: "cotton",     priceRange: "₹486–₹652/pc", sizes: "S–5XL",   garments: ["polo","hoodie"],                tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "seeker",         brand: "Nirmal Knit 180",   fabric: "Nirmal Knit",                gsm: 180, category: "cotton",     priceRange: "₹180–₹225/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  { id: "mexmy",          brand: "Pure Cotton 220",   fabric: "Pure Cotton",                gsm: 220, category: "cotton",     priceRange: "₹280–₹340/pc", sizes: "S–3XL",   garments: ["round-neck","v-neck"],                              images: { base: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" } },
  
  // Interlock
  { id: "wh-interlock",   brand: "Pure Cotton Interlock 280",fabric: "Pure Cotton Interlock",gsm: 280, category: "interlock", priceRange: "₹704–₹942/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "6-degree",       brand: "Interlock Soft 240",fabric: "Pure Cotton Interlock",      gsm: 240, category: "interlock",  priceRange: "₹430–₹500/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "spark",          brand: "Spark Biowash 300", fabric: "Premium Biowash Cotton",     gsm: 300, category: "interlock",  priceRange: "₹535–₹630/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Organic
  { id: "scott-sp",       brand: "Organic Eco Cotton 300",fabric: "Organic Cotton",          gsm: 300, category: "organic",    priceRange: "₹535–₹630/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Eco",         images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  
  // Premium Blend
  { id: "magic-io",       brand: "Cotton-Poly IO 220", fabric: "Cotton In / Polyester Out",  gsm: 220, category: "premium",    priceRange: "₹403–₹543/pc", sizes: "S–3XL",   garments: ["polo"],                         tag: "Best of Both",images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "rufty-sports",   brand: "Performance IO 240",fabric: "Cotton In / Polyester Out",  gsm: 240, category: "premium",    priceRange: "₹537–₹710/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Sports",      images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
  { id: "wh-jaquard",     brand: "Jacquard Bio 260",  fabric: "Cotton Biowash Jaquard",     gsm: 260, category: "premium",    priceRange: "₹576–₹760/pc", sizes: "S–5XL",   garments: ["polo"],                         tag: "Premium",     images: { base: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80" } },
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

export const COLOR_PRESETS = [
  { name: "White",         hex: "#FFFFFF" },
  { name: "Black",         hex: "#0A0A0A" },
  { name: "Turba Blue",    hex: "#004b6b" },
  { name: "Navy",          hex: "#142D4D" },
  { name: "Royal Blue",    hex: "#1A4BB8" },
  { name: "Sky Blue",      hex: "#38BDF8" },
  { name: "Forest Green",  hex: "#137A3B" },
  { name: "Olive",         hex: "#3D6510" },
  { name: "Crimson",       hex: "#C72020" },
  { name: "Maroon",        hex: "#5B141D" },
  { name: "Gold",          hex: "#C27506" },
  { name: "Grey Melange",  hex: "#A0A7B0" },
];
