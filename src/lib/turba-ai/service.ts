import { GoogleGenAI } from "@google/genai";
import { findMatchingProducts } from "./catalog";
import { TurbaCustomerContext, TurbaMessage, TurbaQuickOption, RecommendedProduct } from "@/types/turba-ai";

const SYSTEM_PROMPT = `
You are "TURBA AI", the Senior Apparel Manufacturing Consultant at Tailoring Turba (India's premier B2B custom apparel manufacturer).
Your core philosophy: "Tell us what you need. We'll figure out the rest."

YOUR ROLE:
You guide customers through an orderly, consultative conversation to configure their custom apparel:
STEP 1: Garment Type / Occasion (T-Shirts, Polos, Hoodies, Sportswear, Corporate Uniforms)
STEP 2: Collar & Neck Style (Round Neck / Crewneck vs Collar Neck / Polo Collar vs V-Neck vs Hooded)
STEP 3: Fabric Type & Blend (100% Pure Cotton vs Poly-Cotton Mix vs 100% Polyester / Dryfit)
STEP 4: GSM / Fabric Weight (140-160 GSM lightweight vs 180-200 GSM standard vs 240-280 GSM heavyweight)
STEP 5: Branding & Logo Requirements (Embroidery vs Screen Printing vs DTF vs Plain Blanks)
STEP 6: RECOMMENDATION REVEAL -> ONLY at this final step do you output "shouldRecommendProducts": true!

CRITICAL RULES:
1. NEVER USE EMOJIS. Maintain a refined, elegant, professional luxury B2B atelier tone. Do not use cartoon emojis or informal icons in any messages or option labels.
2. DO NOT show or recommend products prematurely! During Steps 1 to 5, ask conversational questions and provide quick options. Set "shouldRecommendProducts": false until the collar, fabric, and GSM specifications are answered (or if the user explicitly says "show products" or "recommend now").
3. NEVER invent product names, prices, or specs. Tailoring Turba manufactures real garments (Bio-wash cotton tees, Dryfit sportswear, Computerized Tajima embroidery polos, fleece hoodies, corporate uniforms).
4. DO NOT ask 10 questions at once. Ask ONLY ONE logical question per response with 3 to 4 clean, clickable quick options.
5. REMEMBER what the customer already said. If they stated "50 oversized black round-neck cotton tees 180 GSM", skip already answered questions.
6. Provide clean, concise text chips (no emojis) for quick selection.
7. Always respond in clean JSON format matching the schema provided.
8. CRITICAL: NEVER confuse GSM fabric weight (e.g. 180 GSM, 200 GSM) with order quantity! 180 GSM is fabric thickness/weight, NOT 180 pieces of clothing. Leave "quantity" null or undefined unless the user explicitly requested a piece count (e.g. "I need 50 pieces").

FORMAT YOUR RESPONSE AS STRICT JSON:
{
  "replyText": "Refined, professional response answering the customer and asking the next logical question without emojis.",
  "quickOptions": [
    { "label": "Professional label (no emojis)", "value": "option_value" }
  ],
  "updatedContext": {
    "garmentType": "...",
    "collarType": "...",
    "fabricType": "...",
    "gsm": "...",
    "quantity": null,
    "brandingRequired": true,
    "logoPlacement": "...",
    "printingMethod": "..."
  },
  "shouldRecommendProducts": true | false
}
`;

export interface GenerateAiResponseInput {
  messages: TurbaMessage[];
  context: TurbaCustomerContext;
  conversationId?: string;
}

export interface GenerateAiResponseResult {
  message: TurbaMessage;
  updatedContext: TurbaCustomerContext;
}

