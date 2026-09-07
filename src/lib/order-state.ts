/**
 * Tailoring Turba — Authoritative Order State Transition & Dispatch Gating Engine
 */

import { OrderStatus, Role } from '@prisma/client';
import { LedgerSummary } from './currency';

export interface TransitionValidationResult {
  allowed: boolean;
  code?: 'INVALID_TRANSITION' | 'DISPATCH_LOCKED' | 'UNAUTHORIZED_OVERRIDE' | 'MISSING_OVERRIDE_REASON';
  message?: string;
  isOverride?: boolean;
}

export interface TransitionOptions {
  userRole?: string;
  overrideConfirmed?: boolean;
  overrideReason?: string;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  PROCESSING: ['IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'DISPATCHED', 'SHIPPED', 'CANCELLED'],
  IN_PRODUCTION: ['QUALITY_CHECK', 'READY_TO_SHIP', 'CANCELLED'],
  QUALITY_CHECK: ['READY_TO_SHIP', 'IN_PRODUCTION'],
  READY_TO_SHIP: ['DISPATCHED', 'SHIPPED', 'IN_PRODUCTION', 'CANCELLED'],
  DISPATCHED: ['DELIVERED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  CATALOGUE_ENQUIRY: ['PENDING', 'CONFIRMED', 'CANCELLED'],
};

export function validateOrderTransition(
  currentStatus: OrderStatus | string,
  targetStatus: OrderStatus | string,
  ledger: LedgerSummary,
  options: TransitionOptions = {}
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      code: 'INVALID_TRANSITION',
      message: `Invalid order status transition from ${currentStatus} to ${targetStatus}.`,
    };
  }

  // Strict Dispatch Gating Rule: Locked if outstanding balance exists
  const isDispatching = targetStatus === 'DISPATCHED' || targetStatus === 'SHIPPED';
  if (isDispatching && ledger.balanceDuePaise > 0) {
    const isAdmin = options.userRole === 'ADMIN' || options.userRole === 'SUPER_ADMIN';

    if (!options.overrideConfirmed) {
      return {
        allowed: false,
        code: 'DISPATCH_LOCKED',
        message: `Dispatch is locked because this order has an unpaid balance of ₹${(ledger.balanceDuePaise / 100).toFixed(2)}. An authorized admin override is required to dispatch.`,
      };
    }

    if (!isAdmin) {
      return {
        allowed: false,
        code: 'UNAUTHORIZED_OVERRIDE',
        message: 'Only administrators can authorize a dispatch override for orders with an outstanding balance.',
      };
    }

    if (!options.overrideReason || options.overrideReason.trim().length < 5) {
      return {
        allowed: false,
        code: 'MISSING_OVERRIDE_REASON',
        message: 'A detailed reason (at least 5 characters) must be provided for a dispatch override.',
      };
    }

    return { allowed: true, isOverride: true };
  }

  return { allowed: true };
}
