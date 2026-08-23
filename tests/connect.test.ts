import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { destinationChargeParams, recipientTransfersActive } from "../lib/connect";
import { pkrToMinor, splitPaymentAmounts } from "../lib/money";

describe("splitPaymentAmounts", () => {
  it("cuts 2.5% on a deposit and leaves the rest for the agency", () => {
    const split = splitPaymentAmounts(30_000, { commissionBps: 250, processingFeeBps: 0 });
    assert.equal(split.applicationFee, 750);
    assert.equal(split.agencyShare, 29_250);
  });

  it("adds configured processing bps into the platform cut", () => {
    const split = splitPaymentAmounts(30_000, { commissionBps: 250, processingFeeBps: 200 });
    assert.equal(split.commission, 750);
    assert.equal(split.processingFee, 600);
    assert.equal(split.applicationFee, 1_350);
    assert.equal(split.agencyShare, 28_650);
  });

  it("never takes the whole payment as the fee", () => {
    const split = splitPaymentAmounts(1, { commissionBps: 250, processingFeeBps: 10_000 });
    assert.equal(split.applicationFee, 0);
    assert.equal(split.agencyShare, 1);
  });
});

describe("destinationChargeParams", () => {
  it("builds destination charge amounts in minor units", () => {
    const params = destinationChargeParams({
      amountPkr: 30_000,
      commissionBps: 250,
      processingFeeBps: 0,
      destinationAccountId: "acct_agency",
    });
    assert.ok(params);
    assert.equal(params.destination, "acct_agency");
    assert.equal(params.applicationFeePkr, 750);
    assert.equal(params.applicationFeeMinor, pkrToMinor(750));
    assert.equal(params.amountMinor, 3_000_000);
  });
});

describe("recipientTransfersActive", () => {
  it("requires an active stripe_transfers capability", () => {
    assert.equal(recipientTransfersActive({ id: "acct_1" }), false);
    assert.equal(
      recipientTransfersActive({
        id: "acct_1",
        configuration: {
          recipient: {
            capabilities: { stripe_balance: { stripe_transfers: { status: "pending" } } },
          },
        },
      }),
      false,
    );
    assert.equal(
      recipientTransfersActive({
        id: "acct_1",
        configuration: {
          recipient: {
            capabilities: { stripe_balance: { stripe_transfers: { status: "active" } } },
          },
        },
      }),
      true,
    );
  });
});
