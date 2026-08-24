import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { holdUntil, isPayCollection, listedPayMethods, manualPayMethods } from "../lib/payments";

describe("holdUntil", () => {
  it("adds seat-hold minutes to the start time", () => {
    const from = new Date("2026-08-20T12:00:00Z");
    assert.equal(holdUntil(from, 10).toISOString(), "2026-08-20T12:10:00.000Z");
  });
});

describe("pay collections", () => {
  it("accepts MANUAL and INSTANT only", () => {
    assert.equal(isPayCollection("MANUAL"), true);
    assert.equal(isPayCollection("INSTANT"), true);
    assert.equal(isPayCollection("manual"), false);
    assert.equal(isPayCollection("card"), false);
  });

  it("keeps card off the manual transfer list", () => {
    const methods = listedPayMethods(
      { bankName: "HBL", bankIban: "PK00" },
      { jazzcashNumber: "03001234567", easypaisaNumber: "" },
    );
    assert.deepEqual(
      methods.map((m) => m.id),
      ["bank", "jazzcash"],
    );
    assert.deepEqual(
      manualPayMethods(
        { bankName: "HBL", bankIban: "PK00" },
        { jazzcashNumber: "03001234567" },
      ).map((m) => m.id),
      ["bank", "jazzcash"],
    );
  });
});
