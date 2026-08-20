"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function reviewAgency(agencyId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const decision = String(formData.get("decision") || "");
  const status = decision === "approve" ? "APPROVED" : "REJECTED";
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) return;
  await prisma.agency.update({ where: { id: agencyId }, data: { status } });
  await writeAudit({
    adminId: session.id,
    action: status === "APPROVED" ? "agency.approve" : "agency.reject",
    entity: "Agency",
    entityId: agencyId,
    oldValue: agency.status,
    newValue: status,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/agencies");
}

export async function suspendAgency(agencyId: string) {
  const session = await requireAdmin();
  if (!session) return;
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) return;
  await prisma.$transaction([
    prisma.agency.update({ where: { id: agencyId }, data: { status: "DELISTED", delistedAt: new Date() } }),
    prisma.trip.updateMany({ where: { agencyId }, data: { published: false } }),
  ]);
  await writeAudit({
    adminId: session.id,
    action: "agency.suspend",
    entity: "Agency",
    entityId: agencyId,
    oldValue: agency.status,
    newValue: "DELISTED",
  });
  revalidatePath("/admin/agencies");
}

export async function unsuspendAgency(agencyId: string) {
  const session = await requireAdmin();
  if (!session) return;
  await prisma.agency.update({ where: { id: agencyId }, data: { status: "APPROVED", delistedAt: null } });
  await writeAudit({
    adminId: session.id,
    action: "agency.reactivate",
    entity: "Agency",
    entityId: agencyId,
    newValue: "APPROVED",
  });
  revalidatePath("/admin/agencies");
}

export async function suspendUser(userId: string) {
  const session = await requireAdmin();
  if (!session) return;
  if (userId === session.id) return;
  await prisma.user.update({ where: { id: userId }, data: { suspendedAt: new Date() } });
  await writeAudit({
    adminId: session.id,
    action: "user.suspend",
    entity: "User",
    entityId: userId,
  });
  revalidatePath("/admin/users");
}

export async function reactivateUser(userId: string) {
  const session = await requireAdmin();
  if (!session) return;
  await prisma.user.update({ where: { id: userId }, data: { suspendedAt: null } });
  await writeAudit({
    adminId: session.id,
    action: "user.reactivate",
    entity: "User",
    entityId: userId,
  });
  revalidatePath("/admin/users");
}

export async function moderateTrip(tripId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const decision = String(formData.get("decision") || "");
  const reason = String(formData.get("reason") || "").trim();
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return;
  if (decision === "approve") {
    await prisma.trip.update({
      where: { id: tripId },
      data: { published: true, approvalStatus: "PUBLISHED" },
    });
  } else if (decision === "reject") {
    await prisma.trip.update({
      where: { id: tripId },
      data: { published: false, approvalStatus: "REJECTED", importantInfo: reason ? `Rejection: ${reason}` : trip.importantInfo },
    });
  } else if (decision === "unpublish") {
    await prisma.trip.update({ where: { id: tripId }, data: { published: false } });
  }
  await writeAudit({
    adminId: session.id,
    action: `trip.${decision}`,
    entity: "Trip",
    entityId: tripId,
    oldValue: { published: trip.published, approvalStatus: trip.approvalStatus },
    newValue: { decision, reason },
  });
  revalidatePath("/admin/trips");
}

export async function saveCommissionSettings(formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const commissionBps = Number(formData.get("commissionBps") || 0);
  const processingFeeBps = Number(formData.get("processingFeeBps") || 0);
  const depositBps = Number(formData.get("depositBps") || 0);
  const seatHoldMinutes = Number(formData.get("seatHoldMinutes") || 0);
  if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 10000) {
    return;
  }
  const current = await prisma.platformSettings.findUnique({ where: { id: "ttn" } });
  await prisma.platformSettings.upsert({
    where: { id: "ttn" },
    update: { commissionBps, processingFeeBps, depositBps, seatHoldMinutes },
    create: { id: "ttn", commissionBps, processingFeeBps, depositBps, seatHoldMinutes },
  });
  await writeAudit({
    adminId: session.id,
    action: "settings.commission",
    entity: "PlatformSettings",
    entityId: "ttn",
    oldValue: current ? { commissionBps: current.commissionBps, processingFeeBps: current.processingFeeBps } : {},
    newValue: { commissionBps, processingFeeBps, depositBps, seatHoldMinutes },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/commission");
  revalidatePath("/admin/settings");
}

export async function settleAgency(formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const agencyId = String(formData.get("agencyId") || "");
  const action = String(formData.get("action") || "approve");
  const note = String(formData.get("note") || "");
  const settlementId = String(formData.get("settlementId") || "");
  if (settlementId) {
    const existing = await prisma.settlement.findUnique({ where: { id: settlementId } });
    if (!existing) return;
    const status =
      action === "pay" ? "PAID" : action === "hold" ? "HELD" : action === "approve" ? "APPROVED" : existing.status;
    await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status,
        note,
        decidedAt: new Date(),
        paidAt: status === "PAID" ? new Date() : existing.paidAt,
      },
    });
    await writeAudit({
      adminId: session.id,
      action: `settlement.${action}`,
      entity: "Settlement",
      entityId: settlementId,
      oldValue: existing.status,
      newValue: status,
    });
    revalidatePath("/admin/settlements");
    return;
  }
  const grossAmount = Number(formData.get("grossAmount") || 0);
  const commissionAmount = Number(formData.get("commissionAmount") || 0);
  const processingFeeAmount = Number(formData.get("processingFeeAmount") || 0);
  const refundAmount = Number(formData.get("refundAmount") || 0);
  const netPayable = Number(formData.get("netPayable") || 0);
  const created = await prisma.settlement.create({
    data: {
      agencyId,
      grossAmount,
      commissionAmount,
      processingFeeAmount,
      refundAmount,
      netPayable,
      status: "PENDING",
      note,
      periodStart: new Date(Date.now() - 30 * 86400000),
      periodEnd: new Date(),
    },
  });
  await writeAudit({
    adminId: session.id,
    action: "settlement.create",
    entity: "Settlement",
    entityId: created.id,
    newValue: { agencyId, netPayable },
  });
  revalidatePath("/admin/settlements");
}

export async function resolveDispute(disputeId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const status = String(formData.get("status") || "RESOLVED");
  const resolution = String(formData.get("resolution") || "").trim();
  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status, resolution, decidedAt: new Date() },
  });
  await writeAudit({
    adminId: session.id,
    action: "dispute.resolve",
    entity: "Dispute",
    entityId: disputeId,
    newValue: { status, resolution },
  });
  revalidatePath("/admin/disputes");
}

export async function moderateReview(reviewId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  if (String(formData.get("decision")) === "remove") {
    await prisma.tripReview.delete({ where: { id: reviewId } });
    await writeAudit({
      adminId: session.id,
      action: "review.remove",
      entity: "TripReview",
      entityId: reviewId,
    });
  }
  revalidatePath("/admin/reviews");
}
