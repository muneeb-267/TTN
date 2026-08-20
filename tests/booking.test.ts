import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyBps, formatBps, splitBookingAmounts } from "../lib/money";
import { cancelSplit, quoteBooking } from "../lib/booking";
import { formatBookingRef } from "../lib/booking-ref";

describe("money", () => {
  it("applies 2.5% as 250 bps without floats", () => {
    assert.equal(applyBps(30_000, 250), 750);
    assert.equal(applyBps(60_000, 250), 1_500);
    assert.equal(applyBps(22_000, 250), 550);
  });

  it("formats basis points", () => {
    assert.equal(formatBps(250), "2.5%");
    assert.equal(formatBps(1000), "10%");
  });

  it("keeps financial lines separate", () => {
    const split = splitBookingAmounts(60_000, { commissionBps: 250, processingFeeBps: 0 });
    assert.equal(split.gross, 60_000);
    assert.equal(split.commission, 1_500);
    assert.equal(split.processingFee, 0);
    assert.equal(split.agencySettlement, 58_500);
    assert.equal(split.netRevenue, 1_500);
  });
});

describe("quoteBooking", () => {
  it("snapshots commission and deposit from rates", () => {
    const departure = new Date();
    departure.setDate(departure.getDate() + 10);
    const quote = quoteBooking(30_000, 2, departure, {
      commissionBps: 250,
      processingFeeBps: 0,
      depositBps: 5000,
      minDaysForDeposit: 6,
      remainingDueDays: 1,
      seatHoldMinutes: 10,
    });
    assert.equal(quote.totalPrice, 60_000);
    assert.equal(quote.depositAmount, 30_000);
    assert.equal(quote.remainingAmount, 30_000);
    assert.equal(quote.platformFee, 1_500);
    assert.equal(quote.agencySettlement, 58_500);
    assert.equal(quote.commissionBps, 250);
  });
});

describe("cancelSplit", () => {
  it("refunds the full deposit within 24 hours", () => {
    const split = cancelSplit(15_000, new Date(), new Date());
    assert.equal(split.travelerRefund, 15_000);
    assert.equal(split.platformKeep, 0);
  });

  it("splits a late cancel of the deposit with integer math", () => {
    const booked = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const split = cancelSplit(10_000, booked, new Date());
    assert.equal(split.platformKeep, 1_500);
    assert.equal(split.travelerRefund, 2_000);
    assert.equal(split.agencyKeep, 6_500);
  });
});

describe("booking ref", () => {
  it("formats TTN-YEAR-seq", () => {
    assert.equal(formatBookingRef(2026, 124), "TTN-2026-000124");
  });
});
