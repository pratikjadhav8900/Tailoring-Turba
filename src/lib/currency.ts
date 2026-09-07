/**
 * Tailoring Turba — Currency & Financial Ledger Arithmetic Utilities
 * 
 * Strict standard: All monetary values in the financial ledger are integer paise (1 INR = 100 paise).
 * No floating point math is permitted in accounting invariants.
 */

export function rupeesToPaise(rupees: number): number {
  if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return paise / 100;
}

export function formatPaiseToINR(paise: number, includeDecimals = true): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

export function formatRupeesToINR(rupees: number, includeDecimals = true): string {
  return formatPaiseToINR(rupeesToPaise(rupees), includeDecimals);
}

export interface LedgerSummary {
  orderTotalPaise: number;
  grossPaidPaise: number;
  totalRefundedPaise: number;
  netPaidPaise: number;
  balanceDuePaise: number;
  isPaidInFull: boolean;
}

/**
 * Computes authoritative financial metrics directly from an array of PaymentTransaction records.
 * Decoupled from 60/40 splits; works for arbitrary partial, manual, full, or refund transactions.
 */
export function calculateLedgerFromTransactions(
  orderTotalPaise: number,
  transactions: Array<{
    amountPaise: number;
    status: 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
    type: 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  }>
): LedgerSummary {
  let grossPaidPaise = 0;
  let totalRefundedPaise = 0;

  for (const tx of transactions) {
    if (tx.status === 'CAPTURED') {
      if (tx.type === 'PAYMENT' || tx.type === 'ADJUSTMENT') {
        grossPaidPaise += tx.amountPaise;
      } else if (tx.type === 'REFUND') {
        totalRefundedPaise += tx.amountPaise;
      }
    }
  }

  const netPaidPaise = Math.max(0, grossPaidPaise - totalRefundedPaise);
  const balanceDuePaise = Math.max(0, orderTotalPaise - netPaidPaise);

  return {
    orderTotalPaise,
    grossPaidPaise,
    totalRefundedPaise,
    netPaidPaise,
    balanceDuePaise,
    isPaidInFull: balanceDuePaise === 0,
  };
}
