import { prisma } from "@/lib/prisma";
import { getElementDetails } from "@/lib/customizer-utils";
import { DesignElement } from "@/types/customizer";

export interface PricingCartItem {
  productId?: string;
  quantity: number;
  price?: number; // Client-provided (untrusted diagnostics only)
  customStateJson?: string;
  printFiles?: string[];
  mockupUrl?: string;
  mockupUrlBack?: string;
  mockupUrlLeft?: string;
  mockupUrlRight?: string;
}

export interface AuthoritativeLineItem {
  productId: string;
  productName: string;
  quantity: number;
  baseUnitPrice: number;
  customUnitCharge: number;
  effectiveUnitPrice: number;
  lineTotal: number;
  customStateJson?: string;
  printFiles?: string[];
  mockupUrl?: string;
  mockupUrlBack?: string;
  mockupUrlLeft?: string;
  mockupUrlRight?: string;
}

export interface AuthoritativePricingResult {
  items: AuthoritativeLineItem[];
  subtotal: number;
  totalCustomCharge: number;
  tax: number;
  shipping: number;
  finalTotal: number;
  totalQuantity: number;
  isSplitPayment: boolean;
  chargeAmount: number;
  chargeAmountPaise: number;
  remainingAmount: number;
}

/**
 * Authoritative Server-Side Pricing Calculator
 * Computes exact order pricing strictly from verified database records.
 * Client-submitted prices and totals are never trusted.
 */
