import {
  LATE_CANCEL_PLATFORM_SHARE,
  LATE_CANCEL_TRAVELER_SHARE,
  REFUND_WINDOW_HOURS,
} from "./constants";
import { daysUntil, isWithinHours, startOfDay } from "./format";
import { applyBps, DEFAULT_FINANCE_RATES, splitBookingAmounts, type FinanceRates } from "./money";

export type BookingQuote = {
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  platformFee: number;
  processingFee: number;
  agencySettlement: number;
  refundAmount: number;
  netRevenue: number;
  commissionBps: number;
  processingFeeBps: number;
  depositEligible: boolean;
  daysUntilDeparture: number;
  remainingDueAt: Date;
};

export function quoteBooking(
  pricePerSeat: number,
  seatCount: number,
  departureAt: Date,
  rates: FinanceRates = DEFAULT_FINANCE_RATES,
  now = new Date(),
): BookingQuote {
  const totalPrice = pricePerSeat * seatCount;
  const days = daysUntil(departureAt);
  const depositEligible = days >= rates.minDaysForDeposit;
  const depositAmount = depositEligible ? applyBps(totalPrice, rates.depositBps) : totalPrice;
  const remainingAmount = totalPrice - depositAmount;
  const split = splitBookingAmounts(totalPrice, rates);
  const remainingDueDay = new Date(departureAt);
  remainingDueDay.setDate(remainingDueDay.getDate() - rates.remainingDueDays);
  return {
    totalPrice,
    depositAmount,
    remainingAmount,
    platformFee: split.commission,
    processingFee: split.processingFee,
    agencySettlement: split.agencySettlement,
    refundAmount: 0,
    netRevenue: split.netRevenue,
    commissionBps: rates.commissionBps,
    processingFeeBps: rates.processingFeeBps,
    depositEligible,
    daysUntilDeparture: days,
    remainingDueAt: startOfDay(remainingDueDay),
  };
}

export function cancelSplit(depositAmount: number, bookedAt: Date, now = new Date()) {
  const within24h = isWithinHours(bookedAt, REFUND_WINDOW_HOURS, now);
  if (within24h) {
    return {
      sameDay: true,
      within24h: true,
      travelerRefund: depositAmount,
      platformKeep: 0,
      agencyKeep: 0,
    };
  }
  const platformKeep = applyBps(depositAmount, Math.round(LATE_CANCEL_PLATFORM_SHARE * 10_000));
  const travelerRefund = applyBps(depositAmount, Math.round(LATE_CANCEL_TRAVELER_SHARE * 10_000));
  const agencyKeep = depositAmount - platformKeep - travelerRefund;
  return { sameDay: false, within24h: false, travelerRefund, platformKeep, agencyKeep };
}

export { daysUntil };
