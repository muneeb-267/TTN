import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compactIban,
  isPakIban,
  isPlaceholderIban,
  isPlaceholderWallet,
  realAccountText,
  assertServerEnv,
} from "../lib/env";

describe("Pakistani IBAN", () => {
  it("accepts a 24-character PK IBAN", () => {
    assert.equal(isPakIban("PK36 HABB 0000 0012 3456 7890"), true);
    assert.equal(compactIban("pk36habb0000001234567890"), "PK36HABB0000001234567890");
  });

  it("rejects placeholders and short values", () => {
    assert.equal(isPlaceholderIban(""), true);
    assert.equal(isPlaceholderIban("PK00MEZN0000000000000000"), true);
    assert.equal(isPakIban("PK00MEZN0000000000000000"), true);
    assert.equal(isPakIban("PK36HABB"), false);
  });
});

describe("wallet placeholders", () => {
  it("treats masked numbers as empty", () => {
    assert.equal(isPlaceholderWallet("03XXXXXXXXX"), true);
    assert.equal(realAccountText("03XXXXXXXXX"), "");
    assert.equal(realAccountText("03001234567"), "03001234567");
  });
});

describe("assertServerEnv", () => {
  it("refuses mock payments when NODE_ENV is production", () => {
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      PAYMENTS_MODE: process.env.PAYMENTS_MODE,
      AUTH_SECRET: process.env.AUTH_SECRET,
      APP_URL: process.env.APP_URL,
    };
    process.env.NODE_ENV = "production";
    process.env.PAYMENTS_MODE = "mock";
    process.env.AUTH_SECRET = "abcdefghijklmnopqrstuvwxyz012345";
    process.env.APP_URL = "http://localhost:3000";
    try {
      assert.throws(() => assertServerEnv(), /PAYMENTS_MODE=mock/);
    } finally {
      process.env.NODE_ENV = previous.NODE_ENV;
      process.env.PAYMENTS_MODE = previous.PAYMENTS_MODE;
      process.env.AUTH_SECRET = previous.AUTH_SECRET;
      process.env.APP_URL = previous.APP_URL;
    }
  });
});
