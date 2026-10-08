export const TURBA_BRANDING_METHODS = [
  {
    id: "embroidery",
    name: "Computerized Embroidery",
    bestFor: "Corporate polo shirts, executive uniform shirts, jackets, fleece hoodies, and caps.",
    fabrics: "Pique cotton (220–280 GSM), fleece, canvas, heavy poly-cotton.",
    durability: "Top-tier. Outlasts the garment itself. Safe to iron.",
    idealPlacements: ["Left Chest", "Sleeve", "Back Collar / Yoke"],
    notes: "Embroidery gives a classic embossed 3D stitch. Avoid full-back embroidery as it makes the fabric stiff.",
    minQty: 10,
  },
  {
    id: "screen",
    name: "Precision Screen Printing",
    bestFor: "Bulk promotional t-shirts, college fests, corporate events, giveaways.",
    fabrics: "100% cotton (180–240 GSM), poly-cotton blends.",
    durability: "Long-lasting solid plastisol/water-based prints. Wash inside-out.",
    idealPlacements: ["Center Chest", "Full Back", "Left Chest"],
    notes: "Most cost-effective for orders over 50+ pieces with 1–3 solid colors.",
    minQty: 20,
  },
  {
    id: "dtf",
    name: "DTF (Direct to Film) & Heat Transfer",
    bestFor: "Full-color brand logos, gradients, intricate crests, sportswear badges.",
    fabrics: "Cotton, polyester, dryfit, nylon, and blends.",
    durability: "High stretch and wash-durability. Retains sharp micro-details.",
    idealPlacements: ["Left Chest", "Sleeve", "Center Front", "Back"],
    notes: "Ideal for modern multi-color logos with gradient shading and fine lines.",
    minQty: 10,
  },
  {
    id: "dtg",
    name: "DTG (Direct to Garment)",
    bestFor: "Artistic graphic tees, photo prints, multi-color illustrative merch.",
    fabrics: "100% premium combed cotton.",
    durability: "Super soft hand-feel, inks blend directly into the cotton fibers.",
    idealPlacements: ["Center Chest", "Full Back"],
    notes: "Zero setup fee, excellent for high detail on 100% cotton.",
    minQty: 10,
  },
  {
    id: "sublimation",
    name: "Dye Sublimation Printing",
    bestFor: "Sports jerseys, marathons, activewear, gym uniforms, dryfit tees.",
    fabrics: "100% polyester & dryfit micro fabrics only.",
    durability: "Infused into the yarn at molecular level. 100% breathable, zero hand-feel, zero fading.",
    idealPlacements: ["Full Front", "Full Back", "All-Over Print (AOP)"],
    notes: "Requires white or light polyester fabric for accurate color transfer.",
    minQty: 10,
  },
];

export const TURBA_FABRIC_GUIDE = [
  {
    name: "Super Cotton Biowash (180 GSM)",
    category: "Round Neck T-Shirts",
    pros: "Soft, breathable, comfortable daily wear, pre-shrunk.",
    useCases: ["Startups", "Tech teams", "Everyday office wear", "Casual college wear"],
  },
  {
    name: "Heavy Cotton / Interlock (240–280 GSM)",
    category: "Premium / Luxury T-Shirts & Polos",
    pros: "Substantial drape, premium texture, long life, no transparency.",
    useCases: ["Executive corporate merch", "Retail-grade brand merch", "Luxe uniforms"],
  },
  {
    name: "Micro Dryfit / Nirmal Knit / Dot Knit (140–180 GSM)",
    category: "Sports & Event T-Shirts",
    pros: "Moisture-wicking, quick-drying, odor resistant, featherlight.",
    useCases: ["Marathons", "Gyms", "Outdoor staff", "Sports tournaments"],
  },
  {
    name: "Inside-Cotton Outside-Micro (IO Fabric 220–240 GSM)",
    category: "Performance Corporate Polos",
    pros: "Cotton against the skin for natural breathability, polyester outer for fade resistance.",
    useCases: ["Delivery staff", "Sales reps", "Hospitality", "Industrial staff"],
  },
  {
    name: "Heavy Fleece PolyCotton (310–340 GSM)",
    category: "Winter Wear / Hoodies / Jackets",
    pros: "Warm, cozy brushed fleece inside, durable pill-resistant shell.",
    useCases: ["Winter swag", "College hoodies", "Conference pullovers"],
  },
];

export const INITIAL_QUICK_OPTIONS = [
  { label: "T-Shirts", value: "T-Shirts" },
  { label: "Polo Shirts", value: "Polos" },
  { label: "Hoodies & Outerwear", value: "Hoodies" },
  { label: "Corporate Uniforms", value: "Uniforms" },
  { label: "Performance Activewear", value: "Sportswear" },
  { label: "Custom Apparel Inquiry", value: "Custom Apparel" },
];

