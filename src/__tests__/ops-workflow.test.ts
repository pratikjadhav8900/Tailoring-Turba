import { describe, it, expect } from "vitest";
import {
  validateStageTransition,
  STAGE_SEQUENCE,
  REWORKABLE_STAGES,
} from "@/lib/ops/workflow";

describe("Turba Ops Workflow State Machine", () => {
  it("allows sequential forward progression through standard pipeline", () => {
    for (let i = 0; i < STAGE_SEQUENCE.length - 1; i++) {
      const from = STAGE_SEQUENCE[i];
      const to = STAGE_SEQUENCE[i + 1];
      const result = validateStageTransition(from, to);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks arbitrary forward jumps without override", () => {
    const result = validateStageTransition("CUTTING", "DISPATCHED");
    expect(result.allowed).toBe(false);
    expect(result.isOverrideRequired).toBe(true);
    expect(result.error).toContain("Forward jumps require an explicit override reason");
  });

  it("permits out-of-sequence jumps when explicit override with reason is provided", () => {
    const result = validateStageTransition(
      "CUTTING",
      "DISPATCHED",
      "PENDING",
      true,
      "Urgent manual bypass authorized by founder"
    );
    expect(result.allowed).toBe(true);
  });

  it("rejects override if reason is missing or too short", () => {
    const result = validateStageTransition(
      "CUTTING",
      "DISPATCHED",
      "PENDING",
      true,
      "ok"
    );
    expect(result.allowed).toBe(false);
    expect(result.error).toContain("explicit override reason");
  });

  it("allows rework initiation from QUALITY_CHECK to previous production stages", () => {
    for (const stage of REWORKABLE_STAGES) {
      const result = validateStageTransition("QUALITY_CHECK", stage);
      expect(result.allowed).toBe(true);
      expect(result.isRework).toBe(true);
    }
  });

  it("allows reworked stage to return directly to QUALITY_CHECK once completed", () => {
    for (const stage of REWORKABLE_STAGES) {
      const result = validateStageTransition(stage, "QUALITY_CHECK", "FLAGGED_REWORK");
      expect(result.allowed).toBe(true);
      expect(result.isRework).toBe(true);
    }
  });
});