// Helper to strip any Unicode emojis or pictographs (uses standard surrogate pairs, fully compatible with all TS targets)
function stripEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])|[\u2600-\u27BF\uFE00-\uFE0F]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function processConsultantChat({
  messages,
  context,
}: GenerateAiResponseInput): Promise<GenerateAiResponseResult> {
  const lastUserMsg = [...messages].reverse().find(m => m.sender === "user")?.text || "";
  const apiKey = process.env.GEMINI_API_KEY;

  let replyText = "";
  let quickOptions: TurbaQuickOption[] = [];
  let updatedContext: TurbaCustomerContext = { ...context };
  let shouldRecommend = false;

  // 1. Try Gemini API if key is configured
  if (apiKey && apiKey.trim() !== "") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const historySummary = messages.slice(-6).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");
      const prompt = `
Known customer context so far: ${JSON.stringify(context)}
Recent conversation:
${historySummary}

User's latest message: "${lastUserMsg}"

Consult the customer now according to your role and output strict JSON only:
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = response.text || "";
      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          replyText = stripEmojis(parsed.replyText || "");
          quickOptions = Array.isArray(parsed.quickOptions)
            ? parsed.quickOptions.map((opt: TurbaQuickOption) => ({
                label: stripEmojis(opt.label),
                value: opt.value,
              }))
            : [];
          updatedContext = { ...updatedContext, ...(parsed.updatedContext || {}) };
          shouldRecommend = Boolean(parsed.shouldRecommendProducts);
        } catch (jsonErr) {
          console.warn("[Turba AI] Failed to parse Gemini JSON:", jsonErr);
        }
      }
    } catch (apiError: any) {
      console.warn("[Turba AI] Gemini API request failed, utilizing rule consultant fallback:", apiError?.message || apiError);
    }
  }

  // 2. Intelligent Rule-Based Fallback Engine (Guaranteed zero-downtime B2B Apparel Consultant)
  if (!replyText) {
    const fallbackResult = runConsultantRuleEngine(lastUserMsg, context);
    replyText = stripEmojis(fallbackResult.replyText);
    quickOptions = fallbackResult.quickOptions.map(opt => ({
      label: stripEmojis(opt.label),
      value: opt.value,
    }));
    updatedContext = fallbackResult.updatedContext;
    shouldRecommend = fallbackResult.shouldRecommend;
  }

  // 3. Product Recommendation Engine — ONLY when all specifications are collected
  let recommendedProducts: RecommendedProduct[] | undefined = undefined;
  if (shouldRecommend) {
    recommendedProducts = await findMatchingProducts(updatedContext);
  }

  // 4. Build message object
  const newMsg: TurbaMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender: "assistant",
    text: replyText,
    timestamp: Date.now(),
    quickOptions: quickOptions.length > 0 ? quickOptions : undefined,
    recommendedProducts: recommendedProducts && recommendedProducts.length > 0 ? recommendedProducts : undefined,
    consultantSummary: {
      garment: updatedContext.garmentType,
      fabric: updatedContext.fabricPreference || updatedContext.fabricType,
      branding: updatedContext.brandingRequired ? (updatedContext.logoPlacement || "Yes") : "None",
      printMethod: updatedContext.printingMethod,
      quantity: updatedContext.quantity,
      readyToCustomize: Boolean(recommendedProducts && recommendedProducts.length > 0),
    },
  };

  return {
    message: newMsg,
    updatedContext,
  };
}

// Deterministic consultant engine matching Tailoring Turba B2B expertise
function runConsultantRuleEngine(
  userInput: string,
  currentCtx: TurbaCustomerContext
): {
  replyText: string;
  quickOptions: TurbaQuickOption[];
  updatedContext: TurbaCustomerContext;
  shouldRecommend: boolean;
} {
  const text = userInput.toLowerCase();
  const ctx: TurbaCustomerContext = { ...currentCtx };

  // Detect quantity: MUST have explicit quantity units or keywords, and MUST NOT be confused with GSM fabric weight
  const textWithoutGsm = text
    .replace(/\b\d{2,3}\s*[-–to]*\s*\d{2,3}\s*(?:gsm|gm|grams)\b/gi, "")
    .replace(/\b\d{2,3}\s*(?:gsm|gm|grams)\b/gi, "");

  const qtyMatch =
    textWithoutGsm.match(/\b(\d{1,5})\s+(?:pcs|pieces|tshirts|shirts|polos|hoodies|items|nos|units)\b/i) ||
    textWithoutGsm.match(/\b(?:quantity|qty|order|units?|pieces?)\s*:?\s*(\d{1,5})\b/i);

  if (qtyMatch && parseInt(qtyMatch[1], 10) >= 5) {
    ctx.quantity = parseInt(qtyMatch[1], 10);
  }

  // Detect garment type
  if (text.includes("polo")) {
    ctx.garmentType = "polo";
    ctx.collarType = "collar";
  } else if (
    text.includes("hoodie") || 
    text.includes("sweatshirt") || 
    text.includes("jacket") || 
    text.includes("winter") || 
    text.includes("outerwear") || 
    text.includes("fleece")
  ) {
    ctx.garmentType = "hoodie";
    ctx.collarType = "hooded";
  } else if (
    text.includes("sport") || 
    text.includes("active") || 
    text.includes("activewear") || 
    text.includes("performance") || 
    text.includes("athletic") || 
    text.includes("jersey") || 
    text.includes("gym") || 
    text.includes("dryfit") || 
    text.includes("dri-fit") || 
    text.includes("drifit") ||
    text.includes("tracksuit")
  ) {
    ctx.garmentType = "sportswear";
  } else if (
    text.includes("uniform") || 
    text.includes("corporate") || 
    text.includes("staff") || 
    text.includes("workwear") ||
    text.includes("industrial")
  ) {
    ctx.garmentType = "uniform";
  } else if (
    text.includes("t-shirt") || 
    text.includes("tshirt") || 
    text.includes("tee") || 
    text.includes("round neck") ||
    text.includes("apparel") ||
    text.includes("custom")
  ) {
    ctx.garmentType = "tshirt";
  }

  // Detect collar / neck type
  if (text.includes("round neck") || text.includes("crew neck") || text.includes("crewneck") || text.includes("round")) {
    ctx.collarType = "round-neck";
  } else if (text.includes("collar neck") || text.includes("collar") || text.includes("polo collar")) {
    ctx.collarType = "collar";
  } else if (text.includes("v-neck") || text.includes("v neck")) {
    ctx.collarType = "v-neck";
  } else if (text.includes("oversized") || text.includes("drop shoulder")) {
    ctx.collarType = "round-neck";
    ctx.fit = "oversized";
  }

  // Detect fabric type (cotton vs poly-cotton mix vs polyester/dryfit)
  if (text.includes("100% cotton") || text.includes("pure cotton") || (text.includes("cotton") && !text.includes("mix") && !text.includes("blend") && !text.includes("poly"))) {
    ctx.fabricType = "100% cotton";
    ctx.fabricPreference = "100% Pure Cotton Biowash";
  } else if (text.includes("mix") || text.includes("blend") || text.includes("poly-cotton") || text.includes("polycotton") || text.includes("io")) {
    ctx.fabricType = "poly-cotton";
    ctx.fabricPreference = "Poly-Cotton Mix (Durable)";
  } else if (text.includes("polyester") || text.includes("dryfit") || text.includes("micro") || text.includes("salina") || text.includes("nirmal")) {
    ctx.fabricType = "100% polyester";
    ctx.fabricPreference = "100% Polyester Micro Dryfit";
  }

  // Detect GSM
  const gsmMatch = text.match(/\b(\d{3})\s*gsm\b/);
  if (gsmMatch) {
    ctx.gsm = parseInt(gsmMatch[1]);
  } else if (text.includes("lightweight") || text.includes("140") || text.includes("160")) {
    ctx.gsm = "140-160 GSM";
  } else if (text.includes("180") || text.includes("200") || text.includes("standard")) {
    ctx.gsm = "180-200 GSM";
  } else if (text.includes("heavy") || text.includes("240") || text.includes("260") || text.includes("280") || text.includes("luxe")) {
    ctx.gsm = "240-280 GSM";
  }

  // Detect branding / logo
  if (text.includes("embroidery")) {
    ctx.brandingRequired = true;
    ctx.printingMethod = "embroidery";
    ctx.logoPlacement = ctx.logoPlacement || "left-chest";
  } else if (text.includes("screen") || text.includes("dtf") || text.includes("print")) {
    ctx.brandingRequired = true;
    ctx.printingMethod = text.includes("screen") ? "screen" : "dtf";
  } else if (text.includes("logo") || text.includes("brand")) {
    ctx.brandingRequired = true;
  } else if (text.includes("plain") || text.includes("blank") || text.includes("no logo")) {
    ctx.brandingRequired = false;
  }

  // Check if user specifically requested to view recommendations now
  const userWantsProductsNow = text.includes("show") || text.includes("recommend") || text.includes("product") || text.includes("catalogue") || text.includes("catalog");

  // Step 1: Garment Type
  if (!ctx.garmentType) {
    return {
      replyText: "Welcome to Tailoring Turba. What category of custom apparel are you looking to manufacture?",
      quickOptions: [
        { label: "Custom T-Shirts", value: "T-Shirts" },
        { label: "Corporate Polos", value: "Polos" },
        { label: "Hoodies & Fleece", value: "Hoodies" },
        { label: "Performance Activewear", value: "Sportswear" },
        { label: "Corporate Uniforms", value: "Uniforms" },
      ],
      updatedContext: ctx,
      shouldRecommend: false,
    };
  }

  // Step 2: Collar & Neck Style
  if (!ctx.collarType && ctx.garmentType !== "hoodie") {
    const garmentTitle =
      ctx.garmentType === "sportswear" ? "Performance Activewear" :
      ctx.garmentType === "tshirt" ? "T-Shirts" :
      ctx.garmentType === "polo" ? "Polos" :
      ctx.garmentType === "uniform" ? "Corporate Uniforms" : "Apparel";

    return {
      replyText: `Understood, custom ${garmentTitle}. Which collar or neckline construction do you require?`,
      quickOptions: [
        { label: "Round Neck (Crewneck)", value: "Round Neck" },
        { label: "Polo Collar", value: "Collar Neck" },
        { label: "V-Neck", value: "V-Neck" },
        { label: "Oversized Drop-Shoulder", value: "Oversized Round Neck" },
      ],
      updatedContext: ctx,
      shouldRecommend: false,
    };
  }

  // Step 3: Fabric Type (100% Cotton vs Poly-Cotton Mix vs 100% Polyester)
  if (!ctx.fabricType) {
    return {
      replyText: "Which fabric composition best fits your garments?",
      quickOptions: [
        { label: "100% Combed Cotton (Breathable)", value: "100% Pure Cotton" },
        { label: "Poly-Cotton Blend (Durable & Wrinkle-Resistant)", value: "Poly-Cotton Mix" },
        { label: "100% Polyester (Dryfit / Moisture-Wicking)", value: "100% Polyester Dryfit" },
        { label: "Recommend Best Fabric", value: "Recommend best fabric" },
      ],
      updatedContext: ctx,
      shouldRecommend: false,
    };
  }

  // Step 4: GSM / Fabric Weight
  if (!ctx.gsm) {
    return {
      replyText: "Do you have a target fabric weight (GSM) in mind?",
      quickOptions: [
        { label: "140–160 GSM (Lightweight)", value: "140-160 GSM Lightweight" },
        { label: "180–200 GSM (Standard Daily)", value: "180-200 GSM Standard" },
        { label: "240–280 GSM (Heavyweight Premium)", value: "240-280 GSM Heavyweight" },
        { label: "Standard Weight (180 GSM)", value: "Standard 180 GSM" },
      ],
      updatedContext: ctx,
      shouldRecommend: false,
    };
  }

  // Step 5: Branding / Logo Requirements
  if (ctx.brandingRequired === undefined && !userWantsProductsNow) {
    return {
      replyText: "Will you require custom branding (embroidery, screen print, or DTF)?",
      quickOptions: [
        { label: "Left Chest Embroidery", value: "Left Chest Embroidery" },
        { label: "Front Screen / DTF Print", value: "Front DTF Screen Print" },
        { label: "Front & Back Print", value: "Front and Back print" },
        { label: "Plain Blanks (Unbranded)", value: "Plain blanks, no logo" },
      ],
      updatedContext: ctx,
      shouldRecommend: false,
    };
  }

  // Step 6: ALL SPECIFICATIONS GATHERED -> REVEAL MATCHING PRODUCTS!
  if (ctx.brandingRequired && !ctx.printingMethod) {
    if (ctx.collarType === "collar" || ctx.garmentType === "polo") {
      ctx.printingMethod = "embroidery";
    } else if (ctx.fabricType === "100% polyester") {
      ctx.printingMethod = "sublimation";
    } else {
      ctx.printingMethod = (ctx.quantity && ctx.quantity >= 50) ? "screen" : "dtf";
    }
  }

  const collarSummary = ctx.collarType === "collar" ? "Collar Neck" : ctx.collarType === "round-neck" ? "Round Neck" : (ctx.collarType || "Standard");
  const fabricSummary = ctx.fabricType === "100% cotton" ? "100% Pure Cotton" : ctx.fabricType === "poly-cotton" ? "Poly-Cotton Mix" : (ctx.fabricType || "Cotton");
  const gsmSummary = ctx.gsm ? `${ctx.gsm}` : "180 GSM";
  const brandingSummary = ctx.brandingRequired 
    ? (ctx.printingMethod === "embroidery" ? "Computerized Embroidery" : ctx.printingMethod === "screen" ? "Screen Printing" : "DTF Printing")
    : "Plain blanks";

  return {
    replyText: `Here is your configured apparel specification:
• Style: ${collarSummary} ${ctx.garmentType ? ctx.garmentType.toUpperCase() : "GARMENT"}
• Fabric: ${fabricSummary} (${gsmSummary})
• Branding: ${brandingSummary}${ctx.quantity ? `\n• Target Quantity: ${ctx.quantity} pcs` : ""}

Here are the matching products from our factory catalog. Click Details to review or Customize to launch the Design Studio:`,
    quickOptions: [
      { label: "Open in Design Studio", value: "Open in Customizer" },
      { label: "Adjust Fabric or GSM", value: "Change fabric" },
      { label: "Speak with Factory Specialist", value: "WhatsApp assistance" },
    ],
    updatedContext: ctx,
    shouldRecommend: true,
  };
}
