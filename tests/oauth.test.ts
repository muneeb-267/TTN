import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isOAuthProvider,
  normalizeEmail,
  oauthErrorCopy,
  oauthReturnPath,
  parseOAuthFrom,
  parseOAuthRole,
} from "../lib/oauth-shared";
import { pkrCopyAmount, transferCheckoutSteps, walletAppHref } from "../lib/wallet-checkout";

describe("oauth helpers", () => {
  it("normalizes emails", () => {
    assert.equal(normalizeEmail("  Sara@TTN.PK "), "sara@ttn.pk");
  });

  it("defaults unknown roles to traveler", () => {
    assert.equal(parseOAuthRole("AGENCY"), "AGENCY");
    assert.equal(parseOAuthRole("TRAVELER"), "TRAVELER");
    assert.equal(parseOAuthRole("ADMIN"), "TRAVELER");
    assert.equal(parseOAuthFrom("signup"), "signup");
    assert.equal(parseOAuthFrom(""), "login");
  });

  it("only treats google and apple as providers", () => {
    assert.equal(isOAuthProvider("google"), true);
    assert.equal(isOAuthProvider("apple"), true);
    assert.equal(isOAuthProvider("facebook"), false);
  });

  it("sends oauth errors back to the matching portal", () => {
    assert.equal(oauthReturnPath("TRAVELER", "login"), "/traveler/login");
    assert.equal(oauthReturnPath("TRAVELER", "signup"), "/traveler/signup");
    assert.equal(oauthReturnPath("AGENCY", "signup"), "/agency/login");
    assert.match(oauthErrorCopy("google_not_configured"), /GOOGLE_CLIENT_ID/);
    assert.match(oauthErrorCopy("nope"), /Try email/);
  });
});

describe("wallet checkout copy", () => {
  it("copies a plain PKR amount for wallet fields", () => {
    assert.equal(pkrCopyAmount(15500.4), "15500");
    assert.equal(walletAppHref("jazzcash"), "https://www.jazzcash.com.pk/");
    assert.equal(walletAppHref("easypaisa"), "https://easypaisa.com.pk/");
  });

  it("lists send-money steps with copyable number, amount, and booking ref", () => {
    const steps = transferCheckoutSteps({
      method: "jazzcash",
      payee: "Karakoram Coasters",
      account: "03215551234",
      amount: 15000,
      refCode: "TTN-ABC12",
    });
    assert.equal(steps.length, 5);
    assert.equal(steps[1]?.copy, "03215551234");
    assert.equal(steps[2]?.copy, "15000");
    assert.equal(steps[3]?.copy, "TTN-ABC12");
    assert.match(steps[4]?.detail || "", /pending/);
  });
});
