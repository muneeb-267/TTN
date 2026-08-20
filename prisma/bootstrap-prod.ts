/**
 * Production database bootstrap: one admin + platform payout row.
 * Never creates demo travelers, agencies, or trips.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' npm run db:prod
 *
 * Re-running does not change an existing admin password unless ADMIN_PASSWORD_RESET=1.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { compactIban, isPakIban, isPlaceholderIban, realAccountText } from "../lib/env";

const prisma = new PrismaClient();

function env(name: string) {
  return (process.env[name] || "").trim();
}

function payoutFromEnv() {
  const bankIban = compactIban(env("TTN_BANK_IBAN"));
  if (bankIban && (isPlaceholderIban(bankIban) || !isPakIban(bankIban))) {
    throw new Error("TTN_BANK_IBAN must be a real 24-character Pakistani IBAN, or leave it empty and paste it in /admin/settings.");
  }
  return {
    bankName: env("TTN_BANK_NAME"),
    bankTitle: env("TTN_BANK_TITLE"),
    bankIban,
    bankAccount: env("TTN_BANK_ACCOUNT"),
    jazzcashName: env("TTN_JAZZCASH_NAME"),
    jazzcashNumber: realAccountText(env("TTN_JAZZCASH_NUMBER")),
    easypaisaName: env("TTN_EASYPAISA_NAME"),
    easypaisaNumber: realAccountText(env("TTN_EASYPAISA_NUMBER")),
  };
}

async function main() {
  if (env("SEED_DEMO") === "1") {
    throw new Error("SEED_DEMO=1 cannot run with db:prod. Demo seed is local-only.");
  }
  if ((process.env.PAYMENTS_MODE || "").trim() === "mock") {
    throw new Error("PAYMENTS_MODE=mock cannot run with db:prod.");
  }

  const email = env("ADMIN_EMAIL").toLowerCase();
  const password = env("ADMIN_PASSWORD");
  const name = env("ADMIN_NAME") || "TTN Admin";
  if (!email.includes("@")) {
    throw new Error("Set ADMIN_EMAIL to the operator email (this value is not committed).");
  }
  if (password.length < 12) {
    throw new Error("Set ADMIN_PASSWORD to at least 12 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "ADMIN") {
    throw new Error(`${email} already exists as ${existing.role}. Pick a different ADMIN_EMAIL.`);
  }
  if (existing) {
    const data: { name: string; passwordHash?: string } = { name };
    if (env("ADMIN_PASSWORD_RESET") === "1") {
      data.passwordHash = await bcrypt.hash(password, 12);
      console.log(`Updated password for admin ${email}`);
    } else {
      console.log(`Admin ${email} already exists. Password unchanged (set ADMIN_PASSWORD_RESET=1 to rotate).`);
    }
    await prisma.user.update({ where: { id: existing.id }, data });
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "ADMIN",
      },
    });
    console.log(`Created admin ${email}`);
  }

  const payout = payoutFromEnv();
  const current = await prisma.platformSettings.findUnique({ where: { id: "ttn" } });
  if (!current) {
    await prisma.platformSettings.create({ data: { id: "ttn", ...payout } });
    console.log("Created platform settings (bank/wallets from env, blanks stay blank).");
  } else {
    await prisma.platformSettings.update({
      where: { id: "ttn" },
      data: {
        bankName: payout.bankName || current.bankName,
        bankTitle: payout.bankTitle || current.bankTitle,
        bankIban: payout.bankIban || current.bankIban,
        bankAccount: payout.bankAccount || current.bankAccount,
        jazzcashName: payout.jazzcashNumber ? payout.jazzcashName || current.jazzcashName : current.jazzcashName,
        jazzcashNumber: payout.jazzcashNumber || current.jazzcashNumber,
        easypaisaName: payout.easypaisaNumber ? payout.easypaisaName || current.easypaisaName : current.easypaisaName,
        easypaisaNumber: payout.easypaisaNumber || current.easypaisaNumber,
      },
    });
    console.log("Platform settings kept; non-empty env values filled any blanks.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