export async function calculateAuthoritativePricing(
  rawItems: PricingCartItem[],
  clientReportedAmount?: number
): Promise<AuthoritativePricingResult> {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Cart items are required to compute pricing.");
  }

  let defaultCustomProductId: string | null = null;
  const lineItems: AuthoritativeLineItem[] = [];

  let subtotal = 0;
  let totalCustomPrinting = 0;
  let totalEmbroiderySetupFees = 0;
  let totalQuantity = 0;

  for (let idx = 0; idx < rawItems.length; idx++) {
    const raw = rawItems[idx];

    // 1. Strict Quantity Validation
    if (typeof raw.quantity !== "number" || !Number.isInteger(raw.quantity)) {
      throw new Error(`Item at position ${idx + 1} has invalid quantity: must be an integer.`);
    }

    if (raw.quantity <= 0) {
      throw new Error(`Item at position ${idx + 1} has invalid quantity (${raw.quantity}): must be greater than 0.`);
    }

    if (raw.quantity > 5000) {
      throw new Error(`Item at position ${idx + 1} exceeds maximum allowable quantity (max 5,000 per line item).`);
    }

    // 2. Resolve Product ID & Fallback for customizer
    let targetProductId = raw.productId;
    if (!targetProductId) {
      if (!defaultCustomProductId) {
        let customProduct = await prisma.product.findFirst({
          where: { name: "Custom Design" },
        });
        if (!customProduct) {
          const category = await prisma.category.findFirst();
          if (!category) {
            throw new Error("Cannot initialize custom design: No categories exist in database.");
          }
          customProduct = await prisma.product.create({
            data: {
              name: "Custom Design",
              description: "User submitted custom design",
              basePrice: 85, // Authoritative default custom base price
              categoryId: category.id,
            },
          });
        }
        defaultCustomProductId = customProduct.id;
      }
      targetProductId = defaultCustomProductId;
    }

    // 3. Fetch Authoritative Product from Database
    const dbProduct = await prisma.product.findUnique({
      where: { id: targetProductId },
    });

    if (!dbProduct) {
      throw new Error(`Product with ID "${targetProductId}" not found in catalogue.`);
    }

    // Authoritative base unit price strictly from database
    const baseUnitPrice = Math.max(0, Number(dbProduct.basePrice) || 0);

    // 4. Calculate Custom Printing & Embroidery Charges Server-Side
    let unitCustomCharge = 0;
    let hasEmbroidery = false;

    if (raw.customStateJson) {
      // Any failure here MUST reject the order rather than silently charge ₹0 for the
      // custom print: that would let a malformed/tampered customStateJson get a free
      // custom garment. The customer-facing callers (e.g. /api/razorpay/order) already
      // catch thrown errors here and turn them into a 400 with the message below.
      let parsedState: any;
      try {
        parsedState = typeof raw.customStateJson === "string"
          ? JSON.parse(raw.customStateJson)
          : raw.customStateJson;
      } catch (e) {
        throw new Error(`Item at position ${idx + 1} has invalid design data (could not parse customStateJson).`);
      }

      const garmentType = parsedState?.garmentType || "round-neck";
      const frontElements: DesignElement[] = Array.isArray(parsedState?.frontElements) ? parsedState.frontElements : [];
      const backElements: DesignElement[] = Array.isArray(parsedState?.backElements) ? parsedState.backElements : [];
      const leftElements: DesignElement[] = Array.isArray(parsedState?.leftElements) ? parsedState.leftElements : [];
      const rightElements: DesignElement[] = Array.isArray(parsedState?.rightElements) ? parsedState.rightElements : [];

      const frontDetails = frontElements.map((el) => getElementDetails(el, garmentType, "front"));
      const backDetails = backElements.map((el) => getElementDetails(el, garmentType, "back"));
      // Left/right sleeve prints were previously never priced here even though the
      // customizer lets customers place them, the mockups show them, and Ops produces
      // them — every sleeve print shipped for free.
      const leftDetails = leftElements.map((el) => getElementDetails(el, garmentType, "left"));
      const rightDetails = rightElements.map((el) => getElementDetails(el, garmentType, "right"));

      const allDetails = [...frontDetails, ...backDetails, ...leftDetails, ...rightDetails];
      unitCustomCharge = allDetails.reduce((sum, el) => sum + (Number(el.cost) || 0), 0);

      hasEmbroidery = [...frontElements, ...backElements, ...leftElements, ...rightElements].some(
        (e) => e.printType === "embroidery"
      );
    }

    if (hasEmbroidery) {
      totalEmbroiderySetupFees += 300; // Flat setup fee per embroidery design
    }

    const effectiveUnitPrice = baseUnitPrice + unitCustomCharge;
    const itemSubtotal = baseUnitPrice * raw.quantity;
    const itemCustomSubtotal = unitCustomCharge * raw.quantity;

    subtotal += itemSubtotal;
    totalCustomPrinting += itemCustomSubtotal;
    totalQuantity += raw.quantity;

    lineItems.push({
      productId: dbProduct.id,
      productName: dbProduct.name,
      quantity: raw.quantity,
      baseUnitPrice,
      customUnitCharge: unitCustomCharge,
      effectiveUnitPrice,
      lineTotal: effectiveUnitPrice * raw.quantity,
      customStateJson: raw.customStateJson,
      printFiles: raw.printFiles,
      mockupUrl: raw.mockupUrl,
      mockupUrlBack: raw.mockupUrlBack,
      mockupUrlLeft: raw.mockupUrlLeft,
      mockupUrlRight: raw.mockupUrlRight,
    });
  }

  // 5. Total Custom Charges
  const totalCustomCharge = totalCustomPrinting + totalEmbroiderySetupFees;

  // 6. Tax Calculation (5% GST authoritative)
  const taxableBase = subtotal + totalCustomCharge;
  const tax = Math.round(taxableBase * 0.05);

  // 7. Authoritative Shipping
  const shipping = 0; // Standard free shipping policy

  // 8. Final Authoritative Total
  const finalTotal = taxableBase + tax + shipping;

  // 9. Split Payment Calculation (Bulk threshold: >= 10 pieces)
  const isSplitPayment = totalQuantity >= 10;
  const chargeAmount = isSplitPayment ? Math.round(finalTotal * 0.60) : finalTotal;
  const remainingAmount = isSplitPayment ? (finalTotal - chargeAmount) : 0;
  const chargeAmountPaise = Math.round(chargeAmount * 100);

  // Diagnostic log on client tampering attempt
  if (clientReportedAmount !== undefined && Math.abs(clientReportedAmount - finalTotal) > 1) {
    console.warn(
      `[SECURITY_AUDIT_C1] Client reported price mismatch: client sent ₹${clientReportedAmount}, authoritative calculation is ₹${finalTotal}. Overriding with authoritative server price.`
    );
  }

  return {
    items: lineItems,
    subtotal,
    totalCustomCharge,
    tax,
    shipping,
    finalTotal,
    totalQuantity,
    isSplitPayment,
    chargeAmount,
    chargeAmountPaise,
    remainingAmount,
  };
}
