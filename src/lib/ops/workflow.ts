import type { OpsProductionStage, OpsStageStatus } from "@prisma/client";

export const STAGE_SEQUENCE: OpsProductionStage[] = [
  "NEW_ORDER",
  "ORDER_CONFIRMED",
  "RESOURCE_FABRIC",
  "CUTTING",
  "STITCHING",
  "BRANDING_PRINTING",
  "QUALITY_CHECK",
  "PACKING",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "CLOSED",
];

export const STAGE_DISPLAY_NAMES: Record<OpsProductionStage, string> = {
  NEW_ORDER: "New Order",
  ORDER_CONFIRMED: "Order Confirmed",
  RESOURCE_FABRIC: "Resource / Fabric Allocation",
  CUTTING: "Pattern Cutting",
  STITCHING: "Garment Stitching",
  BRANDING_PRINTING: "Branding / Printing",
  QUALITY_CHECK: "Quality Inspection (QC)",
  PACKING: "Finishing & Packing",
  READY_FOR_DISPATCH: "Ready For Dispatch",
  DISPATCHED: "Dispatched",
  CLOSED: "Completed / Closed",
};

export const REWORKABLE_STAGES: OpsProductionStage[] = [
  "RESOURCE_FABRIC",
  "CUTTING",
  "STITCHING",
  "BRANDING_PRINTING",
];

export interface ValidationResult {
  allowed: boolean;
  isOverrideRequired?: boolean;
  error?: string;
  isRework?: boolean;
}

/**
 * Validates whether transitioning from currentStage to targetStage is allowed.
 * Prevents arbitrary skipping (e.g. CUTTING -> DISPATCHED) while enabling the
 * controlled rework loop (QUALITY_CHECK -> defective stage -> QUALITY_CHECK).
 */
export function validateStageTransition(
  currentStage: OpsProductionStage | null,
  targetStage: OpsProductionStage,
  currentStatus?: OpsStageStatus,
  isOverride = false,
  overrideReason?: string
): ValidationResult {
  // If order was newly created or has no opsStage yet, it must start at NEW_ORDER or ORDER_CONFIRMED
  if (!currentStage) {
    if (targetStage === "NEW_ORDER" || targetStage === "ORDER_CONFIRMED" || isOverride) {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `New orders must start at New Order or Order Confirmed. Target: ${targetStage}`,
    };
  }

  // Same stage transition is allowed (e.g. updating notes or completing current stage)
  if (currentStage === targetStage) {
    return { allowed: true };
  }

  const currentIndex = STAGE_SEQUENCE.indexOf(currentStage);
  const targetIndex = STAGE_SEQUENCE.indexOf(targetStage);

  if (currentIndex === -1 || targetIndex === -1) {
    return { allowed: false, error: "Invalid stage identifier." };
  }

  // 1. Rework return: If order was in FLAGGED_REWORK status at a reworkable stage,
  // completing it allows direct return to QUALITY_CHECK
  if (
    currentStatus === "FLAGGED_REWORK" &&
    REWORKABLE_STAGES.includes(currentStage) &&
    targetStage === "QUALITY_CHECK"
  ) {
    return { allowed: true, isRework: true };
  }

  // 2. Standard forward progression (exact next step)
  if (targetIndex === currentIndex + 1) {
    return { allowed: true };
  }

  // 3. Rework initiation from Quality Check to previous production stage
  if (currentStage === "QUALITY_CHECK" && REWORKABLE_STAGES.includes(targetStage)) {
    return { allowed: true, isRework: true };
  }

  // 4. Controlled Override (Workflow sequencing override — equal authority for all employees, requires audit reason)
  if (isOverride) {
    if (!overrideReason || overrideReason.trim().length < 5) {
      return {
        allowed: false,
        error: "An explicit override reason of at least 5 characters is required for out-of-sequence transitions.",
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
