const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

console.log('Generating Tailoring Turba Justdial Product Catalogue PDF...');

const outputPath = path.join(__dirname, '..', 'public', 'Tailoring_Turba_Justdial_Product_Catalogue.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 45, left: 45, right: 45 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Color Palette
const PRIMARY = '#0f172a'; // Deep Navy
const ACCENT = '#2563eb';  // Royal Blue
const ACCENT_BG = '#eff6ff'; // Soft Blue
const TEXT_DARK = '#1e293b';
const TEXT_MUTED = '#64748b';
const BORDER_COLOR = '#cbd5e1';
const CARD_BG = '#f8fafc';
const SUCCESS = '#059669';

// Helper functions
function drawHeader(title, subtitle) {
  const logoPath = path.join(__dirname, '..', 'public', 'brand-logo.png');
  let currentY = doc.y;

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 45, currentY, { width: 90 });
    } catch (e) {
      // ignore logo error
    }
  }

  doc.fillColor(PRIMARY)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('TAILORING TURBA', 145, currentY + 5);

  doc.fillColor(ACCENT)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(title.toUpperCase(), 145, currentY + 28);

  if (subtitle) {
    doc.fillColor(TEXT_MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text(subtitle, 145, currentY + 42);
  }

  doc.moveTo(45, currentY + 65).lineTo(550, currentY + 65).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
  doc.y = currentY + 75;
}

function checkPageSpace(requiredHeight) {
  if (doc.y + requiredHeight > doc.page.height - 50) {
    doc.addPage();
    drawHeader('Product Catalogue for Justdial Upload', 'Manufacturer & Wholesaler of Corporate Uniforms & Apparel');
  }
}

function drawSectionHeading(title, subtitle) {
  checkPageSpace(60);
  doc.rect(45, doc.y, 505, 26).fill(ACCENT_BG);
  doc.rect(45, doc.y, 4, 26).fill(ACCENT);
  
  doc.fillColor(PRIMARY)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(title, 55, doc.y - 20);

  if (subtitle) {
    doc.fillColor(TEXT_MUTED)
      .font('Helvetica')
      .fontSize(8.5)
      .text(subtitle, 55, doc.y + 2);
  }
  doc.y += 12;
}

function drawProductCard(prod) {
  checkPageSpace(220);
  const startY = doc.y;
  const cardWidth = 505;

  // Title Row
  doc.rect(45, startY, cardWidth, 24).fill(PRIMARY);
  doc.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(prod.name, 55, startY + 6);

  const priceText = `B2B: Rs. ${prod.price} | MOQ: ${prod.moq || '10 pcs'}`;
  doc.font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor('#fbbf24')
    .text(priceText, 350, startY + 7, { width: 190, align: 'right' });

  doc.y = startY + 30;

  // Justdial Required Fields Box
  const jdBoxY = doc.y;
  doc.rect(45, jdBoxY, cardWidth, 68).fillAndStroke(CARD_BG, BORDER_COLOR);
  
  doc.fillColor(ACCENT)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('[ JUSTDIAL REQUIRED FORM FIELDS ]', 53, jdBoxY + 6);

  const col1X = 53;
  const col2X = 280;

  doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(8.5);
  doc.text('Color: ', col1X, jdBoxY + 22, { continued: true })
    .font('Helvetica').text(prod.jdColor);

  doc.font('Helvetica-Bold').text('Material: ', col1X, jdBoxY + 36, { continued: true })
    .font('Helvetica').text(prod.jdMaterial);

  doc.font('Helvetica-Bold').text('Size: ', col1X, jdBoxY + 50, { continued: true })
    .font('Helvetica').text(prod.jdSize);

  doc.font('Helvetica-Bold').text('Type: ', col2X, jdBoxY + 22, { continued: true })
    .font('Helvetica').text(prod.jdType);

  doc.font('Helvetica-Bold').text('Use: ', col2X, jdBoxY + 36, { continued: true })
    .font('Helvetica').text(prod.jdUse);

  doc.font('Helvetica-Bold').text('HSN / GST: ', col2X, jdBoxY + 50, { continued: true })
    .font('Helvetica').text(`${prod.hsn || '6105'} | GST 12%`);

  doc.y = jdBoxY + 74;

  // Specifications Grid
  doc.fillColor(TEXT_DARK)
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('Custom Specifications (+ Add Specification in Justdial):', 45, doc.y);
  doc.y += 3;

  const specY = doc.y;
  doc.rect(45, specY, cardWidth, 48).strokeColor(BORDER_COLOR).lineWidth(0.75).stroke();

  const specs = prod.specs || [];
  const half = Math.ceil(specs.length / 2);
  const leftSpecs = specs.slice(0, half);
  const rightSpecs = specs.slice(half);

  let curSpecY = specY + 5;
  leftSpecs.forEach(s => {
    doc.fillColor(TEXT_MUTED).font('Helvetica-Bold').fontSize(8)
      .text(`${s[0]}: `, 53, curSpecY, { continued: true })
      .fillColor(TEXT_DARK).font('Helvetica').text(s[1]);
    curSpecY += 13;
  });

  curSpecY = specY + 5;
  rightSpecs.forEach(s => {
    doc.fillColor(TEXT_MUTED).font('Helvetica-Bold').fontSize(8)
      .text(`${s[0]}: `, 280, curSpecY, { continued: true })
      .fillColor(TEXT_DARK).font('Helvetica').text(s[1]);
    curSpecY += 13;
  });

  doc.y = specY + 54;

  // Images & Links row
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(8);
  doc.text('Photos / Image Link: ', 45, doc.y, { continued: true });
  if (prod.mainImage) {
    doc.fillColor(ACCENT).font('Helvetica').text(prod.mainImage, {
      link: prod.mainImage,
      underline: true,
      continued: true
    });
  }
  if (prod.catPage) {
    doc.fillColor(TEXT_MUTED).font('Helvetica').text(`  |  Catalogue Page: ${prod.catPage}`);
  } else {
    doc.text('');
  }

  doc.y += 14;
}

