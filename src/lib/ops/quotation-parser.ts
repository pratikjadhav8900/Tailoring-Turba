import { GoogleGenAI } from "@google/genai";

export interface ParsedQuotationItem {
  productName: string;
  fabric?: string;
  brand?: string;
  garmentType?: string;
  color?: string;
  logoRequired?: boolean;
  logoName?: string;
  logoType?: string;
  logoPosition?: string;
  sizeRange?: string;
  sizeNote?: string;
  branding?: string;
  quantity: number;
  price: number;
  total: number;
  sizeBreakdown?: { [key: string]: number };
}

export interface ParsedQuotation {
  customerName: string;
  companyName: string;
  customerPhone: string;
  customerEmail: string;
  customerGstNumber: string;
  quotationNumber: string;
  quotationDate: string;
  dueDate: string;
  totalQuantity: number;
  totalAmount: number;
  amountPaid: number;
  advancePercentage: number;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: ParsedQuotationItem[];
  internalNote: string;
  rawText?: string;
}

/**
 * High-precision rule-based parser for Tailoring Turba / Indian B2B quotations.
 * Handles both plain text extractions (e.g. from pdf-parse) and OCR transcripts.
 */
export function parseQuotationText(text: string): ParsedQuotation {
  let customerName = "";
  let companyName = "";
  let customerPhone = "";
  let customerGstNumber = "";
  let customerEmail = "";

  // 1. Customer Name & Company Name
  const msMatch = text.match(/(?:M\/S|M\/s|Customer Detail[\s\S]*?M\/S)\s*([^\n\r]+)/i);
  if (msMatch) {
    companyName = msMatch[1].trim();
    customerName = companyName;
  }

  // Find Customer section
  const customerDetailIdx = text.indexOf("Customer Detail");
  const tableHeaderIdx = text.search(/Sr\.?\s*No\.?/i);
  const customerSection =
    customerDetailIdx !== -1
      ? text.substring(customerDetailIdx, tableHeaderIdx !== -1 ? tableHeaderIdx : undefined)
      : text;

  // Phone
  const phoneMatch = customerSection.match(/Phone\s*[:\s]*([0-9\+\-\s]{10,15})/i);
  if (phoneMatch) {
    customerPhone = phoneMatch[1].replace(/\D/g, "");
  }

  // Customer Email if present
  const emailMatch = customerSection.match(/Email\s*[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch && !emailMatch[1].toLowerCase().includes("tailoringturba")) {
    customerEmail = emailMatch[1].trim();
  }

  // GSTIN (15 chars)
  const gstMatches = [
    ...text.matchAll(
      /GSTIN\s*[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/gi
    ),
  ];
  if (gstMatches.length > 1) {
    const inCustomer = customerSection.match(
      /GSTIN\s*[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i
    );
    customerGstNumber = inCustomer ? inCustomer[1] : gstMatches[1][1];
  } else if (gstMatches.length === 1) {
    customerGstNumber = gstMatches[0][1];
  }

  // Address
  let street = "";
  let city = "";
  let state = "";
  let postalCode = "";

  const addrMatch = customerSection.match(/Address\s+([\s\S]*?)(?:Phone|GSTIN|Place of)/i);
  if (addrMatch) {
    const rawAddr = addrMatch[1].replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    const pinMatch = rawAddr.match(/\b(\d{6})\b/);
    if (pinMatch) postalCode = pinMatch[1];
    if (rawAddr.toLowerCase().includes("maharashtra")) state = "Maharashtra";
    if (rawAddr.toLowerCase().includes("pune")) city = "Pune";
    street = rawAddr
      .replace(/,\s*Pune.*$/i, "")
      .replace(/,\s*Maharashtra.*$/i, "")
      .replace(/\s*-\s*\d{6}$/, "")
      .trim();
  }

  // Quotation No & Date
  let quotationNumber = "";
  let quotationDate = "";
  let dueDate = "";

  const qNoMatch = text.match(/Quotation\s+No\.?\s*[:\s]*(\w+)/i);
  if (qNoMatch) quotationNumber = qNoMatch[1];

  const qDateMatch = text.match(/Quotation\s+Date\s*[:\s]*([0-9A-Za-z\-\/]+)/i);
  if (qDateMatch) quotationDate = qDateMatch[1];

  const cDateMatch = text.match(/Completion\s+Date\s*[:\s]*([0-9A-Za-z\-\/]+)/i);
  if (cDateMatch) dueDate = cDateMatch[1];

  // Total Quantity
  let totalQuantity = 0;
  const totalQtyMatch = text.match(/Total\s+([0-9]+(?:\.[0-9]+)?)\s+[0-9,]+/i);
  if (totalQtyMatch) {
    totalQuantity = Math.round(parseFloat(totalQtyMatch[1]));
  }

  // Total Amount After Tax
  let totalAmount = 0;
  const grandTotalMatch = text.match(
    /Total\s+Amount\s+After\s+Tax\s*[₹Rs\.\s]*([0-9,]+\.?[0-9]*)/i
  );
  if (grandTotalMatch) {
    totalAmount = Math.round(parseFloat(grandTotalMatch[1].replace(/,/g, "")));
  } else {
    const fallbackTotal = text.match(
      /Total\s+[0-9\.]+\s+[0-9,]+\.?[0-9]*\s+[0-9\.,\s]+([0-9,]+\.?[0-9]*)/i
    );
    if (fallbackTotal) {
      totalAmount = Math.round(parseFloat(fallbackTotal[1].replace(/,/g, "")));
    }
  }

  // Advance calculation from terms
  let advancePercentage = 60; // Default B2B industry standard is 60%
  const advMatch = text.match(/(\d+)%\s*advance/i);
  if (advMatch) {
    advancePercentage = parseInt(advMatch[1], 10);
  }
  const amountPaid = Math.round(totalAmount * (advancePercentage / 100));

  // Items extraction
  const items: ParsedQuotationItem[] = [];
  // Split on Sr. No. digits: e.g. \n1Customised or \n 1 Customised or \n1. Customised
  const itemBlocks = text.split(/(?=\n\s*[1-9]\d?\s*(?:[A-Za-z]|\.))/);

  for (const block of itemBlocks) {
    const srMatch = block.match(/^\s*([1-9]\d?)\s*([^\n\r]+)/);
    if (!srMatch) continue;

    let itemNameHeader = srMatch[2].trim();
    itemNameHeader = itemNameHeader.replace(/\s*-\s*[0-9,]+.*$/, "").trim();

    const isCharge =
      /charge|fee|service|shipping/i.test(itemNameHeader) &&
      !/t-shirt|shirt|polo|uniform|hoodie|pant|dungaree/i.test(itemNameHeader);

    const fabricMatch = block.match(/Fabric\s*:\s*([^\n\r]+)/i);
    const fabric = fabricMatch ? fabricMatch[1].trim() : "";

    const brandMatch = block.match(/(?:^|\n)\s*Brand\s*:\s*([^\n\r]*)/i);
    const brandRaw = brandMatch ? brandMatch[1].trim() : "";
    const brand = brandRaw.replace(/Type\s*:.*$/i, "").trim();

    const typeMatch = block.match(/(?:^|\n)\s*Type\s*:\s*([^\n\r]+)/i);
    const prodTypeMatch = block.match(/Products?\s*:\s*([^\n\r]+)/i);
    const garmentType = typeMatch
      ? typeMatch[1].trim()
      : prodTypeMatch
      ? prodTypeMatch[1].trim()
      : "";

    const colorMatch = block.match(/Color\s*:\s*([^\n\r]+)/i);
    const color = colorMatch ? colorMatch[1].trim() : "";

    const logoReqMatch = block.match(/Logo\s+required\s*:\s*([^\n\r]+)/i);
    const logoRequired = logoReqMatch
      ? /yes|true|required/i.test(logoReqMatch[1])
      : /embroidery|print|logo/i.test(block);

    const logoNameMatch = block.match(/(?:Logo\s+Name|Front\s+Logo)\s*:\s*([^\n\r]+)/i);
    const logoName = logoNameMatch
      ? logoNameMatch[1].trim()
      : block.includes("Spruce Up")
      ? "Spruce Up"
      : "";

    const logoTypeMatch = block.match(/Logo\s+Type\s*:\s*([^\n\r]+)/i);
    const logoType = logoTypeMatch
      ? logoTypeMatch[1].trim()
      : /embroidery/i.test(block)
      ? "Embroidery"
      : /dtf/i.test(block)
      ? "DTF"
      : /screen/i.test(block)
      ? "Screen Print"
      : "";

    const positionMatch = block.match(
      /Position\s*:\s*([\s\S]*?)(?=Size|Logo Size|Note|6[0-9]{3}|\d+\.\d+\s*(?:PCS|SET)|$)/i
    );
    const logoPosition = positionMatch
      ? positionMatch[1].replace(/\n+/g, " ").replace(/\s+/g, " ").trim()
      : "";

    const sizeRangeMatch = block.match(/(?:^|\n)\s*Size\s*:\s*([^\n\r]+)/i);
    const sizeRange = sizeRangeMatch ? sizeRangeMatch[1].trim() : "S - 2XL";

    const noteMatch = block.match(
      /Note\s*:\s*([\s\S]*?)(?=6[0-9]{3}|\d+\.\d+\s*(?:PCS|SET)|$)/i
    );
    const sizeNote = noteMatch
      ? noteMatch[1].replace(/\n+/g, " ").replace(/\s+/g, " ").trim()
      : "";

    let qty = 1;
    let rate = 0;
    let lineTotal = 0;

    if (isCharge) {
      const chargeMatch = block.match(/-\s*(\d+(?:\.\d+)?)\s*([\d,]+(?:\.\d+)?)/);
      if (chargeMatch) {
        qty = 1;
        rate = parseFloat(chargeMatch[1]);
        lineTotal = rate;
      }
    } else {
      // Vyapar glued table format: e.g. 6109 40.00 PCS 700.000 28,000.00
      const vyaparMatch = block.match(
        /(?:6\d{3})?(\d+(?:\.\d+)?)\s*(PCS|SET|NOS)\s*([0-9,]+\.[0-9]{3})([0-9,]+\.[0-9]{2})/i
      );
      if (vyaparMatch) {
        qty = Math.round(parseFloat(vyaparMatch[1]));
        rate = parseFloat(vyaparMatch[3].replace(/,/g, ""));
        lineTotal = parseFloat(vyaparMatch[4].replace(/,/g, ""));
      } else {
        // Fallback space separated format
        const pcsLine = block.match(
          /(?:[0-9]{4,8}\s+)?([0-9]+(?:\.[0-9]+)?)\s*(PCS|SET|NOS)\s+([0-9,]+(?:\.[0-9]+)?)/i
        );
        if (pcsLine) {
          qty = Math.round(parseFloat(pcsLine[1]));
          rate = parseFloat(pcsLine[3].replace(/,/g, ""));
          const afterPcs = block.substring(block.indexOf(pcsLine[0]));
          const trailingTokens = afterPcs.match(/([0-9,]+\.[0-9]{2})/g);
          if (trailingTokens && trailingTokens.length > 0) {
            lineTotal = parseFloat(
              trailingTokens[trailingTokens.length - 1].replace(/,/g, "")
            );
          } else {
            lineTotal = qty * rate;
          }
        } else {
          const fallbackNumLine = block.match(
            /([0-9]+)\s+(?:pieces?|pcs)?\s*[@xX]?\s*([0-9,]+(?:\.[0-9]+)?)/i
          );
          if (fallbackNumLine) {
            qty = Math.round(parseFloat(fallbackNumLine[1]));
            rate = parseFloat(fallbackNumLine[2].replace(/,/g, ""));
            lineTotal = qty * rate;
          }
        }
      }
    }

    const fullName =
      garmentType && !itemNameHeader.toLowerCase().includes(garmentType.toLowerCase())
        ? `${itemNameHeader} (${garmentType})`
        : itemNameHeader;

    let brandingParts: string[] = [];
    if (logoType) brandingParts.push(logoType);
    if (logoName) brandingParts.push(`Logo: ${logoName}`);
    if (logoPosition) brandingParts.push(logoPosition);

    let sizeBreakdown: { [key: string]: number } | undefined = undefined;
    if (!isCharge && qty > 0) {
      sizeBreakdown = { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 };
      const sizesList = ["S", "M", "L", "XL", "2XL"];
      const basePerSize = Math.floor(qty / sizesList.length);
      let rem = qty % sizesList.length;
      for (const s of sizesList) {
        sizeBreakdown[s] = basePerSize + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      }
    }

    items.push({
      productName: fullName,
      fabric: fabric || undefined,
      brand: brand || undefined,
      garmentType: garmentType || undefined,
      color: color || undefined,
      logoRequired,
      logoName: logoName || undefined,
      logoType: logoType || undefined,
      logoPosition: logoPosition || undefined,
      sizeRange: sizeRange || undefined,
      sizeNote: sizeNote || undefined,
      branding: brandingParts.length > 0 ? brandingParts.join(" - ") : undefined,
      quantity: qty,
      price: rate,
      total: lineTotal || qty * rate,
      sizeBreakdown,
    });
  }

  const internalNote = [
    quotationNumber ? `Quotation Ref: #${quotationNumber}` : "",
    quotationDate ? `Quotation Date: ${quotationDate}` : "",
    `Payment terms: ${advancePercentage}% advance`,
    text.includes("CDR File") ? "Logo format: CDR vector file required" : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    customerName: customerName || "Customer",
    companyName,
    customerPhone,
    customerEmail,
    customerGstNumber,
    quotationNumber,
    quotationDate,
    dueDate,
    totalQuantity:
      totalQuantity ||
      items.filter((i) => i.sizeBreakdown).reduce((s, i) => s + i.quantity, 0),
    totalAmount,
    amountPaid,
    advancePercentage,
    shippingAddress: street
      ? { street, city, state, postalCode, country: "India" }
      : undefined,
    items,
    internalNote,
    rawText: text.substring(0, 1000),
  };
}

/**
 * Parses quotation using Gemini AI Vision when image or multimodal input is supplied.
 */
export async function parseQuotationWithGemini(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedQuotation | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert OCR & B2B Quotation Parser for Tailoring Turba (apparel manufacturer).
Analyze this uploaded quotation document image/PDF and extract all the order details in strict JSON format.

JSON Schema:
{
  "customerName": "string (name of person or company from Customer Detail section)",
  "companyName": "string (company name under M/S)",
  "customerPhone": "string (phone/WhatsApp number under Customer Detail, 10 digits without country code)",
  "customerEmail": "string (optional)",
  "customerGstNumber": "string (15-character GST number under Customer Detail)",
  "quotationNumber": "string",
  "quotationDate": "string",
  "dueDate": "string (target completion date)",
  "totalQuantity": number (sum of pcs),
  "totalAmount": number (grand total amount after tax in INR),
  "advancePercentage": number (advance percentage mentioned in terms, e.g. 60),
  "amountPaid": number (totalAmount * advancePercentage / 100),
  "shippingAddress": {
    "street": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "India"
  },
  "items": [
    {
      "productName": "string (garment style e.g. Customised T-shirt Polo)",
      "fabric": "string (fabric blend e.g. Interlock, 100% Cotton)",
      "color": "string (e.g. Black, Navy Blue)",
      "branding": "string (embroidery/print details and logo placement)",
      "quantity": number,
      "price": number,
      "total": number,
      "sizeBreakdown": { "S": number, "M": number, "L": number, "XL": number, "2XL": number }
    }
  ],
  "internalNote": "string (summary of quotation #, payment terms, logo requirements)"
}

Return ONLY valid JSON matching this schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: buffer.toString("base64"),
                mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const jsonText = response.text || "";
    if (jsonText) {
      return JSON.parse(jsonText) as ParsedQuotation;
    }
  } catch (err) {
    console.warn("[QuotationParser] Gemini Vision extraction failed:", err);
  }

  return null;
}
