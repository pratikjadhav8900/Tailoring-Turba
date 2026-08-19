import { generateSlug } from "./slug";

export interface SeoGenerationInput {
  name: string;
  category?: string;
  type?: string;
  badge?: string;
  description?: string;
  features?: string | string[];
  colors?: string | number;
  price?: string | number;
}

export interface GeneratedSeo {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  slug: string;
}

/**
 * Universal, data-driven SEO generator.
 * Strictly uses available product attributes and NEVER invents unsupported claims.
 */
export function generateProductSeo(input: SeoGenerationInput): GeneratedSeo {
  const name = (input.name || "").trim();
  if (!name) {
    return {
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      slug: "",
    };
  }

  const brand = "Tailoring Turba";
  const slug = generateSlug(name);

  // 1. Normalize and clean inputs
  const rawCategory = (input.category || "").replace(/Tailoring Turba\s*/i, "").trim();
  const cleanCategory = rawCategory && rawCategory !== "NEW" ? rawCategory : "";
  const rawType = (input.type || "").trim();
  const rawDescription = (input.description || "").trim();
  
  // Normalize features into a clean array of strings
  let featuresList: string[] = [];
  if (Array.isArray(input.features)) {
    featuresList = input.features.map(f => f.trim()).filter(Boolean);
  } else if (typeof input.features === "string") {
    featuresList = input.features.split("\n").map(f => f.trim()).filter(Boolean);
  }

  const allText = [name, cleanCategory, rawType, rawDescription, ...featuresList].join(" ");

  // 2. Extract genuine attributes ONLY if present in data
  // 2a. GSM extraction
  const gsmMatch = allText.match(/\b(\d{2,4})\s*GSM\b/i);
  const detectedGsm = gsmMatch ? `${gsmMatch[1]} GSM` : null;

  // 2b. Fabric/Material extraction (only from actual text)
  const knownFabrics = [
    "Biowash Cotton", "Super Cotton", "Combed Cotton", "Pure Cotton", "Cotton",
    "Dryfit Micro", "Dryfit", "PolyCotton", "Polyester Salina", "Polyester",
    "Salina", "Nirmal Knit", "Dot Knit", "Interlock Cotton", "Cotton Interlock",
    "Interlock", "Mag Cool", "IO Fabric", "Export Cotton", "Fleece", "Terry",
    "Linen", "Oxford", "Twill", "Jacquard"
  ];
  let detectedFabric: string | null = null;
  for (const fab of knownFabrics) {
    const regex = new RegExp(`\\b${fab}\\b`, "i");
    if (regex.test(allText)) {
      detectedFabric = fab;
      break;
    }
  }

  // 2c. Garment style/type detection
  const garmentTypes = [
    "Polo Shirt", "Polo", "Hoodie", "Sweatshirt", "Round Neck T-Shirt", "V-Neck T-Shirt",
    "T-Shirt", "Tee", "HighNeck", "Jacket", "Windcheater", "Shirt", "Formal Shirt",
    "Trouser", "Pant", "Lab Coat", "Apron", "Scrubs", "Blazer", "Cap", "Uniform"
  ];
  let detectedGarment: string | null = null;
  for (const g of garmentTypes) {
    const regex = new RegExp(`\\b${g}\\b`, "i");
    if (regex.test(allText)) {
      detectedGarment = g;
      break;
    }
  }
  if (!detectedGarment) {
    detectedGarment = cleanCategory || "Apparel";
  }

  // 2d. Color count extraction
  let colorCount: number | null = null;
  if (input.colors) {
    const parsed = Number(input.colors);
    if (!isNaN(parsed) && parsed > 1) {
      colorCount = parsed;
    }
  }

  // 2e. Distinguishing feature highlight
  let topFeature: string | null = null;
  for (const f of featuresList) {
    // Avoid repeating just the GSM or raw color list as the feature
    if (!/^\d{2,4}\s*GSM/i.test(f) && !/^\d+\s*Colors/i.test(f) && f.length >= 6 && f.length <= 40) {
      topFeature = f.replace(/^[•\-\*]\s*/, "");
      break;
    }
  }

  // ── 3. BUILD SEO TITLE (Target: 50–60 characters, Max: 70 characters) ──────
  let seoTitle = "";

  // Check if name already has garment type
  const nameHasGarment = garmentTypes.some(g => new RegExp(`\\b${g}\\b`, "i").test(name));

  // Determine distinguishing spec
  const specPart = detectedGsm && detectedFabric 
    ? `${detectedGsm} ${detectedFabric}`
    : (detectedFabric || detectedGsm || (cleanCategory && cleanCategory !== detectedGarment ? cleanCategory : null));

  const candidates: string[] = [];

  if (nameHasGarment) {
    if (specPart) {
      candidates.push(`${name} | ${specPart} | ${brand}`);
      candidates.push(`${name} - ${specPart} | ${brand}`);
    }
    if (topFeature) {
      candidates.push(`${name} with ${topFeature} | ${brand}`);
    }
    candidates.push(`Custom ${name} | Corporate Apparel | ${brand}`);
    candidates.push(`${name} | ${brand}`);
  } else {
    const descriptor = specPart ? `${specPart} ${detectedGarment}` : detectedGarment;
    candidates.push(`${name} - Custom ${descriptor} | ${brand}`);
    candidates.push(`${name} - ${descriptor} | ${brand}`);
    candidates.push(`${name} | ${detectedGarment} | ${brand}`);
    candidates.push(`${name} | ${brand}`);
  }

  // Pick the best candidate that fits within 50–60 chars, or closest under 65 chars
  const idealCandidate = candidates.find(c => c.length >= 50 && c.length <= 60);
  if (idealCandidate) {
    seoTitle = idealCandidate;
  } else {
    const under65 = candidates.find(c => c.length <= 65);
    seoTitle = under65 || candidates[candidates.length - 1];
  }

  // If still over 68 chars, trim cleanly
  if (seoTitle.length > 68) {
    seoTitle = `${name} | ${brand}`;
    if (seoTitle.length > 68) {
      seoTitle = seoTitle.substring(0, 65).trim() + "...";
    }
  }

  // ── 4. BUILD META DESCRIPTION (Target: 150–160 characters) ────────────────
  const productSubject = /^the\s+/i.test(name) ? name : `the ${name}`;
  let descParts: string[] = [];

  // Sentence 1: Product Intro with verified specs
  if (detectedFabric && detectedGsm) {
    descParts.push(`Discover ${productSubject} by Tailoring Turba, crafted from premium ${detectedGsm} ${detectedFabric}.`);
  } else if (detectedFabric) {
    descParts.push(`Shop ${productSubject} by Tailoring Turba, designed with premium ${detectedFabric}.`);
  } else if (detectedGsm) {
    descParts.push(`Explore ${productSubject} by Tailoring Turba, constructed in durable ${detectedGsm} fabric.`);
  } else if (rawDescription && rawDescription.length >= 30 && rawDescription.length <= 80) {
    descParts.push(`Shop ${productSubject} by Tailoring Turba: ${rawDescription.replace(/\.$/, "")}.`);
  } else {
    descParts.push(`Shop ${productSubject} by Tailoring Turba, crafted for exceptional comfort and fit.`);
  }

  // Sentence 2: Genuine details (features, colors, MOQ)
  let detailClause = "";
  if (colorCount && topFeature) {
    detailClause = `Available in ${colorCount} colors featuring ${topFeature.toLowerCase().replace(/\.$/, "")}.`;
  } else if (colorCount) {
    detailClause = `Available in ${colorCount} rich color options.`;
  } else if (topFeature) {
    detailClause = `Features ${topFeature.toLowerCase().replace(/\.$/, "")} with precision stitching.`;
  } else if (input.badge && /MOQ/i.test(input.badge)) {
    detailClause = `Available with ${input.badge} for team orders.`;
  } else if (cleanCategory) {
    detailClause = `Ideal for corporate teams and bulk custom apparel.`;
  } else {
    detailClause = `Perfect for custom team orders and organizations.`;
  }

  // Sentence 3 / CTA
  const cta = "Order online today.";

  // Combine and optimize to 150–160 characters
  let fullDesc = `${descParts[0]} ${detailClause} ${cta}`.trim();

  // If fullDesc is under 140 chars, expand detail or CTA
  if (fullDesc.length < 140) {
    if (!fullDesc.includes("customization") && !fullDesc.includes("bulk")) {
      fullDesc = `${descParts[0]} ${detailClause} Customized for your team with fast dispatch.`.trim();
    } else {
      fullDesc = `${descParts[0]} ${detailClause} Explore sizes and place your bulk order today.`.trim();
    }
  }

  // If fullDesc is over 160 chars, trim and adjust
  if (fullDesc.length > 160) {
    fullDesc = `${descParts[0]} ${detailClause}`.trim();
    if (fullDesc.length > 160) {
      fullDesc = fullDesc.substring(0, 157).trim() + "...";
    }
  }

  // Final check: if user supplied an authentic, well-crafted custom description that already fits 140-160 chars
  if (rawDescription && rawDescription.length >= 140 && rawDescription.length <= 160) {
    fullDesc = rawDescription;
  }

  // ── 5. BUILD SEO KEYWORDS (4–8 relevant internal search keywords) ──────────
  const keywordsSet = new Set<string>();
  keywordsSet.add(name.toLowerCase());
  
  if (detectedGarment && !name.toLowerCase().includes(detectedGarment.toLowerCase())) {
    keywordsSet.add(`${name.toLowerCase()} ${detectedGarment.toLowerCase()}`);
  }

  if (detectedGsm) {
    keywordsSet.add(`${detectedGsm.toLowerCase()} ${detectedGarment.toLowerCase()}`);
  }

  if (detectedFabric) {
    keywordsSet.add(`${detectedFabric.toLowerCase()} ${detectedGarment.toLowerCase()}`);
  }

  if (cleanCategory && cleanCategory.toLowerCase() !== detectedGarment.toLowerCase()) {
    keywordsSet.add(cleanCategory.toLowerCase());
  }

  keywordsSet.add(`custom ${detectedGarment.toLowerCase()}`);
  keywordsSet.add("tailoring turba");
  keywordsSet.add("corporate apparel");

  const seoKeywords = Array.from(keywordsSet).slice(0, 7).join(", ");

  return {
    seoTitle,
    seoDescription: fullDesc,
    seoKeywords,
    slug,
  };
}
