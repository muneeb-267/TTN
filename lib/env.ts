/**
 * Production env and payout-account guards.
 * Secrets stay in the host environment — never commit them.
 */

const DEV_AUTH_SECRET = "ttn-dev-auth-secret-change-in-production";

const PREVIEW_HOST =
  /localhost|127\.0\.0\.1|trycloudflare\.com|cursorvm\.com|cvm\.dev|pinggy|ngrok|loca\.lt|localhost\.run|lhr\.life|serveo\.net/i;

export function isProductionNode() {
  return process.env.NODE_ENV === "production";
}

/** True when this process is serving a public live site (not local / Cursor preview). */
export function isLivePublicDeploy() {
  if (!isProductionNode()) return false;
  if (process.env.TTN_ALLOW_PREVIEW === "1") return false;
  const url = (process.env.APP_URL || "").trim();
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return !PREVIEW_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function authSecretValue() {
  const value = (process.env.AUTH_SECRET || "").trim();
  if (isProductionNode()) {
    if (value.length < 32) {
      throw new Error(
        "AUTH_SECRET must be set to a random string of at least 32 characters before starting in production.",
      );
    }
    if (isLivePublicDeploy() && (value === DEV_AUTH_SECRET || /change-in-production/i.test(value))) {
      throw new Error("AUTH_SECRET is still the example value. Generate a new random secret for the live site.");
    }
    return value;
  }
  return value || DEV_AUTH_SECRET;
}

export function assertServerEnv() {
  if ((process.env.PAYMENTS_MODE || "").trim() === "mock" && isProductionNode()) {
    throw new Error("PAYMENTS_MODE=mock is not allowed when NODE_ENV=production.");
  }
  authSecretValue();
  if (isLivePublicDeploy()) {
    const url = (process.env.APP_URL || "").trim();
    if (!url.startsWith("https://")) {
      throw new Error("APP_URL must be the public https origin, for example https://www.example.com");
    }
  }
}

export function compactIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isPakIban(value: string) {
  return /^PK[0-9]{2}[A-Z]{4}[0-9]{16}$/.test(compactIban(value));
}

export function isPlaceholderIban(value: string) {
  const compact = compactIban(value);
  if (!compact) return true;
  return /^PK[0-9]{2}[A-Z]{4}0+$/.test(compact);
}

export function isPlaceholderWallet(value: string) {
  const raw = value.trim();
  if (!raw) return true;
  if (/x{3,}/i.test(raw)) return true;
  const digits = raw.replace(/\D/g, "");
  if (!digits || /^0+$/.test(digits)) return true;
  return false;
}

export function realAccountText(value: string | undefined | null) {
  const raw = (value || "").trim();
  if (!raw || isPlaceholderWallet(raw)) return "";
  return raw;
}

export function launchEnvStatus() {
  const secret = (process.env.AUTH_SECRET || "").trim();
  const appUrl = (process.env.APP_URL || "").trim();
  let publicHttps = false;
  try {
    publicHttps = Boolean(appUrl) && new URL(appUrl).protocol === "https:" && !PREVIEW_HOST.test(new URL(appUrl).hostname);
  } catch {
    publicHttps = false;
  }
  return {
    livePublic: isLivePublicDeploy(),
    authSecret: secret.length >= 32 && !/change-in-production/i.test(secret),
    appUrlHttps: publicHttps,
    paymentsMockOff: (process.env.PAYMENTS_MODE || "").trim() !== "mock",
    stripeKey: Boolean((process.env.STRIPE_SECRET_KEY || "").trim()),
    stripeWebhook: Boolean((process.env.STRIPE_WEBHOOK_SECRET || "").trim()),
    googleOAuth: Boolean((process.env.GOOGLE_CLIENT_ID || "").trim() && (process.env.GOOGLE_CLIENT_SECRET || "").trim()),
    appleOAuth: Boolean(
      (process.env.APPLE_CLIENT_ID || "").trim() &&
        (process.env.APPLE_TEAM_ID || "").trim() &&
        (process.env.APPLE_KEY_ID || "").trim() &&
        (process.env.APPLE_PRIVATE_KEY || "").trim(),
    ),
    jazzcashMerchant: Boolean(
      (process.env.JAZZCASH_MERCHANT_ID || "").trim() &&
        (process.env.JAZZCASH_PASSWORD || "").trim() &&
        (process.env.JAZZCASH_INTEGRITY_SALT || "").trim(),
    ),
    jazzcashProduction: (process.env.JAZZCASH_ENV || "").trim() === "production",
    easypaisaGateway: Boolean(
      (process.env.EASYPAISA_STORE_ID || "").trim() && (process.env.EASYPAISA_HASH_KEY || "").trim(),
    ),
    supportEmail: (process.env.SUPPORT_EMAIL || process.env.TTN_SUPPORT_EMAIL || "").trim(),
  };
}

export function supportEmail() {
  return (
    (process.env.SUPPORT_EMAIL || process.env.TTN_SUPPORT_EMAIL || "").trim() || "complaints@ttn.pk"
  );
}

/** Review/demo logins. Never on a real public domain unless SHOW_DEMO_ACCOUNTS=1. */
export function showReviewDemos() {
  const flag = (process.env.SHOW_DEMO_ACCOUNTS || "").trim();
  if (flag === "0") return false;
  if (flag === "1") return true;
  return !isLivePublicDeploy();
}

export const REVIEW_DEMOS = {
  traveler: { email: "sara@ttn.pk", password: "Travel123!", label: "Traveler" },
  agency: { email: "hunza@karakoram.pk", password: "Agency123!", label: "Agency" },
  agencyAlt: { email: "skardu@northstar.pk", password: "Agency123!", label: "Second agency" },
  admin: { email: "admin@ttn.pk", password: "TTN-Admin-2026", label: "Admin" },
} as const;