// ==========================================
// DOCUMENT BUILD
// ==========================================

// --- PAGE 1: COVER & TAX MATRIX ---
drawHeader('Product Catalogue & Upload Guide', 'Prepared for Justdial Business Listing — Tailoring Turba');

doc.rect(45, doc.y, 505, 50).fillAndStroke('#f1f5f9', '#cbd5e1');
doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(10.5)
  .text('Overview & Instructions for Justdial Listing', 55, doc.y - 42);
doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(8.5)
  .text('This document contains the exact data schema and technical specifications required to upload Tailoring Turba\'s complete product catalogue to Justdial. Every product listing is mapped to Justdial\'s primary attributes (Color, Material, Size, Type, Use) alongside custom key-value specifications and direct links to high-definition studio photographs.', 55, doc.y - 28, { width: 485, lineGap: 2 });

doc.y += 20;

// Tax Table
doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(11).text('Master Business & Tax Matrix', 45, doc.y);
doc.y += 5;

const tableY = doc.y;
doc.rect(45, tableY, 505, 18).fill(PRIMARY);
doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
doc.text('Product Category', 55, tableY + 5);
doc.text('HSN Code', 190, tableY + 5);
doc.text('GST Rate', 260, tableY + 5);
doc.text('Standard MOQ', 330, tableY + 5);
doc.text('Standard Sizes', 420, tableY + 5);

const rows = [
  ['Polo & Round Neck T-Shirts', '6105 / 6109', '12%', '10–50 pcs', 'S, M, L, XL, XXL, 3XL–5XL'],
  ['Winter Hoodies, Sweatshirts & HighNecks', '6110', '12%', '10–50 pcs', 'S, M, L, XL, XXL, 3XL'],
  ['Corporate Formal & Uniform Shirts', '6211 / 6205', '12%', '10–50 pcs', '38 (S) to 46 (XXL)'],
  ['Industrial & Corporate Work Trousers', '6203 / 6211', '12%', '10–50 pcs', '28, 30, 32, 34, 36, 38, 40'],
  ['Lab Coats, Medical Aprons & Overcoats', '6211', '12%', '10–50 pcs', '36, 38, 40, 42, 44, 46'],
  ['Co-Branded Luxe Gifting (Adidas, US Polo, etc.)', '6105 / 6205', '12%', '10 pcs', 'S to XXL / 38 to 44']
];

let curRowY = tableY + 18;
rows.forEach((r, idx) => {
  const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
  doc.rect(45, curRowY, 505, 16).fillAndStroke(bg, BORDER_COLOR);
  doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(8);
  doc.text(r[0], 55, curRowY + 4);
  doc.text(r[1], 190, curRowY + 4);
  doc.text(r[2], 260, curRowY + 4);
  doc.text(r[3], 330, curRowY + 4);
  doc.text(r[4], 420, curRowY + 4);
  curRowY += 16;
});

doc.y = curRowY + 15;

// Justdial Upload Tips Box
doc.rect(45, doc.y, 505, 62).fillAndStroke(ACCENT_BG, ACCENT);
doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9.5).text('Pro-Tips for Fast Justdial Listing Approval:', 55, doc.y - 54);
doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(8)
  .text('1. In Category Selection, choose "T-Shirt Manufacturers", "Uniform Manufacturers", or "Corporate Gift Wholesalers".\n2. For Color, enter the primary color or mention "10+ Colors Available in Bulk" in specifications.\n3. Always enter both the MOQ (10 pcs) and Wholesale Unit Price to qualify for B2B buyer inquiries.\n4. Click "+ Add Another Specification" to enter GSM, Sleeve Style, and Quality Guarantee for higher search rankings.', 55, doc.y - 40, { width: 485, lineGap: 2.5 });

