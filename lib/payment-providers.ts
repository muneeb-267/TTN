/**
 * Payment provider abstraction for TTN marketplace collections.
 *
 * Live settlement (merchant vs sub-merchant vs agency P2P) must match the
 * approved JazzCash / EasyPaisa / bank arrangement. This layer does not
 * assume a normal merchant account can split marketplace payouts.
 *
 * Production must never treat a frontend "success" as paid. Confirmation
 * happens only through provider callbacks, webhooks, or staff matching.
 */

export type ProviderId = "jazzcash" | "easypaisa" | "bank" | "card" | "mock";

export type ProviderPaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type PaymentIntent = {
  provider: ProviderId;
  amountPkr: number;
  currency: "PKR";
  bookingRef: string;
  paymentId: string;
  description: string;
  returnUrl: string;
};

export type ProviderResult = {
  status: ProviderPaymentStatus;
  providerTxn?: string;
  raw?: Record<string, string>;
  failureReason?: string;
  developmentOnly?: boolean;
};

export interface PaymentProvider {
  id: ProviderId;
  label: string;
  configured(): boolean;
  /** Hosted checkout / redirect. Null means traveler pays the listed account and submits proof. */
  beginCheckout?(intent: PaymentIntent): Promise<{ action: string; fields: Record<string, string> } | null>;
  verifyCallback?(payload: Record<string, string>): Promise<ProviderResult>;
}

function mockAllowed() {
  return process.env.NODE_ENV !== "production" && process.env.PAYMENTS_MODE === "mock";
}

export const JazzCashProvider: PaymentProvider = {
  id: "jazzcash",
  label: "JazzCash",
  configured() {
    return Boolean(
      process.env.JAZZCASH_MERCHANT_ID &&
        process.env.JAZZCASH_PASSWORD &&
        process.env.JAZZCASH_INTEGRITY_SALT,
    );
  },
};

export const EasyPaisaProvider: PaymentProvider = {
  id: "easypaisa",
  label: "EasyPaisa",
  configured() {
    return Boolean(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY);
  },
};

export const ManualBankTransferProvider: PaymentProvider = {
  id: "bank",
  label: "Bank / Raast",
  configured() {
    return true;
  },
};

export const CardProvider: PaymentProvider = {
  id: "card",
  label: "Visa / Mastercard",
  configured() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  },
};

export const MockProvider: PaymentProvider = {
  id: "mock",
  label: "Mock (DEVELOPMENT ONLY)",
  configured: mockAllowed,
};

export function getPaymentProvider(id: ProviderId): PaymentProvider {
  const providers: Record<ProviderId, PaymentProvider> = {
    jazzcash: JazzCashProvider,
    easypaisa: EasyPaisaProvider,
    bank: ManualBankTransferProvider,
    card: CardProvider,
    mock: MockProvider,
  };
  return providers[id];
}

export function paymentEnvironment() {
  const mock = mockAllowed();
  return {
    mock,
    jazzcashGateway: JazzCashProvider.configured(),
    easypaisaGateway: EasyPaisaProvider.configured(),
    cardGateway: CardProvider.configured(),
    note: mock
      ? "DEVELOPMENT ONLY — mock payments must never mix with live ledgers."
      : "Wallet/bank collections stay pending until matched. Hosted gateways confirm only via callback/webhook. Card auto-split needs a connected payout account; JazzCash/EasyPaisa cannot split a normal merchant settlement.",
  };
}

export function mapStoreStatus(status: string): ProviderPaymentStatus {
  if (status === "CONFIRMED") return "SUCCESSFUL";
  if (status === "PENDING") return "PENDING";
  if (status === "FAILED") return "FAILED";
  if (status === "EXPIRED") return "EXPIRED";
  if (status === "REFUNDED") return "REFUNDED";
  return "INITIATED";
}
