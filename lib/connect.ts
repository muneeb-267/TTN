import { appBaseUrl } from "./payments";
import { pkrToMinor, splitPaymentAmounts } from "./money";
import { prisma } from "./prisma";
import { getStripe } from "./stripe";

export type ConnectDestination = {
  stripeAccountId: string;
  applicationFeePkr: number;
};

type RecipientAccount = {
  id: string;
  configuration?: {
    recipient?: {
      capabilities?: {
        stripe_balance?: {
          stripe_transfers?: { status?: string };
        };
      };
    };
  };
  requirements?: {
    summary?: {
      minimum_deadline?: string | null;
    };
    entries?: Array<{ status?: string }>;
  };
};

export function stripeConnectCountry() {
  return (process.env.STRIPE_CONNECT_COUNTRY || "pk").trim().toLowerCase() || "pk";
}

export function recipientTransfersActive(account: RecipientAccount | null | undefined) {
  return (
    account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ===
    "active"
  );
}

export function detailsSubmitted(account: RecipientAccount | null | undefined) {
  const entries = account?.requirements?.entries || [];
  return entries.every((entry) => entry.status !== "currently_due");
}

export function destinationChargeParams(input: {
  amountPkr: number;
  commissionBps: number;
  processingFeeBps: number;
  destinationAccountId: string;
}) {
  const split = splitPaymentAmounts(input.amountPkr, {
    commissionBps: input.commissionBps,
    processingFeeBps: input.processingFeeBps,
  });
  if (!input.destinationAccountId || split.applicationFee <= 0 && split.agencyShare <= 0) {
    return null;
  }
  return {
    destination: input.destinationAccountId,
    applicationFeePkr: split.applicationFee,
    agencySharePkr: split.agencyShare,
    applicationFeeMinor: pkrToMinor(split.applicationFee),
    amountMinor: pkrToMinor(input.amountPkr),
  };
}

export async function retrieveRecipientAccount(accountId: string) {
  const stripe = getStripe();
  if (!stripe) return null;
  return stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient", "requirements", "identity", "defaults"],
  }) as Promise<RecipientAccount>;
}

export async function syncAgencyConnect(agencyId: string) {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency?.stripeAccountId) return agency;
  try {
    const account = await retrieveRecipientAccount(agency.stripeAccountId);
    const ready = recipientTransfersActive(account);
    const submitted = detailsSubmitted(account);
    if (agency.stripePayoutsReady === ready && agency.stripeDetailsSubmitted === submitted) {
      return agency;
    }
    return prisma.agency.update({
      where: { id: agencyId },
      data: { stripePayoutsReady: ready, stripeDetailsSubmitted: submitted },
    });
  } catch {
    return agency;
  }
}

export async function syncConnectAccountByStripeId(accountId: string) {
  const agency = await prisma.agency.findFirst({ where: { stripeAccountId: accountId } });
  if (!agency) return null;
  return syncAgencyConnect(agency.id);
}

export async function ensureAgencyRecipientAccount(agencyId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payouts are not live yet. Add STRIPE_SECRET_KEY.");
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: { user: true },
  });
  if (!agency) throw new Error("Agency not found.");
  if (agency.stripeAccountId) {
    await syncAgencyConnect(agency.id);
    return agency.stripeAccountId;
  }

  const account = await stripe.v2.core.accounts.create({
    display_name: agency.businessName,
    contact_email: agency.user.email,
    dashboard: "express",
    defaults: {
      currency: "pkr",
      responsibilities: {
        fees_collector: "application",
        losses_collector: "application",
      },
      profile: {
        doing_business_as: agency.businessName,
        product_description: "Group tours in northern Pakistan listed on Travel To North.",
      },
    },
    identity: {
      country: stripeConnectCountry(),
      entity_type: "company",
      business_details: { registered_name: agency.businessName },
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
    metadata: { agencyId: agency.id },
  });

  await prisma.agency.update({
    where: { id: agency.id },
    data: { stripeAccountId: account.id, stripePayoutsReady: false, stripeDetailsSubmitted: false },
  });
  return account.id;
}

export async function createAgencyOnboardingLink(agencyId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payouts are not live yet. Add STRIPE_SECRET_KEY.");
  const accountId = await ensureAgencyRecipientAccount(agencyId);
  const base = await appBaseUrl();
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        refresh_url: `${base}/agency?connect=refresh`,
        return_url: `${base}/agency?connect=return`,
        collection_options: { fields: "eventually_due" },
      },
    },
  });
  if (!link.url) throw new Error("Stripe did not return an onboarding URL.");
  return link.url;
}

export async function createAgencyExpressLoginLink(accountId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payouts are not live yet. Add STRIPE_SECRET_KEY.");
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

export async function resolveCardDestination(input: {
  agencyId: string;
  amountPkr: number;
  commissionBps: number;
  processingFeeBps: number;
  diverted: boolean;
}): Promise<ConnectDestination | null> {
  if (input.diverted) return null;
  const agency = await syncAgencyConnect(input.agencyId);
  if (!agency?.stripeAccountId || !agency.stripePayoutsReady) return null;
  const live = await retrieveRecipientAccount(agency.stripeAccountId);
  if (!recipientTransfersActive(live)) {
    await prisma.agency.update({
      where: { id: agency.id },
      data: { stripePayoutsReady: false },
    });
    return null;
  }
  const params = destinationChargeParams({
    amountPkr: input.amountPkr,
    commissionBps: input.commissionBps,
    processingFeeBps: input.processingFeeBps,
    destinationAccountId: agency.stripeAccountId,
  });
  if (!params) return null;
  return {
    stripeAccountId: params.destination,
    applicationFeePkr: params.applicationFeePkr,
  };
}

export async function connectTransferredPkr(agencyId: string) {
  const rows = await prisma.payment.findMany({
    where: {
      autoSplit: true,
      status: "CONFIRMED",
      booking: { trip: { agencyId } },
    },
    select: { amount: true, applicationFeeAmount: true },
  });
  return rows.reduce((sum, row) => sum + Math.max(0, row.amount - row.applicationFeeAmount), 0);
}
