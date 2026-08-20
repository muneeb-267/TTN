"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function fileDispute(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const kind = String(formData.get("kind") || "TRIP");
  const body = String(formData.get("body") || "").trim();
  const tripId = String(formData.get("tripId") || "") || null;
  const bookingId = String(formData.get("bookingId") || "") || null;
  if (body.length < 10) return;
  let agencyId: string | null = null;
  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { trip: true } });
    if (!booking || booking.travelerId !== session.id) return;
    agencyId = booking.trip.agencyId;
  } else if (tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    agencyId = trip?.agencyId || null;
  }
  const dispute = await prisma.dispute.create({
    data: { reporterId: session.id, kind, body, tripId, bookingId, agencyId },
  });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        key: `dispute:${dispute.id}`,
        title: "New dispute",
        body: `${session.name} reported a ${kind.toLowerCase()} issue.`,
        href: "/admin/disputes",
      }),
    ),
  );
  revalidatePath("/support");
  revalidatePath("/admin/disputes");
}
