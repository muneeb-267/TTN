import { PLATFORM_FEE_DELIST_DAYS, PLATFORM_FEE_GRACE_DAYS, PAYMENT_METHODS } from "./constants";
import {
  DEFAULT_FINANCE_RATES,
  effectiveCardProcessingBps,
  formatBps,
  type FinanceRates,
} from "./money";
import { prisma } from "./prisma";
import {
  agencyPayoutAccounts,
  listedPayMethods,
  paymentAccounts,
  type PayoutAccounts,
} from "./payments";

const PAID_BOOKING = ["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"];

export type AccountFields = {
  jazzcashName?: string | null;
  jazzcashNumber?: string | null;
  easypaisaName?: string | null;
  easypaisaNumber?: string | null;
  bankName?: string | null;
  bankTitle?: string | null;
  bankIban?: string | null;
  bankAccount?: string | null;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function getPlatformSettings() {
  const fallback = paymentAccounts();
  const row = await prisma.platformSettings.upsert({
    where: { id: "ttn" },
    update: {},
    create: {
      id: "ttn",
      jazzcashName: fallback.jazzcash.name,
      jazzcashNumber: fallback.jazzcash.number,
      easypaisaName: fallback.easypaisa.name,
      easypaisaNumber: fallback.easypaisa.number,
      bankName: fallback.bank.name,
      bankTitle: fallback.bank.title,
      bankIban: fallback.bank.iban,
      bankAccount: fallback.bank.account,
    },
  });
  return row;
}

export async function getFinanceRates(): Promise<FinanceRates> {
  const row = await getPlatformSettings();
  return {
    commissionBps: row.commissionBps ?? DEFAULT_FINANCE_RATES.commissionBps,
    processingFeeBps: row.processingFeeBps ?? DEFAULT_FINANCE_RATES.processingFeeBps,
    depositBps: row.depositBps ?? DEFAULT_FINANCE_RATES.depositBps,
    minDaysForDeposit: row.minDaysForDeposit ?? DEFAULT_FINANCE_RATES.minDaysForDeposit,
    remainingDueDays: row.remainingDueDays ?? DEFAULT_FINANCE_RATES.remainingDueDays,
    seatHoldMinutes: row.seatHoldMinutes ?? DEFAULT_FINANCE_RATES.seatHoldMinutes,
  };
}

export async function getCardProcessingBps() {
  const rates = await getFinanceRates();
  return effectiveCardProcessingBps(rates.processingFeeBps);
}

export async function commissionLabel() {
  const rates = await getFinanceRates();
  return formatBps(rates.commissionBps);
}

export async function platformPayoutAccounts(): Promise<PayoutAccounts> {
  const row = await getPlatformSettings();
  const fallback = paymentAccounts();
  return {
    jazzcash: {
      name: row.jazzcashName || fallback.jazzcash.name,
      number: row.jazzcashNumber || fallback.jazzcash.number,
    },
    easypaisa: {
      name: row.easypaisaName || fallback.easypaisa.name,
      number: row.easypaisaNumber || fallback.easypaisa.number,
    },
    bank: {
      name: row.bankName || fallback.bank.name,
      title: row.bankTitle || fallback.bank.title,
      iban: row.bankIban || fallback.bank.iban,
      account: row.bankAccount || fallback.bank.account,
    },
  };
}

export function platformPayMethods(accounts: PayoutAccounts) {
  return PAYMENT_METHODS.filter((method) => {
    if (method.id === "card") return false;
    if (method.id === "bank") return true;
    if (method.id === "easypaisa") return Boolean(accounts.easypaisa.number);
    if (method.id === "jazzcash") return Boolean(accounts.jazzcash.number);
    return false;
  });
}

export type FeeLine = {
  tripId: string;
  title: string;
  fromCity: string;
  toDestination: string;
  returnAt: Date;
  seats: number;
  fare: number;
  fee: number;
  due: boolean;
};

function tripFee(trip: {
  bookings: {
    status: string;
    platformFee: number;
    totalPrice: number;
    seats: { id: string }[];
    refund: { status: string; platformKeep: number; agencyFine: number } | null;
  }[];
}) {
  let fee = 0;
  let seats = 0;
  let fare = 0;
  for (const booking of trip.bookings) {
    if (booking.refund?.status === "APPROVED") {
      fee += booking.refund.platformKeep + booking.refund.agencyFine;
      continue;
    }
    if (PAID_BOOKING.includes(booking.status)) {
      fee += booking.platformFee;
      seats += booking.seats.length;
      fare += booking.totalPrice;
    }
  }
  return { fee, seats, fare };
}

export async function agencyFeeLedger(agencyId: string, now = new Date()) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: {
      trips: {
        include: {
          bookings: { include: { refund: true, seats: true } },
        },
      },
      feePayments: true,
    },
  });
  if (!agency) {
    return {
      accrued: 0,
      upcoming: 0,
      received: 0,
      outstanding: 0,
      dueAt: null as Date | null,
      divertAt: null as Date | null,
      delistAt: null as Date | null,
      diverting: false,
      shouldDelist: false,
      status: "PENDING",
      lines: [] as FeeLine[],
    };
  }

  let accrued = 0;
  let upcoming = 0;
  const lines: FeeLine[] = [];
  const returned: { returnAt: Date; fee: number }[] = [];
  for (const trip of agency.trips) {
    const { fee, seats, fare } = tripFee(trip);
    if (!fee && !seats) continue;
    const due = trip.returnAt <= now;
    lines.push({
      tripId: trip.id,
      title: trip.title,
      fromCity: trip.fromCity,
      toDestination: trip.toDestination,
      returnAt: trip.returnAt,
      seats,
      fare,
      fee,
      due,
    });
    if (due) {
      accrued += fee;
      returned.push({ returnAt: trip.returnAt, fee });
    } else {
      upcoming += fee;
    }
  }
  lines.sort((a, b) => a.returnAt.getTime() - b.returnAt.getTime());
  returned.sort((a, b) => a.returnAt.getTime() - b.returnAt.getTime());

  const received = agency.feePayments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, accrued - received);

  let unpaidAnchor: Date | null = null;
  let credit = received;
  for (const trip of returned) {
    if (credit >= trip.fee) {
      credit -= trip.fee;
      continue;
    }
    unpaidAnchor = trip.returnAt;
    break;
  }

  const divertAt = unpaidAnchor && outstanding > 0 ? addDays(unpaidAnchor, PLATFORM_FEE_GRACE_DAYS) : null;
  const delistAt =
    unpaidAnchor && outstanding > 0
      ? addDays(unpaidAnchor, PLATFORM_FEE_GRACE_DAYS + PLATFORM_FEE_DELIST_DAYS)
      : null;
  const diverting = Boolean(divertAt && now >= divertAt && outstanding > 0);
  const shouldDelist = Boolean(delistAt && now >= delistAt && outstanding > 0);

  return {
    accrued,
    upcoming,
    received,
    outstanding,
    dueAt: divertAt,
    divertAt,
    delistAt,
    diverting,
    shouldDelist,
    status: agency.status,
    lines,
  };
}

