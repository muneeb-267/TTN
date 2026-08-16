import {
  DEPOSIT_RATE,
  LATE_CANCEL_PLATFORM_SHARE,
  LATE_CANCEL_TRAVELER_SHARE,
  MIN_DAYS_FOR_DEPOSIT,
  PLATFORM_FEE_RATE,
  REFUND_WINDOW_HOURS,
} from "./constants";
import { daysUntil, isWithinHours, startOfDay } from "./format";

export function quoteBooking(pricePerSeat: number, seatCount: number, departureAt: Date) {
  const totalPrice = pricePerSeat * seatCount;
  const days = daysUntil(departureAt);
  const depositEligible = days >= MIN_DAYS_FOR_DEPOSIT;
  const depositAmount = depositEligible ? Math.round(totalPrice * DEPOSIT_RATE) : totalPrice;
  const remainingAmount = totalPrice - depositAmount;
  const platformFee = Math.round(totalPrice * PLATFORM_FEE_RATE);
  const remainingDueDay = new Date(departureAt);
  remainingDueDay.setDate(remainingDueDay.getDate() - 1);
  const remainingDueAt = startOfDay(remainingDueDay);
  return {
    totalPrice,
    depositAmount,
    remainingAmount,
    platformFee,
    depositEligible,
    daysUntilDeparture: days,
    remainingDueAt,
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
  const platformKeep = Math.round(depositAmount * LATE_CANCEL_PLATFORM_SHARE);
  const travelerRefund = Math.round(depositAmount * LATE_CANCEL_TRAVELER_SHARE);
  const agencyKeep = depositAmount - platformKeep - travelerRefund;
  return { sameDay: false, within24h: false, travelerRefund, platformKeep, agencyKeep };
}
