import type { OpsProductionStage, OpsStageStatus } from "@prisma/client";

export const STAGE_SEQUENCE: OpsProductionStage[] = [
  "NEW_ORDER",
  "ORDER_CONFIRMED",
  "RESOURCE_FABRIC",
  "BRANDING_PRINTING",
  "PACKING",
  "DISPATCHED",
  "CLOSED",
];

export const STAGE_DISPLAY_NAMES: Record<OpsProductionStage, string> = {
  NEW_ORDER: "1. New Order",
  ORDER_CONFIRMED: "2. Order Accepted",
  RESOURCE_FABRIC: "3. Procurement",
  BRANDING_PRINTING: "4. Print / Embroidery",
  PACKING: "5. Press / Pack",
  DISPATCHED: "6. Dispatch",
  CLOSED: "7. Delivery",
  // Legacy aliases for backward safety
  CUTTING: "Pattern Cutting",
  STITCHING: "Garment Stitching",
  QUALITY_CHECK: "Quality Inspection (QC)",
  READY_FOR_DISPATCH: "Ready For Dispatch",
};

export const REWORKABLE_STAGES: OpsProductionStage[] = [
  "RESOURCE_FABRIC",
  "BRANDING_PRINTING",
  "PACKING",
];

export const ADVANCE_PAYMENT_PERCENTAGE = 60; // 60% advance required before Procurement

export interface AdvancePaymentStatus {
  totalAmount: number;
  amountPaid: number;
  requiredAdvance: number;
  remainingAdvance: number;
  isAdvanceCleared: boolean;
  currentPercentage: number;
  requiredPercentage: number;
}

export function calculateAdvancePaymentDetails(
  totalAmount: number,
  amountPaid: number
): AdvancePaymentStatus {
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  // Cap amountPaid at safeTotal so total received can never exceed 100% of the total order value
  const rawPaid = Math.max(0, Number(amountPaid) || 0);
  const safePaid = safeTotal > 0 ? Math.min(safeTotal, rawPaid) : rawPaid;
  const requiredAdvance = Math.round((safeTotal * ADVANCE_PAYMENT_PERCENTAGE) / 100);
  const remainingAdvance = Math.max(0, requiredAdvance - safePaid);
  const isAdvanceCleared = safeTotal === 0 || safePaid >= requiredAdvance;
  const currentPercentage =
    safeTotal > 0 ? Math.min(100, Math.round((safePaid / safeTotal) * 100)) : 100;

  return {
    totalAmount: safeTotal,
    amountPaid: safePaid,
    requiredAdvance,
    remainingAdvance,
    isAdvanceCleared,
    currentPercentage,
    requiredPercentage: ADVANCE_PAYMENT_PERCENTAGE,
  };
}

export interface SubtaskTemplate {
  key: string;
  title: string;
  defaultDescription: string;
  stage: OpsProductionStage;
}

export const STAGE_SUBTASKS: Record<OpsProductionStage, SubtaskTemplate[]> = {
  NEW_ORDER: [],
  ORDER_CONFIRMED: [],
  RESOURCE_FABRIC: [
    {
      key: "FABRIC_PROCUREMENT",
      title: "Fabric Procurement",
      defaultDescription: "Source & verify fabric meterage, color matching & GSM.",
      stage: "RESOURCE_FABRIC",
    },
    {
      key: "STITCHING",
      title: "Garment Stitching",
      defaultDescription: "Pattern cutting and garment stitching per size breakdown.",
      stage: "RESOURCE_FABRIC",
    },
  ],
  BRANDING_PRINTING: [
    {
      key: "PRINT_EMBROIDERY",
      title: "Print / Embroidery",
      defaultDescription: "Execute printing/embroidery placement with vendor or in-house.",
      stage: "BRANDING_PRINTING",
    },
  ],
  PACKING: [
    {
      key: "KAJE_BUTTON",
      title: "Kaje Button",
      defaultDescription: "Execute buttonholes (kaje) and stitch buttons on all pieces.",
      stage: "PACKING",
    },
    {
      key: "PRESSING_PACKING",
      title: "Press & Pack",
      defaultDescription: "Steam press / iron, attach brand tags, polybag packing.",
      stage: "PACKING",
    },
  ],
  DISPATCHED: [
    {
      key: "DISPATCH",
      title: "Dispatch & Shipping",
      defaultDescription: "Weigh carton, generate shipping label / courier handover.",
      stage: "DISPATCHED",
    },
  ],
  CLOSED: [
    {
      key: "DELIVERY",
      title: "Delivery & Final Payment",
      defaultDescription: "Deliver to client and verify 40% balance payment settlement.",
      stage: "CLOSED",
    },
  ],
  CUTTING: [],
  STITCHING: [],
  QUALITY_CHECK: [],
  READY_FOR_DISPATCH: [],
};

export interface ValidationResult {
  allowed: boolean;
  isOverrideRequired?: boolean;
  isPaymentBlocked?: boolean;
  error?: string;
  isRework?: boolean;
}

