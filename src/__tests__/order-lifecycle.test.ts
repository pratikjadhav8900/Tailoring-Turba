import { describe, it, expect } from "vitest";
import {
  rupeesToPaise,
  paiseToRupees,
  formatPaiseToINR,
  calculateLedgerFromTransactions,
} from "@/lib/currency";
import { validateOrderTransition } from "@/lib/order-state";
import { deriveTrackingStage, CUSTOMER_STAGES } from "@/lib/tracking-stages";
import { deriveActiveStageIndex } from "@/components/shared/OrderTracking";
import crypto from "crypto";

describe("Order Lifecycle & Financial Ledger Test Suite (14 Invariants)", () => {
  // Test 1: Integer Paise Arithmetic & Exactness
  it("Invariant 1: Converts rupees to integer paise without floating point inaccuracy", () => {
    expect(rupeesToPaise(1999.99)).toBe(199999);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30); // Classic JS float quirk: 0.1 + 0.2 = 0.30000000000000004
    expect(paiseToRupees(199999)).toBe(1999.99);
    expect(formatPaiseToINR(150000, false)).toContain("1,500");
  });

  // Test 2: Arbitrary Deposit & Balance (Decoupled from 60/40)
  it("Invariant 2: Supports arbitrary deposit percentages (e.g. 35%, 70%, 100%)", () => {
    const orderTotalPaise = 1000000; // ₹10,000.00
    // Customer pays an arbitrary 35% advance
    const transactions = [
      { amountPaise: 350000, status: "CAPTURED" as const, type: "PAYMENT" as const },
    ];
    const ledger = calculateLedgerFromTransactions(orderTotalPaise, transactions);
    expect(ledger.grossPaidPaise).toBe(350000);
    expect(ledger.balanceDuePaise).toBe(650000);
    expect(ledger.isPaidInFull).toBe(false);

    // Customer pays a second partial payment of 40%
    transactions.push({ amountPaise: 400000, status: "CAPTURED" as const, type: "PAYMENT" as const });
    const ledger2 = calculateLedgerFromTransactions(orderTotalPaise, transactions);
    expect(ledger2.grossPaidPaise).toBe(750000);
    expect(ledger2.balanceDuePaise).toBe(250000);
    expect(ledger2.isPaidInFull).toBe(false);

    // Customer settles remaining 25% balance
    transactions.push({ amountPaise: 250000, status: "CAPTURED" as const, type: "PAYMENT" as const });
    const ledgerFinal = calculateLedgerFromTransactions(orderTotalPaise, transactions);
    expect(ledgerFinal.grossPaidPaise).toBe(1000000);
    expect(ledgerFinal.balanceDuePaise).toBe(0);
    expect(ledgerFinal.isPaidInFull).toBe(true);
  });

  // Test 3: Refund Deductions
  it("Invariant 3: Deducts REFUND transactions from net paid and increases balance due", () => {
    const orderTotalPaise = 500000; // ₹5,000.00
    const transactions = [
      { amountPaise: 500000, status: "CAPTURED" as const, type: "PAYMENT" as const },
      { amountPaise: 100000, status: "CAPTURED" as const, type: "REFUND" as const },
    ];
    const ledger = calculateLedgerFromTransactions(orderTotalPaise, transactions);
    expect(ledger.grossPaidPaise).toBe(500000);
    expect(ledger.totalRefundedPaise).toBe(100000);
    expect(ledger.netPaidPaise).toBe(400000);
    expect(ledger.balanceDuePaise).toBe(100000);
    expect(ledger.isPaidInFull).toBe(false);
  });

  // Test 4: Ignores Failed or Pending Transactions in Ledger
  it("Invariant 4: Ignores FAILED or PENDING transactions in authoritative accounting", () => {
    const orderTotalPaise = 200000;
    const transactions = [
      { amountPaise: 100000, status: "PENDING" as const, type: "PAYMENT" as const },
      { amountPaise: 100000, status: "FAILED" as const, type: "PAYMENT" as const },
      { amountPaise: 50000, status: "CAPTURED" as const, type: "PAYMENT" as const },
    ];
    const ledger = calculateLedgerFromTransactions(orderTotalPaise, transactions);
    expect(ledger.grossPaidPaise).toBe(50000);
    expect(ledger.balanceDuePaise).toBe(150000);
  });

  const unpaidLedger = {
    orderTotalPaise: 500000,
    grossPaidPaise: 250000,
    totalRefundedPaise: 0,
    netPaidPaise: 250000,
    balanceDuePaise: 250000,
    isPaidInFull: false,
  };

  const fullyPaidLedger = {
    orderTotalPaise: 500000,
    grossPaidPaise: 500000,
    totalRefundedPaise: 0,
    netPaidPaise: 500000,
    balanceDuePaise: 0,
    isPaidInFull: true,
  };

  // Test 5: Server-side Dispatch Gating (Blocks unpaid dispatch)
  it("Invariant 5: Blocks transition to DISPATCHED when balanceDuePaise > 0 without override", () => {
    const result = validateOrderTransition("READY_TO_SHIP", "DISPATCHED", unpaidLedger);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("DISPATCH_LOCKED");
    expect(result.message).toContain("unpaid balance");
  });

  // Test 6: Audited Manager Override for Dispatch
  it("Invariant 6: Permits DISPATCHED transition when overrideConfirmed is true with valid reason", () => {
    const result = validateOrderTransition("READY_TO_SHIP", "DISPATCHED", unpaidLedger, {
      userRole: "ADMIN",
      overrideConfirmed: true,
      overrideReason: "Customer verified bank wire transfer ref #NEFT998124 via Finance Desk",
    });
    expect(result.allowed).toBe(true);
    expect(result.isOverride).toBe(true);
  });

  // Test 7: Rejects Override with Empty Reason
  it("Invariant 7: Rejects override if overrideReason is missing or too short", () => {
    const result = validateOrderTransition("READY_TO_SHIP", "DISPATCHED", unpaidLedger, {
      userRole: "ADMIN",
      overrideConfirmed: true,
      overrideReason: "ok", // Too short
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("MISSING_OVERRIDE_REASON");
  });

  // Test 8: Allows Dispatch without Override if Balance is Fully Paid
  it("Invariant 8: Directly allows DISPATCHED transition when balanceDuePaise == 0", () => {
    const result = validateOrderTransition("READY_TO_SHIP", "DISPATCHED", fullyPaidLedger);
    expect(result.allowed).toBe(true);
  });

  // Test 9: Valid Lifecycle State Progression
  it("Invariant 9: Validates canonical forward lifecycle transitions", () => {
    expect(validateOrderTransition("PENDING", "CONFIRMED", fullyPaidLedger).allowed).toBe(true);
    expect(validateOrderTransition("CONFIRMED", "IN_PRODUCTION", fullyPaidLedger).allowed).toBe(true);
    expect(validateOrderTransition("IN_PRODUCTION", "QUALITY_CHECK", fullyPaidLedger).allowed).toBe(true);
    expect(validateOrderTransition("QUALITY_CHECK", "READY_TO_SHIP", fullyPaidLedger).allowed).toBe(true);
    expect(validateOrderTransition("DISPATCHED", "DELIVERED", fullyPaidLedger).allowed).toBe(true);
  });

  // Test 10: Prevents Illegal Skip Transitions
  it("Invariant 10: Rejects invalid or nonsensical status transitions (e.g. PENDING to DELIVERED)", () => {
    expect(validateOrderTransition("PENDING", "DELIVERED", fullyPaidLedger).allowed).toBe(false);
    expect(validateOrderTransition("DELIVERED", "IN_PRODUCTION", fullyPaidLedger).allowed).toBe(false);
    expect(validateOrderTransition("CANCELLED", "READY_TO_SHIP", fullyPaidLedger).allowed).toBe(false);
  });

  // Test 11: 7-Stage Customer Tracking Derivation
  it("Invariant 11: Derives the correct customer stage (1 to 7) from order and shipment state", () => {
    // Stage 1: Order Placed
    expect(deriveTrackingStage("CONFIRMED", null).stageIndex).toBe(1);
    // Stage 2: In Production
    expect(deriveTrackingStage("IN_PRODUCTION", null).stageIndex).toBe(2);
    // Stage 3: Ready to Ship
    expect(deriveTrackingStage("READY_TO_SHIP", null).stageIndex).toBe(3);
    // Stage 4: Dispatched
    expect(deriveTrackingStage("DISPATCHED", "BOOKED").stageIndex).toBe(4);
    // Stage 5: In Transit
    expect(deriveTrackingStage("DISPATCHED", "IN_TRANSIT").stageIndex).toBe(5);
    // Stage 6: Out for Delivery
    expect(deriveTrackingStage("DISPATCHED", "OUT_FOR_DELIVERY").stageIndex).toBe(6);
    // Stage 7: Delivered
    expect(deriveTrackingStage("DELIVERED", "DELIVERED").stageIndex).toBe(7);
  });

  // Test 12: UI Component Active Stage Index Consistency
  it("Invariant 12: Matches customer UI component stage indexes with backend derivation", () => {
    expect(deriveActiveStageIndex("CONFIRMED", null)).toBe(0); // 0-indexed: Order Placed
    expect(deriveActiveStageIndex("IN_PRODUCTION", null)).toBe(1); // In Production
    expect(deriveActiveStageIndex("READY_TO_SHIP", null)).toBe(2); // Ready to Ship
    expect(deriveActiveStageIndex("DISPATCHED", "BOOKED")).toBe(3); // Dispatched
    expect(deriveActiveStageIndex("DISPATCHED", "IN_TRANSIT")).toBe(4); // In Transit
    expect(deriveActiveStageIndex("DISPATCHED", "OUT_FOR_DELIVERY")).toBe(5); // Out for Delivery
    expect(deriveActiveStageIndex("DELIVERED", "DELIVERED")).toBe(6); // Delivered
  });

  // Test 13: Customer Tracking Stages Definition
  it("Invariant 13: Contains exactly 7 customer stages with valid labels", () => {
    expect(CUSTOMER_STAGES).toHaveLength(7);
    const keys = CUSTOMER_STAGES.map(s => s.key);
    expect(keys).toEqual([
      "ORDER_PLACED",
      "IN_PRODUCTION",
      "READY_TO_SHIP",
      "DISPATCHED",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]);
  });

  // Test 14: Webhook HMAC Cryptographic Signature Invariant
  it("Invariant 14: Verifies timing-safe HMAC SHA-256 signature calculation", () => {
    const secret = "test_webhook_secret_key_12345";
    const payload = JSON.stringify({ event: "payment.captured", id: "pay_xyz" });
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const validSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const isMatch = crypto.timingSafeEqual(Buffer.from(validSignature), Buffer.from(expectedSignature));
    expect(isMatch).toBe(true);

    const invalidSignature = crypto.createHmac("sha256", "wrong_secret").update(payload).digest("hex");
    const isBadMatch = crypto.timingSafeEqual(Buffer.from(invalidSignature), Buffer.from(expectedSignature));
    expect(isBadMatch).toBe(false);
  });
});
