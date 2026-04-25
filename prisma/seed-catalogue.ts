/**
 * Tailoring Turba — Product Seed Script
 * Seeds CatalogueCategory + CatalogueProduct from Google Sheets data
 * Run: npx ts-node --skip-project prisma/seed-catalogue.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Tailoring Turba catalogue...");

  // ─── CATEGORY & PRODUCT DATA ───────────────────────────────────────────────

  const catalogue = [
    // ─── 1. MAGIC BRAND — POLO T-SHIRTS ──────────────────────────────────────
    {
      name: "Magic Polo & T-Shirts",
      slug: "magic-polo-tshirts",
      description:
        "Premium polo and round-neck T-shirts from the Magic range — covering Dryfit, Biowash, Cotton & PolyCotton fabrics across multiple GSM grades.",
      hsn: "6105",
      gst: "12%",
      pages: [1, 2, 3, 4],
      products: [
        { code: "MAGIC_DRIFLY-RN-DRIFIT-SALINA-140GSM", name: "Magic Dryfly (Round Neck)", spec: "Plain Polyester Salina Fabric, 120 GSM | Colors: Black, White, Grey, Ocean Blue | S–XXL | 1 Month Color Guarantee", price: "115" },
        { code: "MAGIC_DRIPLAY-RN-DRIFIT-NK-180GSM", name: "Magic Dryplay (Round Neck)", spec: "Nirmal Knit Dryfit, 180 GSM | 10 Colors incl. Neon, Royal Blue | S–XXXL | 6 Month Guarantee + Reflector Tape", price: "145" },
        { code: "MAGIC_BIOWASH_MALE_COTTON_180GSM", name: "Magic Bio (Men Round Neck)", spec: "Super Cotton Biowash, 180 GSM | 12 Colors incl. Olive Green, Charcoal | S–XXXL", price: "195" },
        { code: "MAGIC_BIOWASH_FEMALE_COTTON_180GSM", name: "Magic Bio Girls (Round Neck)", spec: "Super Cotton Biowash, 180 GSM | 5 Colors | XS–2XL", price: "215" },
        { code: "MAGIC_BIOWASH_KIDS_COTTON_180GSM", name: "Magic Bio Kids (Round Neck)", spec: "Combed Cotton Biowash, 180 GSM | 4 Colors | 18–36 Sizes", price: "165" },
        { code: "MAGIC_TUCK-TIPPING-POLO-DRIFIT-DOTKNIT-180GSM", name: "Magic Tuck Polo (Tipping)", spec: "Dot Knit Micro Dryfit, 180 GSM | 9 Colors | S–3XL | 6 Month Guarantee", price: "220" },
        { code: "MAGIC_DRISPORTS-PLAIN-POLO-DRIFIT-NK-180GSM", name: "Magic Sports Polo (Plain)", spec: "Nirmal Knit Dryfit, 180 GSM | 11 Colors | S–3XL | 3 Month Guarantee", price: "195" },
        { code: "HIGHO2_OXI-POLO-DRIFIT-IMPORTED-200GSM", name: "High O2 — Oxi Polo", spec: "Mag Cool Fabric, 200 GSM | 9 Colors | S–3XL | Anti-Bacterial, Imported | 6 Month Guarantee", price: "430" },
        { code: "RUFFTY_SOLIDS-POLO-COTTON-260GSM", name: "Rufty Solid Polo (Cotton)", spec: "Pure Cotton Biowash, 260 GSM | 40+ Colors | S–5XL | Short Sleeves", price: "430" },
        { code: "RUFFTY_TIPPING-MALE-POLO-COTTON-260GSM", name: "Rufty Tipping Polo (Cotton)", spec: "Pure Cotton Biowash, 260 GSM | 40+ Colors | S–5XL | Short Sleeves", price: "470" },
        { code: "WILDHORN_TIPPING-POLO-COTTON-260GSM", name: "Wild Horn Tipping Polo", spec: "Pure Cotton Biowash, 280 GSM | Jacquard Trimmings | 12 Color Combos | S–5XL", price: "470" },
        { code: "MAGIC_SOLIDS-POLO-PCPQ-230GSM", name: "Magic Solids Polo (PolyCotton)", spec: "PolyCotton 60:40, 220 GSM | 9 Colors | S–3XL | Short Sleeves", price: "300" },
        { code: "RUFFTY_X-SOLIDS-POLO-PCPQ-240GSM", name: "Rufty X Polo (PolyCotton)", spec: "PolyCotton 60:40, 230 GSM | 6 Colors | S–3XL", price: "310" },
        { code: "MAGIC_IO-SOLIDS-POLO-IN_COTTON-OUT_MICRO-240GSM", name: "Magic IO Polo", spec: "Inside Cotton Outside Polyester, 220 GSM | 6 Colors | S–3XL | Double Needle Stitch | 6 Month Guarantee", price: "360" },
        { code: "RUFFTY_SPORTS-SOLIDS-POLO-IN_COTTON-OUT_MICRO-230GSM", name: "Rufty Sports Polo", spec: "Inside Cotton Outside Polyester, 240 GSM | 14 Colors | S–5XL | 6 Month Guarantee", price: "415" },
        { code: "WILDHORN_INTERLOCK-SOLIDS-POLO-COTTON-280GSM", name: "Wild Horn Interlock Polo", spec: "Pure Cotton Interlock, 280 GSM | Jacquard Neck Tape | 17 Colors | S–5XL", price: "625" },
      ],
    },

    // ─── 2. MAGIC BRAND — SWEATSHIRTS & HOODIES ─────────────────────────────
    {
      name: "Magic Winter Wear — Hoodies & Sweatshirts",
      slug: "magic-winter-wear",
      description:
        "Premium hoodies and sweatshirts from the Magic range — 310–340 GSM PolyCotton and Export Cotton, with Kangaroo pockets and zip options.",
      hsn: "6110",
      gst: "12%",
      pages: [5, 6],
      products: [
        { code: "MAGIC-HOOD-KANG-310GSM-PC", name: "Magic Hood + Kangaroo/Zip Hoodie", spec: "310 GSM PolyCotton | Kangaroo or Zip closure | MOQ 50 pcs", price: "460" },
        { code: "MAGIC-ZIPPER-KANG-310GSM-PC", name: "Magic Zipper + Kangaroo Pocket", spec: "310 GSM PolyCotton | Zipper front + Kangaroo pocket | MOQ 50 pcs", price: "545" },
        { code: "RUFTY-HOOD-340GSM-EXPORT-COTTON", name: "Rufty Hoodies + Kangaroo/Zip", spec: "340 GSM Export Cotton | Premium finish | MOQ 50 pcs", price: "720" },
        { code: "RUFTY-HIGHNECK-340GSM-EXPORT-COTTON", name: "Rufty HighNeck + Stand Collar", spec: "340 GSM Export Cotton | Kangaroo or Stand Collar | MOQ 50 pcs", price: "795" },
      ],
    },

    // ─── 3. DAZZLE BRAND — ROUND NECKS & POLOS ──────────────────────────────
    {
      name: "Dazzle Collection — T-Shirts & Polos",
      slug: "dazzle-collection",
      description:
        "Dazzle brand premium round-neck and polo T-shirts featuring Biowash cotton, sustainable fabrics, and Dryfit options across Biowash and Scott lines.",
      hsn: "6105",
      gst: "12%",
      pages: [7, 8],
      products: [
        { code: "DAZZLE-RN-BIOWASH-MI160", name: "Dazzle Round Neck (Biowash MI-160)", spec: "Biowash Cotton, 180 GSM | S–3XL | 4XL Rs.100 extra, 5XL Rs.150 extra", price: "155" },
        { code: "DAZZLE-RN-BIOS-GENTS-180", name: "Dazzle Bio's Gents Round Neck", spec: "180 GSM | Colors: Black, Grey, White, Navy, Charcoal | XS–3XL", price: "190" },
        { code: "DAZZLE-POLO-SCOTT-SUSTAINABLE", name: "Scott Sustainable Polo", spec: "S–3XL | Same Fabric as TTH | 4XL Rs.100 extra", price: "355" },
        { code: "DAZZLE-POLO-SCOTT-SP-ORGANIC", name: "Scott-SP Organic Polo (Gents/Ladies)", spec: "Organic fabric | S–3XL", price: "570" },
        { code: "DAZZLE-POLO-SHIMMER-IO", name: "Shimmer Polo (In/Out)", spec: "Inside-Out fabric | S–3XL | Compare to Magic I/O", price: "325" },
        { code: "DAZZLE-POLO-SCOTT-SORA-DRYFIT", name: "Scott Sora Polo (Dryfit)", spec: "Dryfit fabric | S–3XL", price: "435" },
        { code: "DAZZLE-POLO-SCOTT-YOUNG", name: "Scott Young Polo", spec: "S–3XL", price: "290" },
        { code: "DAZZLE-POLO-DE-GREEN-TIPPING", name: "DE Polo — Green Tipping & Solid Plain (Labeless)", spec: "S–3XL", price: "215" },
        { code: "DAZZLE-POLO-LEGACY-DRYFIT", name: "Legacy Polo (Dryfit)", spec: "Dull Dryfit fabric | S–4XL | 4XL Rs.50 extra", price: "270" },
        { code: "DAZZLE-POLO-AWG-GOLFER-DRYFIT", name: "AWG Golfer Dry Fit Polo", spec: "S–3XL | 4XL Rs.100 extra, 5XL Rs.150 extra", price: "540" },
        { code: "DAZZLE-POLO-AWG-LABEL-GREEN", name: "AWG Label Green Polo", spec: "Colors: White/Red/Royal/Maroon | S–3XL", price: "300" },
        { code: "DAZZLE-POLO-AWG-LABEL-SOLID", name: "AWG Label Solid Polo", spec: "Colors: Denim/Red/Royal | S–3XL", price: "300" },
      ],
    },

    // ─── 4. FOLKSWEAR — ROUND NECK, COLLAR & HOODIES ────────────────────────
    {
      name: "Folkswear Collection — Round Neck, Collar & Hoodies",
      slug: "folkswear-collection",
      description:
        "Folkswear brand featuring SofTee, Infinity, Koshka, and Biowash round necks alongside collar-neck polars and premium hoodies in 140–350 GSM fabrics.",
      hsn: "6105",
      gst: "12%",
      pages: [9, 10],
      products: [
        { code: "FOLK-RN-SOFTEE-KIDS", name: "SofTee Kids Round Neck", spec: "140 GSM PP | Sizes 18–32 | Dryfit", price: "100" },
        { code: "FOLK-RN-SOFTEE-ADULT", name: "SofTee Round Neck (Adult)", spec: "140 GSM PP | S–3XL | Dryfit", price: "105" },
        { code: "FOLK-RN-INFINITY", name: "Infinity Round Neck", spec: "170 GSM NK Dryfit | S–3XL", price: "145" },
        { code: "FOLK-RN-KOSHKA", name: "Koshka Round Neck", spec: "180 GSM Cotton | S–3XL", price: "155" },
        { code: "FOLK-RN-BIOWASH-S2XL", name: "Biowash Round Neck (S–2XL)", spec: "180 GSM Premium Cotton | S–2XL", price: "200" },
        { code: "FOLK-RN-BIOWASH-3XL", name: "Biowash Round Neck (3XL)", spec: "180 GSM Premium Cotton | 3XL", price: "220" },
        { code: "FOLK-COL-SEEKER", name: "Seeker Collar Neck Polo", spec: "170 GSM NK Dryfit | S–3XL", price: "200" },
        { code: "FOLK-COL-DCKREEL-ECO", name: "Dckreel ECO Collar Polo", spec: "240 GSM Premium Cotton | S–3XL", price: "100" },
        { code: "FOLK-COL-MEXMY", name: "Mexmy Collar Polo", spec: "220 GSM Cotton | S–3XL", price: "420" },
        { code: "FOLK-COL-FILING-SOLID", name: "Filing Solid Polo", spec: "250 GSM Premium Cotton | S–3XL", price: "420" },
        { code: "FOLK-COL-FILING-TIPPING", name: "Filing Tipping Polo", spec: "250 GSM Premium Cotton | S–3XL", price: "420" },
        { code: "FOLK-COL-HAYATI", name: "Hayati Premium Polo", spec: "200 GSM Premium Micro Polyester | S–3XL", price: "420" },
        { code: "FOLK-HOOD-FOLKS", name: "Folks Hood Hoodie", spec: "300 GSM Fleece | S–3XL", price: "460" },
        { code: "FOLK-HOOD-FOLKS-ZIPPER", name: "Folks Hood Zipper Hoodie", spec: "300 GSM Fleece | S–3XL", price: "510" },
        { code: "FOLK-HOOD-PREMIUM-ZIPPER", name: "Premium Hoodie Zipper", spec: "350 GSM Fleece | S–3XL", price: "755" },
      ],
    },

    // ─── 5. MAGIC WORKWEAR — SHIRTS, LAB COATS & TROUSERS ───────────────────
    {
      name: "Magic Workwear — Shirts, Trousers & Lab Coats",
      slug: "magic-workwear",
      description:
        "Professional workwear from Magic — FilaFil, Chambray, Performance shirts with full/half sleeves, Parkland trousers, and Dankat lab coats for corporate and industrial use.",
      hsn: "6211",
      gst: "12%",
      pages: [11, 12],
      products: [
        { code: "MAGIC-WW-FILAFIL-SHIRT", name: "FilaFil Shirt (Full/Half Sleeve)", spec: "Full or Half Sleeves + Pocket | MOQ 50 pcs", price: "455" },
        { code: "MAGIC-WW-CHAMBRAY-SHIRT", name: "Chambray Shirt (Full/Half Sleeve)", spec: "Full or Half Sleeves + Pocket | MOQ 50 pcs", price: "455" },
        { code: "MAGIC-WW-PERFORMANCE-SHIRT", name: "Performance Shirt (Full/Half Sleeve)", spec: "Full or Half Sleeves + Pocket | MOQ 50 pcs", price: "455" },
        { code: "MAGIC-WW-PARKLAND-PANT", name: "Parkland Trouser", spec: "Premium workwear trousers | MOQ 50 pcs", price: "505" },
        { code: "MAGIC-WW-LABCOAT-DANKAT", name: "Lab Coat — Dankat (3 Pockets)", spec: "3-pocket design | MOQ 50 pcs", price: "245" },
      ],
    },

    // ─── 6. TTH BRAND — FULL PREMIUM RANGE ───────────────────────────────────
    {
      name: "TTH Premium — Crew, Polo, Hoodies & Formal",
      slug: "tth-premium-range",
      description:
        "Tailoring Turba's flagship premium range — from lightweight 130 GSM Polyester crewnecks to 350 GSM formal trousers. PIMA cotton, sustainable blends, and imported fabrics. Prices exclude GST.",
      hsn: "6105",
      gst: "12%",
      pages: [13, 14, 15, 16],
      products: [
        // Crew Neck
        { code: "TTH-CREW-SPORTS-130GSM-POLY", name: "Sports Crewneck (100% Polyester)", spec: "130 GSM | 2 Colors | S–3XL | Lightweight performance fabric", price: "85" },
        { code: "TTH-CREW-MOBILITEE-160GSM-POLY", name: "Mobilitee Round Neck", spec: "160 GSM, 100% Polyester | 10 Colors | S–3XL", price: "120" },
        { code: "TTH-CREW-SUSTAINABLE-190GSM-PCOT", name: "Sustainable Crewneck (60% Cotton, 40% Poly)", spec: "190 GSM | 7 Colors | S–3XL", price: "180" },
        { code: "TTH-CREW-KIDS-185GSM-PIMA", name: "Kid's Crewneck (100% PIMA Cotton)", spec: "185 GSM | 10 Colors", price: "180" },
        { code: "TTH-CREW-PREM-MEN-185GSM-PIMA", name: "Premium Crewneck Men (100% PIMA Cotton)", spec: "185 GSM | 10 Colors | S–3XL", price: "250" },
        { code: "TTH-CREW-PREM-WOMEN-185GSM-PIMA", name: "Premium Crewneck Women (100% PIMA Cotton)", spec: "185 GSM | 10 Colors | S–3XL", price: "250" },
        { code: "TTH-CREW-OVERSIZED-240GSM-FRENCH", name: "Oversized Originals (French Terry Cotton)", spec: "240 GSM | 5 Colors | Oversized fit", price: "395" },
        // Polo
        { code: "TTH-POLO-MARS200-200GSM-POLY", name: "Mars200 Polo (100% Polyester)", spec: "200 GSM | 16 Colors | S–3XL", price: "300" },
        { code: "TTH-POLO-MELANGE-210GSM-POLY", name: "The Melange Edit Polo", spec: "210 GSM, 100% Polyester | 2 Melange colors | S–3XL", price: "550" },
        { code: "TTH-POLO-SUST-JAQ-MEN-240GSM", name: "Sustainable Jacquard Polo (Men)", spec: "240 GSM, 60% Cotton 40% Poly | 11 Colors | S–3XL", price: "355" },
        { code: "TTH-POLO-SUST-JAQ-WOMEN-240GSM", name: "Sustainable Jacquard Polo (Women)", spec: "240 GSM, 60% Cotton 40% Poly | 11 Colors | S–3XL", price: "355" },
        { code: "TTH-POLO-PREM-260GSM-PIMA", name: "Premium Polo (100% PIMA Cotton)", spec: "260 GSM | 12 Colors | S–3XL | Top-tier finish", price: "475" },
        // Hoodies
        { code: "TTH-HOOD-CLASSIC-300GSM", name: "Classic Hoodie", spec: "300 GSM | 4 Colors | S–3XL", price: "525" },
        { code: "TTH-HOOD-2IN1-ZIPPER-300GSM", name: "2-in-1 Zipper Hoodie", spec: "300 GSM | 4 Colors | S–3XL | Zip front", price: "580" },
        { code: "TTH-JACKET-JETSETTER-320GSM", name: "Jet-Setter Jacket", spec: "320 GSM | 5 Colors | S–3XL | Premium jacket finish", price: "795" },
        // Formal
        { code: "TTH-FORMAL-SHIRTTEE-190GSM", name: "Shirt-Tee (Formal)", spec: "190 GSM | 6 Colors | S–3XL | Shirt collar with tee comfort", price: "615" },
        { code: "TTH-FORMAL-TROUSER-350GSM", name: "Formal Trouser", spec: "350 GSM | 2 Colors | Standard fit", price: "440" },
        { code: "TTH-FORMAL-FLEXI-TROUSER-350GSM", name: "Flexi-Waist Trouser", spec: "350 GSM | 2 Colors | Elastic waistband", price: "650" },
      ],
    },
  ];

  // ─── UPSERT CATEGORIES & PRODUCTS ─────────────────────────────────────────

  for (const cat of catalogue) {
    console.log(`\n📂 Upserting category: ${cat.name}`);

    const category = await prisma.catalogueCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        hsn: cat.hsn,
        gst: cat.gst,
        pages: cat.pages,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        hsn: cat.hsn,
        gst: cat.gst,
        pages: cat.pages,
      },
    });

    for (const prod of cat.products) {
      // Check if it already exists by code
      const existing = await prisma.catalogueProduct.findFirst({
        where: { code: prod.code },
      });

      if (existing) {
        await prisma.catalogueProduct.update({
          where: { id: existing.id },
          data: {
            name: prod.name,
            spec: prod.spec,
            categoryId: category.id,
          },
        });
        console.log(`  ✅ Updated: ${prod.name}`);
      } else {
        await prisma.catalogueProduct.create({
          data: {
            code: prod.code,
            name: prod.name,
            spec: prod.spec,
            minOrderQuantity: 10,
            isB2B: true,
            categoryId: category.id,
          },
        });
        console.log(`  ➕ Created: ${prod.name}`);
      }
    }
  }

  console.log("\n✅ Catalogue seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
