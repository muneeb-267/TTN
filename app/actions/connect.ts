"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  createAgencyExpressLoginLink,
  createAgencyOnboardingLink,
  syncAgencyConnect,
} from "@/lib/connect";
import { stripeConfigured } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function startAgencyConnect() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Sign in as an agency." };
  if (!stripeConfigured()) return { error: "Card payouts are not live yet. TTN still needs a Stripe key." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return { error: "Agency profile not found." };
  if (agency.status !== "APPROVED") {
    return { error: "Finish verification first. Payouts open after TTN approves the agency." };
  }
  let url = "";
  try {
    url = await createAgencyOnboardingLink(agency.id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start Stripe onboarding." };
  }
  redirect(url);
}

export async function openAgencyStripeDashboard() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Sign in as an agency." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency?.stripeAccountId) return { error: "Connect a payout account first." };
  let url = "";
  try {
    await syncAgencyConnect(agency.id);
    url = await createAgencyExpressLoginLink(agency.stripeAccountId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not open the Express dashboard." };
  }
  redirect(url);
}

export async function refreshAgencyConnect() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return;
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return;
  await syncAgencyConnect(agency.id);
  revalidatePath("/agency");
}
