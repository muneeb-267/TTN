"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isPakIban, isPlaceholderIban, compactIban, realAccountText } from "@/lib/env";
import { isPayMethod } from "@/lib/payments";
import { enforceAgencyFeeStatus } from "@/lib/platform-fees";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { saveUploads } from "@/lib/uploads";

export async function savePlatformAccounts(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "Admin only." };
  const bankName = String(formData.get("bankName") || "").trim();
  const bankTitle = String(formData.get("bankTitle") || "").trim();
  const bankIban = compactIban(String(formData.get("bankIban") || ""));
  const bankAccount = String(formData.get("bankAccount") || "").trim();
  const jazzcashName = String(formData.get("jazzcashName") || "").trim();
  const jazzcashNumber = realAccountText(String(formData.get("jazzcashNumber") || ""));
  const easypaisaName = String(formData.get("easypaisaName") || "").trim();
  const easypaisaNumber = realAccountText(String(formData.get("easypaisaNumber") || ""));
  if (!bankName || !bankTitle || !bankIban) {
    return { error: "Bank name, account title and IBAN are required." };
  }
  if (!isPakIban(bankIban) || isPlaceholderIban(bankIban)) {
    return { error: "Enter a real Pakistani IBAN (24 characters, starts with PK). Placeholder zeros are not saved." };
  }
  await prisma.platformSettings.upsert({
    where: { id: "ttn" },
    update: {
      bankName,
      bankTitle,
      bankIban,
      bankAccount,
      jazzcashName: jazzcashNumber ? jazzcashName || "TTN Travel To North" : "",
      jazzcashNumber,
      easypaisaName: easypaisaNumber ? easypaisaName || "TTN Travel To North" : "",
      easypaisaNumber,
    },
    create: {
      id: "ttn",
      bankName,
      bankTitle,
      bankIban,
      bankAccount,
      jazzcashName: jazzcashNumber ? jazzcashName || "TTN Travel To North" : "",
      jazzcashNumber,
      easypaisaName: easypaisaNumber ? easypaisaName || "TTN Travel To North" : "",
      easypaisaNumber,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/agency");
  return { ok: true };
}

export async function submitPlatformFeeProof(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Sign in as an agency." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return { error: "Agency not found." };
  const method = String(formData.get("method") || "bank");
  if (!isPayMethod(method) || method === "card") return { error: "Pay the fee by bank, EasyPaisa or JazzCash." };
  const providerTxn = String(formData.get("providerTxn") || "").trim();
  const payerAccount = String(formData.get("payerAccount") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  if (!amount || amount < 1) return { error: "Enter the amount you sent." };
  if (method === "bank") {
    if (!payerAccount) return { error: "Enter the account you sent from." };
  } else if (!providerTxn) {
    return { error: "Enter the JazzCash / EasyPaisa transaction ID (TID)." };
  }
  const files = formData.getAll("receipt").filter((f): f is File => f instanceof File);
  const saved = await saveUploads(files, `fee-${agency.id}`);
  const payment = await prisma.platformFeePayment.create({
    data: {
      agencyId: agency.id,
      amount: Math.round(amount),
      method,
      status: "PENDING",
      source: "AGENCY",
      providerTxn,
      payerAccount,
      receiptUrl: saved[0]?.url || "",
    },
  });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        key: `fee:${payment.id}`,
        title: "Platform fee waiting",
        body: `${agency.businessName} sent ${payment.amount} PKR via ${method}. Match it, then confirm.`,
        href: "/admin",
      }),
    ),
  );
  revalidatePath("/agency");
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminConfirmFeePayment(paymentId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return;
  const payment = await prisma.platformFeePayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;
  await prisma.platformFeePayment.update({
    where: { id: paymentId },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });
  await enforceAgencyFeeStatus(payment.agencyId);
  const agency = await prisma.agency.findUnique({ where: { id: payment.agencyId } });
  if (agency) {
    await notify({
      userId: agency.userId,
      key: `fee-ok:${payment.id}`,
      title: "Platform fee received",
      body: `TTN confirmed ${payment.amount} PKR toward your platform fees.`,
      href: "/agency",
    });
  }
  revalidatePath("/admin");
  revalidatePath("/agency");
}

export async function adminRejectFeePayment(paymentId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return;
  const payment = await prisma.platformFeePayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;
  await prisma.platformFeePayment.update({
    where: { id: paymentId },
    data: { status: "FAILED" },
  });
  const agency = await prisma.agency.findUnique({ where: { id: payment.agencyId } });
  if (agency) {
    await notify({
      userId: agency.userId,
      key: `fee-no:${payment.id}`,
      title: "Platform fee not matched",
      body: "TTN could not match that transfer. Send again with the exact amount and a receipt.",
      href: "/agency",
    });
  }
  revalidatePath("/admin");
  revalidatePath("/agency");
}