/**
 * Validates whether transitioning from currentStage to targetStage is allowed.
 * - Prevents skipping stages without override reason.
 * - Enforces the 60% advance payment rule between Step 2 (ORDER_CONFIRMED) and Step 3 (RESOURCE_FABRIC).
 */
export function validateStageTransition(
  currentStage: OpsProductionStage | null,
  targetStage: OpsProductionStage,
  currentStatus?: OpsStageStatus,
  isOverride = false,
  overrideReason?: string,
  paymentDetails?: { totalAmount: number; amountPaid: number }
): ValidationResult {
  // If order was newly created or has no opsStage yet, it must start at NEW_ORDER or ORDER_CONFIRMED
  if (!currentStage) {
    if (targetStage === "NEW_ORDER" || targetStage === "ORDER_CONFIRMED" || isOverride) {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `New orders must start at New Order or Order Accepted. Target: ${targetStage}`,
    };
  }

  // Same stage transition is allowed (e.g. updating notes or completing current stage)
  if (currentStage === targetStage) {
    return { allowed: true };
  }

  // Rework flow: returning from inspection/packing to earlier reworkable stage or returning back after rework
  if (
    (currentStage === "QUALITY_CHECK" || currentStage === "PACKING") &&
    REWORKABLE_STAGES.includes(targetStage)
  ) {
    return { allowed: true, isRework: true };
  }

  if (
    REWORKABLE_STAGES.includes(currentStage as OpsProductionStage) &&
    (targetStage === "QUALITY_CHECK" || targetStage === "PACKING") &&
    currentStatus === "FLAGGED_REWORK"
  ) {
    return { allowed: true, isRework: true };
  }

  const LEGACY_STAGE_INDEX: Partial<Record<OpsProductionStage, number>> = {
    CUTTING: 2,
    STITCHING: 3,
    QUALITY_CHECK: 4,
    READY_FOR_DISPATCH: 5,
  };

  const currentIndex =
    STAGE_SEQUENCE.indexOf(currentStage) !== -1
      ? STAGE_SEQUENCE.indexOf(currentStage)
      : LEGACY_STAGE_INDEX[currentStage] ?? -1;

  const targetIndex =
    STAGE_SEQUENCE.indexOf(targetStage) !== -1
      ? STAGE_SEQUENCE.indexOf(targetStage)
      : LEGACY_STAGE_INDEX[targetStage] ?? -1;

  if (currentIndex === -1 || targetIndex === -1) {
    return { allowed: false, error: "Invalid stage identifier." };
  }

  // 1. ADVANCE PAYMENT ENFORCEMENT (60% Rule):
  // Moving from Step 2 (ORDER_CONFIRMED) to Step 3 (RESOURCE_FABRIC) or any later stage
  // strictly requires at least 60% payment, unless management provides an explicit override.
  let paymentGateBypassed = false;
  if (
    currentStage === "ORDER_CONFIRMED" &&
    targetIndex > currentIndex &&
    paymentDetails
  ) {
    const payment = calculateAdvancePaymentDetails(
      paymentDetails.totalAmount,
      paymentDetails.amountPaid
    );

    if (!payment.isAdvanceCleared && !isOverride) {
      return {
        allowed: false,
        isPaymentBlocked: true,
        isOverrideRequired: true,
        error: `Cannot start Procurement: 60% advance payment required. Received ₹${payment.amountPaid.toLocaleString(
          "en-IN"
        )} of required ₹${payment.requiredAdvance.toLocaleString(
          "en-IN"
        )} (₹${payment.remainingAdvance.toLocaleString("en-IN")} pending).`,
      };
    }
    // Only true when the 60% gate had NOT actually been cleared and the override flag is
    // the only reason this transition is allowed to proceed below.
    paymentGateBypassed = !payment.isAdvanceCleared && isOverride;
  }

  // 2. Standard forward progression (exact next step). This used to unconditionally
  // return {allowed:true} with no isOverrideRequired flag even when the ONLY reason it
  // got this far was the payment-gate bypass above — silently erasing the one signal the
  // caller needs to record a real audit-trail entry for that bypass.
  if (targetIndex === currentIndex + 1) {
    return paymentGateBypassed ? { allowed: true, isOverrideRequired: true } : { allowed: true };
  }

  // 3. Controlled Override (Workflow sequencing override — requires audit reason)
  if (isOverride) {
    if (!overrideReason || overrideReason.trim().length < 5) {
      return {
        allowed: false,
        error:
          "An explicit override reason of at least 5 characters is required for out-of-sequence transitions.",
      };
    }
    return { allowed: true, isOverrideRequired: true };
  }

  return {
    allowed: false,
    error: `Invalid stage progression from ${STAGE_DISPLAY_NAMES[currentStage]} to ${STAGE_DISPLAY_NAMES[targetStage]}. Forward jumps require an explicit override reason.`,
    isOverrideRequired: true,
  };
}
