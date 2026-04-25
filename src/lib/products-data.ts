export type Product = {
  id: number;
  name: string;
  category: string;
  type: string;
  image: string;
  price: string;
  colors?: number;
  description?: string;
  features?: string[];
  badge?: string;
  gallery?: string[];
};

const IMG_POLO = "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80";
const IMG_TSHIRT = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80";
const IMG_HOODIE = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80";
const IMG_SHIRT = "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=800&q=80";
const IMG_TROUSER = "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80";

export const allProducts: Product[] = [
  // ── MAGIC POLO & T-SHIRTS ──────────────────────────────────────────────────
  { id: 1, name: "Magic Dryfly", category: "Magic Polo & T-Shirts", type: "Round Neck · Dryfit", image: IMG_TSHIRT, price: "₹115", colors: 4, badge: "B2B", description: "Plain Polyester Salina Fabric, 120 GSM. 1 Month Color Guarantee.", features: ["120 GSM Salina Dryfit", "S–XXL sizing", "4 Colors: Black, White, Grey, Ocean Blue", "3–7 Day dispatch"] },
  { id: 2, name: "Magic Dryplay", category: "Magic Polo & T-Shirts", type: "Round Neck · Dryfit", image: IMG_TSHIRT, price: "₹145", colors: 10, description: "Nirmal Knit 180 GSM with Premium Dryfit Micro Fabric and Reflector Tape.", features: ["180 GSM Nirmal Knit", "6 Month Guarantee", "Unique Reflector Tape", "10 Colors incl. Neon & Royal Blue"] },
  { id: 3, name: "Magic Bio (Men)", category: "Magic Polo & T-Shirts", type: "Round Neck · Cotton", image: IMG_TSHIRT, price: "₹195", colors: 12, description: "Super Cotton Biowash 180 GSM. 12 Colors including Olive Green and Charcoal.", features: ["180 GSM Super Cotton", "Biowash finish", "12 Colors", "S–XXXL"] },
  { id: 4, name: "Magic Bio Girls", category: "Magic Polo & T-Shirts", type: "Round Neck · Cotton", image: IMG_TSHIRT, price: "₹215", colors: 5, description: "Super Cotton Biowash 180 GSM women's cut.", features: ["180 GSM Cotton", "XS–2XL", "5 Colors"] },
  { id: 5, name: "Magic Bio Kids", category: "Magic Polo & T-Shirts", type: "Round Neck · Cotton", image: IMG_TSHIRT, price: "₹165", colors: 4, description: "Combed Cotton Biowash 180 GSM for kids.", features: ["180 GSM Combed Cotton", "Sizes 18–36", "4 Colors"] },
  { id: 6, name: "Magic Tuck Polo", category: "Magic Polo & T-Shirts", type: "Polo · Tipping · Dryfit", image: IMG_POLO, price: "₹220", colors: 9, badge: "Best Seller", description: "Dot Knit Micro Dryfit 180 GSM with 6-month guarantee.", features: ["180 GSM Dot Knit", "6 Month Guarantee", "9 Colors", "S–3XL"] },
  { id: 7, name: "Magic Sports Polo", category: "Magic Polo & T-Shirts", type: "Polo · Plain · Dryfit", image: IMG_POLO, price: "₹195", colors: 11, description: "Nirmal Knit Dryfit 180 GSM plain polo.", features: ["180 GSM Nirmal Knit", "3 Month Guarantee", "11 Colors", "S–3XL"] },
  { id: 8, name: "High O2 — Oxi Polo", category: "Magic Polo & T-Shirts", type: "Polo · Imported · Anti-Bacterial", image: IMG_POLO, price: "₹430", colors: 9, badge: "Premium", description: "Mag Cool Fabric 200 GSM. Anti-Bacterial, 100% Micro with cotlook matte finish.", features: ["200 GSM Mag Cool", "Anti-Bacterial Treated", "Color Fastness Treated", "6 Month Guarantee"] },
  { id: 9, name: "Rufty Solid Polo", category: "Magic Polo & T-Shirts", type: "Polo · Cotton · Plain", image: IMG_POLO, price: "₹430", colors: 40, description: "Pure Cotton Biowash 260 GSM with 40+ colors.", features: ["260 GSM Pure Cotton", "40+ Colors", "S–5XL", "Short Sleeves"] },
  { id: 10, name: "Rufty Tipping Polo", category: "Magic Polo & T-Shirts", type: "Polo · Cotton · Tipping", image: IMG_POLO, price: "₹470", colors: 40, description: "Pure Cotton Biowash 260 GSM tipping collar.", features: ["260 GSM Pure Cotton", "40+ Colors", "S–5XL"] },
  { id: 11, name: "Wild Horn Tipping Polo", category: "Magic Polo & T-Shirts", type: "Polo · Cotton · Jacquard", image: IMG_POLO, price: "₹470", colors: 12, badge: "Premium", description: "Pure Cotton Biowash 280 GSM with Jacquard Trimmings.", features: ["280 GSM Cotton", "Jacquard Trimmings", "Pre-Shrunk", "12 Color Combos"] },
  { id: 12, name: "Magic Solids Polo", category: "Magic Polo & T-Shirts", type: "Polo · PolyCotton · Plain", image: IMG_POLO, price: "₹300", colors: 9, description: "PolyCotton 60:40 220 GSM solid polo.", features: ["220 GSM PolyCotton", "9 Colors", "S–3XL"] },
  { id: 13, name: "Rufty X Polo", category: "Magic Polo & T-Shirts", type: "Polo · PolyCotton · Plain", image: IMG_POLO, price: "₹310", colors: 6, description: "PolyCotton 60:40 230 GSM.", features: ["230 GSM PolyCotton", "6 Colors", "S–3XL"] },
  { id: 14, name: "Magic IO Polo", category: "Magic Polo & T-Shirts", type: "Polo · Inside Cotton Outside Micro", image: IMG_POLO, price: "₹360", colors: 6, badge: "Innovative", description: "Inside Cotton Outside Polyester 220 GSM with double needle stitch.", features: ["220 GSM IO Fabric", "Double Needle Stitch", "6 Month Guarantee", "S–3XL"] },
  { id: 15, name: "Rufty Sports Polo", category: "Magic Polo & T-Shirts", type: "Polo · IO Fabric · Unisex", image: IMG_POLO, price: "₹415", colors: 14, description: "Inside Cotton Outside Polyester 240 GSM for Men & Women.", features: ["240 GSM IO Fabric", "14 Colors", "S–5XL", "6 Month Guarantee"] },
  { id: 16, name: "Wild Horn Interlock Polo", category: "Magic Polo & T-Shirts", type: "Polo · Cotton Interlock", image: IMG_POLO, price: "₹625", colors: 17, badge: "Luxury", description: "Pure Cotton Interlock 280 GSM with Jacquard Neck Tape.", features: ["280 GSM Interlock Cotton", "Jacquard Neck Tape", "Pre-Shrunk", "17 Colors"] },

  // ── MAGIC WINTER WEAR ──────────────────────────────────────────────────────
  { id: 17, name: "Magic Hood + Kangaroo Hoodie", category: "Magic Winter Wear", type: "Hoodie · 310 GSM PolyCotton", image: IMG_HOODIE, price: "₹460", description: "310 GSM PolyCotton Hoodie with Kangaroo or Zip closure.", features: ["310 GSM PolyCotton", "Kangaroo or Zip option", "MOQ 10 pcs"] },
  { id: 18, name: "Magic Zipper + Kangaroo Sweatshirt", category: "Magic Winter Wear", type: "Sweatshirt · 310 GSM PolyCotton", image: IMG_HOODIE, price: "₹545", features: ["310 GSM PolyCotton", "Zipper front + Kangaroo pocket"] },
  { id: 19, name: "Rufty Hoodies + Kangaroo/Zip", category: "Magic Winter Wear", type: "Hoodie · 340 GSM Export Cotton", image: IMG_HOODIE, price: "₹720", badge: "Premium", features: ["340 GSM Export Cotton", "Kangaroo or Zip", "Premium finish"] },
  { id: 20, name: "Rufty HighNeck + Stand Collar", category: "Magic Winter Wear", type: "HighNeck · 340 GSM Export Cotton", image: IMG_HOODIE, price: "₹795", badge: "Premium", features: ["340 GSM Export Cotton", "Stand Collar or Kangaroo"] },

  // ── DAZZLE COLLECTION ─────────────────────────────────────────────────────
  { id: 21, name: "Dazzle Round Neck (Biowash)", category: "Dazzle Collection", type: "Round Neck · Biowash", image: IMG_TSHIRT, price: "₹155", colors: 5, features: ["180 GSM Biowash", "S–3XL", "4XL available (+₹100)"] },
  { id: 22, name: "Dazzle Bio's Gents", category: "Dazzle Collection", type: "Round Neck · Biowash", image: IMG_TSHIRT, price: "₹190", colors: 5, features: ["180 GSM", "Colors: Black, Grey, White, Navy, Charcoal", "XS–3XL"] },
  { id: 23, name: "Scott Sustainable Polo", category: "Dazzle Collection", type: "Polo · Sustainable", image: IMG_POLO, price: "₹355", description: "Same fabric as TTH sustainable range.", features: ["Sustainable fabric", "S–3XL"] },
  { id: 24, name: "Scott-SP Organic Polo", category: "Dazzle Collection", type: "Polo · Organic · Unisex", image: IMG_POLO, price: "₹570", badge: "Organic", features: ["Organic fabric", "Gents & Ladies", "S–3XL"] },
  { id: 25, name: "Shimmer Polo (In/Out)", category: "Dazzle Collection", type: "Polo · IO Fabric", image: IMG_POLO, price: "₹325", features: ["Inside-Out fabric", "S–3XL"] },
  { id: 26, name: "Scott Sora Polo (Dryfit)", category: "Dazzle Collection", type: "Polo · Dryfit", image: IMG_POLO, price: "₹435", features: ["Dryfit fabric", "S–3XL"] },
  { id: 27, name: "Scott Young Polo", category: "Dazzle Collection", type: "Polo · Casual", image: IMG_POLO, price: "₹290", features: ["S–3XL"] },
  { id: 28, name: "DE Polo — Green Tipping", category: "Dazzle Collection", type: "Polo · Labeless · Plain", image: IMG_POLO, price: "₹215", features: ["Green Tipping & Solid Plain", "Labeless", "S–3XL"] },
  { id: 29, name: "Legacy Polo (Dryfit)", category: "Dazzle Collection", type: "Polo · Dryfit", image: IMG_POLO, price: "₹270", features: ["Dull Dryfit fabric", "S–4XL", "4XL +₹50"] },
  { id: 30, name: "AWG Golfer Dry Fit Polo", category: "Dazzle Collection", type: "Polo · Dryfit · Premium", image: IMG_POLO, price: "₹540", badge: "Premium", features: ["S–3XL", "4XL +₹100", "5XL +₹150"] },
  { id: 31, name: "AWG Label Green Polo", category: "Dazzle Collection", type: "Polo · Branded", image: IMG_POLO, price: "₹300", colors: 4, features: ["Colors: White, Red, Royal, Maroon", "S–3XL"] },
  { id: 32, name: "AWG Label Solid Polo", category: "Dazzle Collection", type: "Polo · Branded", image: IMG_POLO, price: "₹300", colors: 3, features: ["Colors: Denim, Red, Royal", "S–3XL"] },

  // ── FOLKSWEAR COLLECTION ──────────────────────────────────────────────────
  { id: 33, name: "SofTee Kids Round Neck", category: "Folkswear Collection", type: "Round Neck · Kids · Dryfit", image: IMG_TSHIRT, price: "₹100", features: ["140 GSM PP Dryfit", "Sizes 18–32"] },
  { id: 34, name: "SofTee Round Neck (Adult)", category: "Folkswear Collection", type: "Round Neck · Dryfit", image: IMG_TSHIRT, price: "₹105", features: ["140 GSM PP Dryfit", "S–3XL"] },
  { id: 35, name: "Infinity Round Neck", category: "Folkswear Collection", type: "Round Neck · NK Dryfit", image: IMG_TSHIRT, price: "₹145", features: ["170 GSM NK Dryfit", "S–3XL"] },
  { id: 36, name: "Koshka Round Neck", category: "Folkswear Collection", type: "Round Neck · Cotton", image: IMG_TSHIRT, price: "₹155", features: ["180 GSM Cotton", "S–3XL"] },
  { id: 37, name: "Biowash Round Neck (S–2XL)", category: "Folkswear Collection", type: "Round Neck · Premium Cotton", image: IMG_TSHIRT, price: "₹200", features: ["180 GSM Premium Cotton", "S–2XL"] },
  { id: 38, name: "Biowash Round Neck (3XL)", category: "Folkswear Collection", type: "Round Neck · Premium Cotton", image: IMG_TSHIRT, price: "₹220", features: ["180 GSM Premium Cotton", "3XL"] },
  { id: 39, name: "Seeker Collar Polo", category: "Folkswear Collection", type: "Polo · NK Dryfit", image: IMG_POLO, price: "₹200", features: ["170 GSM NK Dryfit", "S–3XL"] },
  { id: 40, name: "Dckreel ECO Collar Polo", category: "Folkswear Collection", type: "Polo · Premium Cotton", image: IMG_POLO, price: "₹100", features: ["240 GSM Premium Cotton", "S–3XL"] },
  { id: 41, name: "Mexmy Collar Polo", category: "Folkswear Collection", type: "Polo · Cotton", image: IMG_POLO, price: "₹420", features: ["220 GSM Cotton", "S–3XL"] },
  { id: 42, name: "Filing Solid Polo", category: "Folkswear Collection", type: "Polo · Premium Cotton · Solid", image: IMG_POLO, price: "₹420", features: ["250 GSM Premium Cotton", "S–3XL"] },
  { id: 43, name: "Filing Tipping Polo", category: "Folkswear Collection", type: "Polo · Premium Cotton · Tipping", image: IMG_POLO, price: "₹420", features: ["250 GSM Premium Cotton", "S–3XL"] },
  { id: 44, name: "Hayati Premium Polo", category: "Folkswear Collection", type: "Polo · Micro Polyester", image: IMG_POLO, price: "₹420", badge: "Premium", features: ["200 GSM Premium Micro Polyester", "S–3XL"] },
  { id: 45, name: "Folks Hood Hoodie", category: "Folkswear Collection", type: "Hoodie · Fleece", image: IMG_HOODIE, price: "₹460", features: ["300 GSM Fleece", "S–3XL"] },
  { id: 46, name: "Folks Hood Zipper Hoodie", category: "Folkswear Collection", type: "Hoodie · Fleece · Zipper", image: IMG_HOODIE, price: "₹510", features: ["300 GSM Fleece", "Zipper front", "S–3XL"] },
  { id: 47, name: "Premium Hoodie Zipper", category: "Folkswear Collection", type: "Hoodie · Heavy Fleece · Zipper", image: IMG_HOODIE, price: "₹755", badge: "Luxury", features: ["350 GSM Fleece", "S–3XL"] },

  // ── MAGIC WORKWEAR ────────────────────────────────────────────────────────
  { id: 48, name: "FilaFil Shirt", category: "Magic Workwear", type: "Shirt · Full/Half Sleeve · Workwear", image: IMG_SHIRT, price: "₹455", features: ["Full or Half Sleeves", "Chest pocket", "MOQ 10 pcs"] },
  { id: 49, name: "Chambray Shirt", category: "Magic Workwear", type: "Shirt · Full/Half Sleeve · Workwear", image: IMG_SHIRT, price: "₹455", features: ["Chambray fabric", "Full or Half Sleeves", "MOQ 10 pcs"] },
  { id: 50, name: "Performance Shirt", category: "Magic Workwear", type: "Shirt · Full/Half Sleeve · Workwear", image: IMG_SHIRT, price: "₹455", features: ["Performance fabric", "Full or Half Sleeves", "MOQ 10 pcs"] },
  { id: 51, name: "Parkland Trouser", category: "Magic Workwear", type: "Trouser · Workwear", image: IMG_TROUSER, price: "₹505", features: ["Premium workwear fabric", "MOQ 10 pcs"] },
  { id: 52, name: "Lab Coat — Dankat", category: "Magic Workwear", type: "Lab Coat · 3 Pockets", image: IMG_SHIRT, price: "₹245", features: ["3-pocket design", "Dankat fabric", "MOQ 10 pcs"] },

  // ── TTH PREMIUM RANGE ─────────────────────────────────────────────────────
  { id: 53, name: "Sports Crewneck", category: "TTH Premium Range", type: "Round Neck · 100% Polyester · 130 GSM", image: IMG_TSHIRT, price: "₹85", colors: 2, features: ["130 GSM Polyester", "Lightweight performance", "S–3XL"] },
  { id: 54, name: "Mobilitee Round Neck", category: "TTH Premium Range", type: "Round Neck · 100% Polyester · 160 GSM", image: IMG_TSHIRT, price: "₹120", colors: 10, features: ["160 GSM Polyester", "10 Colors", "S–3XL"] },
  { id: 55, name: "Sustainable Crewneck", category: "TTH Premium Range", type: "Round Neck · 60% Cotton 40% Poly · 190 GSM", image: IMG_TSHIRT, price: "₹180", colors: 7, badge: "Sustainable", features: ["190 GSM Sustainable Blend", "7 Colors", "S–3XL"] },
  { id: 56, name: "Kid's Crewneck (PIMA Cotton)", category: "TTH Premium Range", type: "Round Neck · 100% PIMA Cotton · 185 GSM", image: IMG_TSHIRT, price: "₹180", colors: 10, features: ["185 GSM PIMA Cotton", "10 Colors"] },
  { id: 57, name: "Premium Crewneck (Men)", category: "TTH Premium Range", type: "Round Neck · 100% PIMA Cotton · 185 GSM", image: IMG_TSHIRT, price: "₹250", colors: 10, badge: "PIMA Cotton", features: ["185 GSM PIMA Cotton", "10 Colors", "S–3XL"] },
  { id: 58, name: "Premium Crewneck (Women)", category: "TTH Premium Range", type: "Round Neck · 100% PIMA Cotton · 185 GSM", image: IMG_TSHIRT, price: "₹250", colors: 10, features: ["185 GSM PIMA Cotton", "10 Colors", "S–3XL"] },
  { id: 59, name: "Oversized Originals", category: "TTH Premium Range", type: "Round Neck · French Terry Cotton · 240 GSM", image: IMG_TSHIRT, price: "₹395", colors: 5, badge: "Trending", features: ["240 GSM French Terry Cotton", "Oversized fit", "5 Colors"] },
  { id: 60, name: "Mars200 Polo", category: "TTH Premium Range", type: "Polo · 100% Polyester · 200 GSM", image: IMG_POLO, price: "₹300", colors: 16, features: ["200 GSM Polyester", "16 Colors", "S–3XL"] },
  { id: 61, name: "The Melange Edit Polo", category: "TTH Premium Range", type: "Polo · 100% Polyester · 210 GSM", image: IMG_POLO, price: "₹550", colors: 2, badge: "Exclusive", features: ["210 GSM Polyester", "Melange textures", "S–3XL"] },
  { id: 62, name: "Sustainable Jacquard Polo (Men)", category: "TTH Premium Range", type: "Polo · 60% Cotton 40% Poly · 240 GSM", image: IMG_POLO, price: "₹355", colors: 11, badge: "Sustainable", features: ["240 GSM Sustainable Blend", "Jacquard weave", "11 Colors"] },
  { id: 63, name: "Sustainable Jacquard Polo (Women)", category: "TTH Premium Range", type: "Polo · 60% Cotton 40% Poly · 240 GSM", image: IMG_POLO, price: "₹355", colors: 11, features: ["240 GSM Sustainable Blend", "11 Colors", "S–3XL"] },
  { id: 64, name: "Premium Polo (PIMA Cotton)", category: "TTH Premium Range", type: "Polo · 100% PIMA Cotton · 260 GSM", image: IMG_POLO, price: "₹475", colors: 12, badge: "PIMA Cotton", features: ["260 GSM PIMA Cotton", "12 Colors", "S–3XL"] },
  { id: 65, name: "Classic Hoodie", category: "TTH Premium Range", type: "Hoodie · 300 GSM", image: IMG_HOODIE, price: "₹525", colors: 4, features: ["300 GSM", "4 Colors", "S–3XL"] },
  { id: 66, name: "2-in-1 Zipper Hoodie", category: "TTH Premium Range", type: "Hoodie · Zipper · 300 GSM", image: IMG_HOODIE, price: "₹580", colors: 4, features: ["300 GSM", "Zipper front", "4 Colors", "S–3XL"] },
  { id: 67, name: "Jet-Setter Jacket", category: "TTH Premium Range", type: "Jacket · 320 GSM", image: IMG_HOODIE, price: "₹795", colors: 5, badge: "Premium", features: ["320 GSM", "5 Colors", "Premium jacket finish", "S–3XL"] },
  { id: 68, name: "Shirt-Tee (Formal)", category: "TTH Premium Range", type: "Formal Shirt · 190 GSM", image: IMG_SHIRT, price: "₹615", colors: 6, features: ["190 GSM", "6 Colors", "Shirt collar + tee comfort"] },
  { id: 69, name: "Formal Trouser", category: "TTH Premium Range", type: "Trouser · 350 GSM", image: IMG_TROUSER, price: "₹440", colors: 2, features: ["350 GSM", "2 Colors", "Standard fit"] },
  { id: 70, name: "Flexi-Waist Trouser", category: "TTH Premium Range", type: "Trouser · 350 GSM · Elastic Waist", image: IMG_TROUSER, price: "₹650", colors: 2, features: ["350 GSM", "Elastic waistband", "2 Colors"] },
];