export async function enforceAgencyFeeStatus(agencyId: string, now = new Date()) {
  const ledger = await agencyFeeLedger(agencyId, now);
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) return ledger;

  if (ledger.shouldDelist && agency.status === "APPROVED") {
    await prisma.$transaction([
      prisma.agency.update({
        where: { id: agencyId },
        data: { status: "DELISTED", delistedAt: now },
      }),
      prisma.trip.updateMany({ where: { agencyId }, data: { published: false } }),
    ]);
    return { ...ledger, status: "DELISTED" };
  }

  if (ledger.outstanding <= 0 && agency.status === "DELISTED") {
    await prisma.agency.update({
      where: { id: agencyId },
      data: { status: "APPROVED", delistedAt: null },
    });
    await prisma.trip.updateMany({
      where: { agencyId, departureAt: { gte: now } },
      data: { published: true },
    });
    return { ...ledger, status: "APPROVED", diverting: false, shouldDelist: false };
  }

  return ledger;
}

export async function travelerPayOptions(trip?: AccountFields | null, agency?: (AccountFields & { id?: string }) | null) {
  const ledger = agency?.id ? await enforceAgencyFeeStatus(agency.id) : null;
  if (ledger?.diverting) {
    const accounts = await platformPayoutAccounts();
    return {
      diverted: true as const,
      accounts,
      methods: platformPayMethods(accounts).map((method) => {
        if (method.id === "bank") {
          return {
            ...method,
            blurb: "Main option. IBFT or Raast to this bank account. Put the booking ref in the narration.",
          };
        }
        if (method.id === "easypaisa") {
          return { ...method, blurb: "Send PKR from EasyPaisa to this wallet. Use your booking ref in the message." };
        }
        if (method.id === "jazzcash") {
          return { ...method, blurb: "Send PKR from JazzCash to this wallet. Use your booking ref in the message." };
        }
        return method;
      }),
    };
  }
  return {
    diverted: false as const,
    accounts: {
      jazzcash: agencyPayoutAccounts(trip, agency).jazzcash,
      easypaisa: agencyPayoutAccounts(trip, agency).easypaisa,
      bank: agencyPayoutAccounts(trip, agency).bank,
    } satisfies PayoutAccounts,
    methods: listedPayMethods(trip, agency),
  };
}

export async function applyConnectFeePayment(
  agencyId: string,
  bookingPaymentId: string,
  amount: number,
  method: string,
) {
  const existing = await prisma.platformFeePayment.findUnique({
    where: { bookingPaymentId },
  });
  if (existing) {
    if (existing.status !== "CONFIRMED") {
      await prisma.platformFeePayment.update({
        where: { id: existing.id },
        data: { status: "CONFIRMED", confirmedAt: new Date(), amount, source: "CONNECT", method },
      });
    }
    await enforceAgencyFeeStatus(agencyId);
    return;
  }
  await prisma.platformFeePayment.create({
    data: {
      agencyId,
      amount,
      method,
      status: "CONFIRMED",
      source: "CONNECT",
      bookingPaymentId,
      confirmedAt: new Date(),
    },
  });
  await enforceAgencyFeeStatus(agencyId);
}

export async function applyDivertedPayment(agencyId: string, bookingPaymentId: string, amount: number, method: string) {
  const existing = await prisma.platformFeePayment.findUnique({
    where: { bookingPaymentId },
  });
  if (existing) {
    if (existing.status !== "CONFIRMED") {
      await prisma.platformFeePayment.update({
        where: { id: existing.id },
        data: { status: "CONFIRMED", confirmedAt: new Date(), amount },
      });
    }
    await enforceAgencyFeeStatus(agencyId);
    return;
  }
  await prisma.platformFeePayment.create({
    data: {
      agencyId,
      amount,
      method,
      status: "CONFIRMED",
      source: "DIVERT",
      bookingPaymentId,
      confirmedAt: new Date(),
    },
  });
  await enforceAgencyFeeStatus(agencyId);
}