doc.y += 20;

// SECTION 1: ESSENTIAL & MAGIC POLO & T-SHIRTS
drawSectionHeading('1. Magic & Essential Polo and T-Shirts', 'High-volume Dryfit, Biowash Cotton and PolyCotton corporate tees');

drawProductCard({
  name: 'Magic Dryfly (Round Neck Dryfit T-Shirt)',
  price: '115 / pc',
  moq: '10 pcs',
  jdColor: 'Black, White, Light Grey, Ocean Blue (4 Colors)',
  jdMaterial: 'Polyester (Salina Dryfit Fabric)',
  jdSize: 'S, M, L, XL, XXL',
  jdType: 'Round Neck T-Shirt / Performance Dryfit',
  jdUse: 'Sports, Marathon, Corporate Events, Giveaways',
  hsn: '6105',
  specs: [
    ['GSM', '120 GSM'],
    ['Pattern', 'Plain Solid'],
    ['Sleeve Type', 'Half Sleeve'],
    ['Neck Style', 'Round Neck'],
    ['Guarantee', '1 Month Color Guarantee'],
    ['Dispatch Time', '3 to 7 Days Delivery']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897446/turba_products/prod_1_MDF01-Black-Profile.jpg',
  catPage: 'Page 01'
});

drawProductCard({
  name: 'Magic Dryplay (Round Neck with Reflector Safety Tape)',
  price: '145 / pc',
  moq: '10 pcs',
  jdColor: 'Black, White, Navy Blue, Golden Yellow, Red, Royal Blue, Orange, Sky Blue, Grey, Mint Green, Neon (11 Colors)',
  jdMaterial: 'Nirmal Knit Dryfit Micro Fabric',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'Round Neck Performance Dryfit',
  jdUse: 'Sports, Marathon, Delivery Staff Uniform, Activewear',
  hsn: '6105',
  specs: [
    ['GSM', '180 GSM'],
    ['Pattern', 'Solid with Reflector Safety Tape'],
    ['Sleeve Type', 'Half Sleeve'],
    ['Guarantee', '6 Month Quality Guarantee'],
    ['Features', 'Moisture Wicking, Quick Dry, High Visibility Tape'],
    ['Fit', 'Regular Athletic Fit']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897486/turba_products/prod_2_MDP_All.jpg',
  catPage: 'Page 01'
});

drawProductCard({
  name: 'Magic Bio / Turba Bio (Men 100% Super Cotton Biowash)',
  price: '195 / pc',
  moq: '10 pcs',
  jdColor: 'Black, Navy Blue, Charcoal, Olive Green, Maroon, White, Grey Melange, Red, Royal, Peach, Ocean (12 Colors)',
  jdMaterial: '100% Super Combed Cotton (Biowash)',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'Round Neck Biowash T-Shirt',
  jdUse: 'Corporate Casual Wear, College Fest, Daily Merchandise',
  hsn: '6105',
  specs: [
    ['GSM', '180 GSM'],
    ['Fabric Finish', 'Biowashed, Pre-Shrunk, Soft Feel'],
    ['Pattern', 'Solid Plain'],
    ['Neck Ribbing', 'Durable Lycra Rib Neck'],
    ['Sleeve Type', 'Half Sleeve'],
    ['Handfeel', 'Ultra-Soft Breathable Cotton']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897586/turba_products/prod_3_MB01-Black_biowash.jpg',
  catPage: 'Page 02'
});

drawProductCard({
  name: 'Magic Tuck Polo (Dot Knit Tipping Collar Polo)',
  price: '220 / pc',
  moq: '10 pcs',
  jdColor: 'Maroon, Black, Navy Blue, Dark Grey, Light Grey, White, Red, Turquoise Blue, Royal Blue (9 Colors)',
  jdMaterial: 'Dot Knit Micro Dryfit Fabric',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'Polo T-Shirt / Collar T-Shirt',
  jdUse: 'Corporate Uniforms, Hospitality Staff, Event Staff, Office Casual',
  hsn: '6105',
  specs: [
    ['GSM', '180 GSM'],
    ['Pattern', 'Solid with Contrast Tipping Collar & Cuffs'],
    ['Collar Style', 'Knitted Polo Collar with 2-Button Placket'],
    ['Sleeve Type', 'Half Sleeve with Ribbed Cuffs'],
    ['Guarantee', '6 Month Quality Guarantee'],
    ['Wash Care', 'Easy Wash, Anti-Pilling']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897750/turba_products/prod_6_Catalogue_TUCK_ALL.jpg',
  catPage: 'Page 03'
});

drawProductCard({
  name: 'High O2 — Oxi Polo (Anti-Bacterial Imported Pique)',
  price: '430 / pc',
  moq: '10 pcs',
  jdColor: 'Airforce Blue, Aquamarine, Black, Mustard, Navy Blue, Red, Royal Blue, White, Grey Solid (9 Colors)',
  jdMaterial: 'Mag Cool Fabric (Imported Micro Matte Cotlook Finish)',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'Executive Polo T-Shirt',
  jdUse: 'Golf Club, Executive Corporate Wear, Premium Uniforms',
  hsn: '6105',
  specs: [
    ['GSM', '200 GSM'],
    ['Treatments', 'Anti-Bacterial & Color Fastness Treated'],
    ['Collar', 'Heavy Structure Ribbed Anti-Curl Collar'],
    ['Guarantee', '6 Month Quality Guarantee'],
    ['Feel', 'Matte Cotton-Look with Synthetic Durability'],
    ['Placket', '3-Button Clean Finish Placket']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897815/turba_products/prod_8_BLACK-1.jpg',
  catPage: 'Page 03'
});

drawProductCard({
  name: 'Magic Solids Polo (PolyCotton 60:40 Pique)',
  price: '300 / pc',
  moq: '10 pcs',
  jdColor: 'Black, Charcoal, Denim Blue, Grey Melange, Maroon, Navy Blue, Red, Royal Blue, White (9 Colors)',
  jdMaterial: 'PolyCotton (60% Cotton, 40% Polyester)',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'Polo T-Shirt / Corporate Workwear Polo',
  jdUse: 'Office Daily Uniforms, Industrial Staff, Logistics Teams',
  hsn: '6105',
  specs: [
    ['GSM', '220–230 GSM'],
    ['Weave', 'Classic Honeycomb Pique Weave'],
    ['Sleeve', 'Half Sleeve with Reinforced Cuffs'],
    ['Placket', '2-Button Color Matched Placket'],
    ['Durability', 'High Tear Strength, Color Fastness'],
    ['Fit', 'Comfort Regular Fit']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897888/turba_products/prod_12_MSD_ALL.jpg',
  catPage: 'Page 04'
});

drawProductCard({
  name: 'Magic IO Polo (Inside Cotton Outside Polyester)',
  price: '360 / pc',
  moq: '10 pcs',
  jdColor: 'Black, Navy Blue, Maroon, Light Grey, Royal Blue, White (6 Colors)',
  jdMaterial: 'Dual-Face Fabric (Cotton Inside + Polyester Outside)',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'High-Tech Dual-Face Polo T-Shirt',
  jdUse: 'All-Day Corporate Uniforms, Outdoor & Field Staff',
  hsn: '6105',
  specs: [
    ['GSM', '220 GSM'],
    ['Inner Side', '100% Cotton for Maximum Sweat Absorption'],
    ['Outer Side', 'Micro-Poly for Rich Lustre & Non-Fade Color'],
    ['Stitching', 'Double Needle Heavy Duty Stitching'],
    ['Guarantee', '6 Month Quality Guarantee'],
    ['Collar', 'Jacquard Structured Knit Collar']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897993/turba_products/prod_14_MAGIC_IO_ALL.jpg',
  catPage: 'Page 04'
});

drawProductCard({
  name: 'Wild Horn Interlock Polo (Pure Cotton Luxury Polo)',
  price: '625 / pc',
  moq: '10 pcs',
  jdColor: '17 Colors (Black, White, Navy, Charcoal, Wine, Royal Blue, Olive Green, etc.)',
  jdMaterial: '100% Pure Combed Cotton (Double Knit Interlock)',
  jdSize: 'S, M, L, XL, XXL, 3XL, 4XL, 5XL',
  jdType: 'Luxury Polo T-Shirt / Executive Polo',
  jdUse: 'Executive Corporate Gifting, Management Uniform, Luxury Casual',
  hsn: '6105',
  specs: [
    ['GSM', '280 GSM (Heavy Luxury Grade)'],
    ['Fabric Knit', 'Double Interlock Knit (Wrinkle Resistant)'],
    ['Neck Trim', 'Custom Jacquard Neck Tape'],
    ['Guarantee', '12 Month Durability Guarantee'],
    ['Fit', 'Executive Tailored Fit'],
    ['Feel', 'Ultra-Smooth Mercerized Cotton Handfeel']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898049/turba_products/prod_16_BLACK-1.webp',
  catPage: 'Page 04'
});

// SECTION 2: WINTER WEAR
drawSectionHeading('2. Winter Wear — Hoodies, High-Necks & Sweatshirts', 'Heavyweight fleece outerwear for corporate winter wear & gifting');

drawProductCard({
  name: 'Magic Hood + Kangaroo Pocket Hoodie',
  price: '460 / pc',
  moq: '10 pcs',
  jdColor: 'Black, Navy Blue, Grey Melange, Red (4 Colors)',
  jdMaterial: 'Heavy PolyCotton Fleece (Brushed Interior)',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'Hoodie / Pullover Winter Sweatshirt',
  jdUse: 'Winter Uniforms, College Fest Hoodies, Corporate Winter Gifting',
  hsn: '6110',
  specs: [
    ['GSM', '310 GSM'],
    ['Pocket Style', 'Front Kangaroo Pouch Pocket'],
    ['Hood Style', 'Double-Layer Hood with Drawstrings'],
    ['Sleeve Type', 'Full Sleeve with Heavy Ribbed Cuffs'],
    ['Interior', 'Soft Warm Brushed Fleece'],
    ['Options', 'Available in Pullover or Full Zip Front']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898117/turba_products/prod_17_BLACK_1.jpg',
  catPage: 'Page 05'
});

drawProductCard({
  name: 'Rufty Stand Collar HighNeck Winter Jacket',
  price: '795 / pc',
  moq: '10 pcs',
  jdColor: 'Black-Red, Black-Blue, Black-Green, Black-White, Charcoal, Grey Melange, Navy-White, Solid Red',
  jdMaterial: '100% Export Grade Heavy Cotton Fleece',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'Stand Collar Winter Jacket / HighNeck Zipper',
  jdUse: 'Corporate Winter Jackets, Outdoor Executive Workwear, Gifting',
  hsn: '6110',
  specs: [
    ['GSM', '340 GSM (Extreme Winter Grade)'],
    ['Closure', 'Full Front Heavy Duty Metallic / Nylon Zipper'],
    ['Collar Style', 'High-Neck Ribbed Stand Collar'],
    ['Pockets', '2 Deep Side Zipper Pockets'],
    ['Contrast Panels', 'Dual-Tone Contrast Sleeve & Shoulder Trims'],
    ['Hem', 'Heavy Elasticated Rib Hem & Cuffs']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898164/turba_products/prod_20_Black-Red_HighNeck_Front.jpg',
  catPage: 'Page 06'
});

// SECTION 3: CORPORATE WORKWEAR & UNIFORMS
drawSectionHeading('3. Corporate Workwear, Uniforms & Lab Coats', 'Industrial strength trousers, shirts and certified lab aprons');

drawProductCard({
  name: 'Magic FilaFil Corporate Shirt (Full / Half Sleeve)',
  price: '455 / pc',
  moq: '10 pcs',
  jdColor: 'Classic Blue, Sky Blue, Light Grey, White',
  jdMaterial: 'Poly-Cotton FilaFil Weave (Wrinkle Resistant)',
  jdSize: '38 (S), 40 (M), 42 (L), 44 (XL), 46 (XXL)',
  jdType: 'Corporate Uniform Shirt / Formal Work Shirt',
  jdUse: 'Corporate Office Uniform, Hotel Staff, Security & Sales Uniforms',
  hsn: '6211',
  specs: [
    ['Weave Structure', 'FilaFil Micro-Structure (Crisp Look)'],
    ['Sleeve Options', 'Full Sleeve (with 2-button adjustable cuff) / Half Sleeve'],
    ['Pocket', 'Single Reinforced Chest Pocket'],
    ['Collar Style', 'Regular Fused Stiff Collar'],
    ['Buttons', 'High Quality Break-Resistant Pearl Buttons'],
    ['Easy Care', 'Machine Washable, Low Maintenance Ironing']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898377/turba_products/prod_48_ABS-FIL_A_FIL.jpg',
  catPage: 'Page 11'
});

drawProductCard({
  name: 'Parkland Heavy Corporate & Industrial Trouser',
  price: '505 / pc',
  moq: '10 pcs',
  jdColor: 'Jet Black, Navy Blue',
  jdMaterial: 'Heavy Polyester-Viscose Suiting Fabric',
  jdSize: '28, 30, 32, 34, 36, 38, 40, 42',
  jdType: 'Workwear Trouser / Uniform Pants / Formal Pant',
  jdUse: 'Industrial Uniforms, Security Uniforms, Office Staff Pants',
  hsn: '6203',
  specs: [
    ['Stitching', 'Bar-tacked stress points for anti-tear durability'],
    ['Pockets', '2 Deep Slanted Side Pockets + 1 Back Button Pocket'],
    ['Closure', 'Heavy Duty Zip Fly with Button & Waist Hook'],
    ['Waistband', 'Inner Non-Slip Grip Waistband'],
    ['Fit', 'Comfort Straight Regular Fit'],
    ['Shrinkage', 'Pre-Shrunk, Zero Color Fading']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898435/turba_products/prod_51_ABS-PARKLAND-BLACK.jpg',
  catPage: 'Page 12'
});

drawProductCard({
  name: 'Lab Coat — Dankat (3-Pocket Doctor & Industrial Apron)',
  price: '245 / pc',
  moq: '10 pcs',
  jdColor: 'White, Navy Blue, Dark Grey',
  jdMaterial: 'Dankat Polyester-Cotton Drill Fabric',
  jdSize: '36, 38, 40, 42, 44, 46',
  jdType: 'Lab Coat / Medical Apron / Industrial Overcoat',
  jdUse: 'Doctors, Medical Students, Chemical Labs, Food Industries, Pharmacy',
  hsn: '6211',
  specs: [
    ['Pocket Layout', '3 Pockets (1 Chest Pen Pocket + 2 Large Lower Pockets)'],
    ['Closure', '4 Front Heavy-Duty Stitched Buttons'],
    ['Collar Style', 'Classic Notched Lapel Collar'],
    ['Back Construction', 'Back Slit & Half-Belt for Easy Mobility'],
    ['Chemical Resistance', 'Bleach & Chemical Wash Proof'],
    ['Length', 'Standard Knee Length']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898483/turba_products/prod_52_ABS-LABWORK-WHITE.jpg',
  catPage: 'Page 12'
});

// SECTION 4: TAILORING TURBA PREMIUM & OVERSIZED
drawSectionHeading('4. Tailoring Turba Premium & Streetwear', 'Flagship French Terry oversized and PIMA cotton collections');

drawProductCard({
  name: 'Oversized Originals (French Terry Drop-Shoulder)',
  price: '395 / pc',
  moq: '10 pcs',
  jdColor: 'Jet Black, White, Sage Green, Beige, Lavender (5 Colors)',
  jdMaterial: '100% Super Combed French Terry Cotton',
  jdSize: 'S, M, L, XL, XXL (Oversized Boxy Fit)',
  jdType: 'Oversized T-Shirt / Drop-Shoulder Streetwear Tee',
  jdUse: 'Streetwear Fashion, Brand Merchandise, Youth Corporate Gifting',
  hsn: '6105',
  specs: [
    ['GSM', '240 GSM (Heavyweight Looped Terry)'],
    ['Fit Type', 'Relaxed Oversized Drop-Shoulder Silhouette'],
    ['Neck Ribbing', 'Thick 1.25-inch Heavy Ribbed Crewneck'],
    ['Fabric Finish', 'Super Combed, Zero Pilling, Bio-Silicon Wash'],
    ['Sleeve Length', 'Extended Elbow-Length Sleeve'],
    ['Occasion', 'Premium Creator / Brand Merchandise']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784898496/turba_products/prod_59_Black.webp',
  catPage: 'Page 13'
});

drawProductCard({
  name: 'Tailoring Turba PIMA Cotton Premium Range',
  price: '250 – 475 / pc',
  moq: '10 pcs',
  jdColor: '10–12 Rich Colors (Black, White, French Navy, Olive, Burgundy, etc.)',
  jdMaterial: '100% Extra-Long Staple PIMA Cotton',
  jdSize: 'S, M, L, XL, XXL, 3XL',
  jdType: 'PIMA Crewneck T-Shirt / PIMA Polo T-Shirt',
  jdUse: 'C-Suite Executive Gifting, Luxury Uniforms, Premium Retail',
  hsn: '6105',
  specs: [
    ['Crewneck GSM', '185 GSM (Ultra-Soft PIMA Cotton)'],
    ['Polo GSM', '260 GSM (Mercerized PIMA Pique Knit)'],
    ['Staple Length', 'Extra Long Staple (ELS) 35mm Fibers'],
    ['Durability', '2x Stronger Than Standard Cotton, Zero Fading'],
    ['Collar (Polo)', 'Anti-Roll Knitted PIMA Collar'],
    ['Guarantee', '12 Month Premium Luxury Guarantee']
  ],
  mainImage: 'https://res.cloudinary.com/dkn3usjpn/image/upload/v1784897446/turba_products/prod_1_MDF01-Black-Profile.jpg',
  catPage: 'Pages 13 & 14'
});

// SECTION 5: LUXE CO-BRANDED CORPORATE APPAREL
drawSectionHeading('5. Luxe Co-Branded Corporate Wear & Gifting', 'Official co-branded merchandise for tier-1 corporate clients');

drawSectionHeading('5. Luxe Co-Branded Corporate Wear & Gifting', 'Official co-branded merchandise for tier-1 corporate clients');

drawProductCard({
  name: 'Adidas Cotton Tipping Polo (210 GSM)',
  price: '1,250 / pc',
  moq: '10 pcs',
  jdColor: 'Black, White, Navy Blue, Royal Blue, Green, Grey Melange',
  jdMaterial: '100% Premium Cotton Pique (210 GSM)',
  jdSize: 'S, M, L, XL, XXL',
  jdType: 'Branded Polo T-Shirt / Executive Polo',
  jdUse: 'Corporate Gifting, Executive Uniform, Sports Events',
  hsn: '6105',
  specs: [
    ['GSM', '210 GSM Combed Cotton'],
    ['Collar Style', 'Engineered Ribbed Collar with Contrast Tipping'],
    ['Moisture Wicking', 'High Breathability Active Comfort'],
    ['Customization', 'Direct Corporate Logo Embroidery on Chest/Sleeve'],
    ['Dispatch', '5 to 7 Days Delivery'],
    ['Authenticity', '100% Authentic Brand Sourced']
  ],
  mainImage: 'public/TT Luxe/extracted/adidas_100___cotton_tipping_tshirt_(210_gsm)_p2_3__Im46.jpg',
  catPage: 'Adidas Catalogue'
});

drawProductCard({
  name: 'Adidas Aeroready Performance Active Tee',
  price: '990 / pc',
  moq: '10 pcs',
  jdColor: 'Black, White, Navy Blue, Grey Melange, Royal Blue',
  jdMaterial: '100% Recycled Polyester (Climalite / Aeroready)',
  jdSize: 'S, M, L, XL, XXL',
  jdType: 'Performance Round Neck Tee / Active Sports Tee',
  jdUse: 'Sports Meets, Marathon Events, Gym Staff, Active Uniforms',
  hsn: '6105',
  specs: [
    ['GSM', '160–190 GSM'],
    ['Technology', 'Moisture-Wicking Aeroready / Climalite'],
    ['Ventilation', 'Underarm Mesh Cooling Panels'],
    ['Reflective Branding', 'High Visibility Reflective Brand Details'],
    ['Fit', 'Athletic Regular Fit'],
    ['Care', 'Quick Dry, Zero Wrinkle']
  ],
  mainImage: 'public/TT Luxe/extracted/adidas_100___cotton_tipping_tshirt_(210_gsm)_p4_17__Im68.jpg',
  catPage: 'Adidas Catalogue'
});

drawProductCard({
  name: 'Allen Solly Solid Casual / Executive Shirt',
  price: '1,690 / pc',
  moq: '10 pcs',
  jdColor: 'White, Light Blue, Pastel Yellow, Lilac, Soft Grey',
  jdMaterial: '100% Long-Staple Cotton (Poplin / Fine Oxford)',
  jdSize: '38 (S), 40 (M), 42 (L), 44 (XL), 46 (XXL)',
  jdType: 'Formal & Semi-Formal Executive Shirt',
  jdUse: 'Corporate Office Wear, Friday Dressing, Management Uniform',
  hsn: '6205',
  specs: [
    ['GSM', '140–190 GSM Long-Staple Cotton'],
    ['Finish', 'Easy-Iron Anti-Wrinkle Finish'],
    ['Collar Style', 'Button-Down Formal Collar with Stiff Stays'],
    ['Pocket', 'Single Reinforced Chest Pocket'],
    ['Customization', 'Computerized Monogram / Corporate Logo Embroidery'],
    ['Fit', 'Smart Modern Fit']
  ],
  mainImage: 'public/TT Luxe/extracted/allen_solly_new_1_p3_11__X20.jpg',
  catPage: 'Allen Solly New 1'
});

drawProductCard({
  name: 'Allen Solly Striped / Fine Knit Pique Polo',
  price: '1,190 / pc',
  moq: '10 pcs',
  jdColor: 'White, Navy Blue, Jet Black, Heather Grey',
  jdMaterial: '100% Pique Cotton (Organic Long-Staple)',
  jdSize: 'S, M, L, XL, XXL',
  jdType: 'Business Casual Polo T-Shirt',
  jdUse: 'Executive Offsites, Client Meetings, Corporate Uniforms',
  hsn: '6105',
  specs: [
    ['GSM', '220 GSM Pique Knit'],
    ['Pattern', 'Custom Contrast Knitted Striped Tipping'],
    ['Placket', 'Clean Finished 2-Button Placket'],
    ['Cuff', 'Non-Deforming Ribbed Armbands'],
    ['Fit', 'Slim / Contemporary Fit'],
    ['Handfeel', 'Super Soft Bio-Wash Feel']
  ],
  mainImage: 'public/TT Luxe/extracted/allen_solly_tshirts_catalogue_p4_9__Im0.jpg',
  catPage: 'Allen Solly Catalogue'
});

drawProductCard({
  name: 'Monte Carlo Soft-Knit Zipper Hoodie / Jacket',
  price: '2,490 / pc',
  moq: '10 pcs',
  jdColor: 'Charcoal Black, Slate Grey, Deep Navy Blue',
  jdMaterial: '340 GSM Heavyweight Brushed Cotton Fleece',
  jdSize: 'M, L, XL, XXL',
  jdType: 'Winter Zipper Jacket / Soft-Knit Hoodie',
  jdUse: 'Corporate Winter Gifting, Outdoor Executive Outerwear',
  hsn: '6110',
  specs: [
    ['GSM', '320–340 GSM Extreme Winter Warmth'],
    ['Zipper', 'Authentic Metallic YKK Heavy Zipper'],
    ['Pockets', 'Dual Deep Front Pockets with Reinforced Edges'],
    ['Hem & Cuffs', 'Heavy Ribbed Elasticated Hem & Cuffs'],
    ['Branding', 'Monte Carlo Genuine Metal Puller & Emblem'],
    ['Comfort', 'Super-Plush Thermal Interior Lining']
  ],
  mainImage: 'public/TT Luxe/extracted/monte_carlo_jacket_p3_middle.jpg',
  catPage: 'Monte Carlo Jacket'
});

drawProductCard({
  name: 'Monte Carlo Classic Oxford Shirt',
  price: '1,890 / pc',
  moq: '10 pcs',
  jdColor: 'Crisp White, Mint Green, Light Blue',
  jdMaterial: '100% Pure Oxford Cotton (Heavy Basket Weave)',
  jdSize: '38 (S), 40 (M), 42 (L), 44 (XL), 46 (XXL)',
  jdType: 'Oxford Button-Down Shirt / Executive Formal',
  jdUse: 'Boardroom Meetings, Corporate Conferences, Luxury Uniforms',
  hsn: '6205',
  specs: [
    ['GSM', '180 GSM Heavy Basket Weave'],
    ['Weave', 'Durable Two-Ply Oxford Weave'],
    ['Buttons', 'Premium Laser-Engraved Buttons'],
    ['Placket', 'Double-Stitched Clean Front Placket'],
    ['Collar', 'Button-Down Collar with Fused Interlining'],
    ['Fit', 'Classic Tailored Executive Fit']
  ],
  mainImage: 'public/TT Luxe/extracted/monte_carlo_oxford_shirt_pos2.jpg',
  catPage: 'Monte Carlo Oxford'
});

drawProductCard({
  name: 'US Polo Assn. Signature Pique Polo',
  price: '1,490 / pc',
  moq: '10 pcs',
  jdColor: 'Royal Blue, Jet Black, Forest Green, Classic White',
  jdMaterial: '100% Combed Cotton Heavy Pique (230 GSM)',
  jdSize: 'S, M, L, XL, XXL',
  jdType: 'Signature Double-Rider Polo T-Shirt',
  jdUse: 'Festive Corporate Gifting, Sports & Club Wear, Uniforms',
  hsn: '6105',
  specs: [
    ['GSM', '220–230 GSM'],
    ['Tails', 'Classic Tennis Tails (Longer Back Hem)'],
    ['Placket', 'Iconic Double-Button Stitched Placket'],
    ['Collar', 'Ribbed Non-Curling Soft Mercerized Collar'],
    ['Branding', 'Embroidered Double Horsemen Logo Option'],
    ['Durability', 'Color Fastness & Shape Retention Guaranteed']
  ],
  mainImage: 'public/TT Luxe/extracted/us_polo_premium_cotton_shirt_p3_13__Im53.jpg',
  catPage: 'US Polo Specs'
});

drawProductCard({
  name: 'US Polo Assn. Heritage Check & Cotton Shirt',
  price: '1,990 / pc',
  moq: '10 pcs',
  jdColor: 'Sky Blue Gingham, Navy Heritage Check, Classic White',
  jdMaterial: '100% Giza Cotton Twill / Fine Weave (135–200 GSM)',
  jdSize: '38 (S), 40 (M), 42 (L), 44 (XL), 46 (XXL)',
  jdType: 'Executive Check Shirt / Heritage Boardroom Shirt',
  jdUse: 'Senior Leadership Uniforms, VIP Corporate Gifting',
  hsn: '6205',
  specs: [
    ['GSM', '135–200 GSM Rich Twill Finish'],
    ['Collar', 'Stiff Fused Collar with Removable Collar Stays'],
    ['Hemline', 'Curved Hemline (Suitable Tucked in or Untucked)'],
    ['Yarn', 'Mercerized Egyptian Giza Cotton Yarn'],
    ['Cuff', 'Adjustable 2-Button Barrel Cuffs'],
    ['Finish', 'Silk-Touch Smooth Weave']
  ],
  mainImage: 'public/TT Luxe/extracted/us_polo_premium_cotton_shirt_p2_7__Im45.jpg',
  catPage: 'US Polo Specs'
});

// Footer Page Numbers
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.moveTo(45, doc.page.height - 35).lineTo(550, doc.page.height - 35).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
  doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(8);
  doc.text('Tailoring Turba — B2B Apparel Manufacturer & Wholesaler | Justdial Product Upload Directory', 45, doc.page.height - 28);
  doc.text(`Page ${i + 1} of ${range.count}`, 450, doc.page.height - 28, { width: 100, align: 'right' });
}

doc.end();

writeStream.on('finish', () => {
  console.log(`✅ PDF successfully generated at: ${outputPath}`);
});
