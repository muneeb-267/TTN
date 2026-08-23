/** Integer PKR amounts. Never use floating-point arithmetic for money. */

export const BPS_PER_UNIT = 10_000;

export function assertPkr(amount: number, label = "amount") {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`${label} must be a non-negative integer PKR amount.`);
  }
}

export function assertBps(bps: number, label = "rate") {
  if (!Number.isInteger(bps) || bps < 0 || bps > BPS_PER_UNIT) {
    throw new Error(`${label} must be an integer between 0 and 10000 basis points.`);
  }
}

/** Round half away from zero: (amount * bps) / 10000 */
export function applyBps(amountPkr: number, bps: number): number {
  assertPkr(amountPkr);
  assertBps(bps);
  if (amountPkr === 0 || bps === 0) return 0;
  const product = BigInt(amountPkr) * BigInt(bps);
  const denom = BigInt(BPS_PER_UNIT);
  const half = denom / BigInt(2);
  const rounded = (product + half) / denom;
  return Number(rounded);
}

export function formatBps(bps: number): string {
  assertBps(bps);
  const whole = Math.floor(bps / 100);
  const frac = bps % 100;
  if (frac === 0) return `${whole}%`;
  const decimals = frac % 10 === 0 ? 1 : 2;
  return `${(bps / 100).toFixed(decimals)}%`;
}

export type FinanceRates = {
  commissionBps: number;
  processingFeeBps: number;
  depositBps: number;
  minDaysForDeposit: number;
  remainingDueDays: number;
  seatHoldMinutes: number;
};

export const DEFAULT_FINANCE_RATES: FinanceRates = {
  commissionBps: 250,
  processingFeeBps: 0,
  depositBps: 5000,
  minDaysForDeposit: 6,
  remainingDueDays: 1,
  seatHoldMinutes: 10,
};

export function splitBookingAmounts(grossPkr: number, rates: Pick<FinanceRates, "commissionBps" | "processingFeeBps">) {
  assertPkr(grossPkr, "gross");
  const commission = applyBps(grossPkr, rates.commissionBps);
  const processingFee = applyBps(grossPkr, rates.processingFeeBps);
  const agencySettlement = grossPkr - commission - processingFee;
  const netRevenue = commission - processingFee;
  return {
    gross: grossPkr,
    commission,
    processingFee,
    agencySettlement,
    refundAmount: 0,
    netRevenue,
  };
}

/**
 * Split one traveler payment (deposit, remaining, or full) the same way as the booking:
 * platform cut = commission + configured processing bps; the rest is the agency share.
 * Stripe Checkout expects amounts in minor units (paisa for PKR in this codebase).
 */
export function splitPaymentAmounts(
  paymentPkr: number,
  rates: Pick<FinanceRates, "commissionBps" | "processingFeeBps">,
) {
  assertPkr(paymentPkr, "payment");
  const commission = applyBps(paymentPkr, rates.commissionBps);
  const processingFee = applyBps(paymentPkr, rates.processingFeeBps);
  let applicationFee = commission + processingFee;
  if (paymentPkr > 0 && applicationFee >= paymentPkr) {
    applicationFee = Math.max(0, paymentPkr - 1);
  }
  return {
    paymentPkr,
    commission,
    processingFee,
    applicationFee,
    agencyShare: paymentPkr - applicationFee,
  };
}

/** PKR rupees → Stripe minor units. Matches existing Checkout `unit_amount`. */
export function pkrToMinor(amountPkr: number) {
  assertPkr(amountPkr);
  return amountPkr * 100;
}
