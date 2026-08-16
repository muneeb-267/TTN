import { prisma } from "./prisma";

export async function notify(input: {
  userId: string;
  key: string;
  title: string;
  body: string;
  href?: string;
}) {
  await prisma.notification.upsert({
    where: { key: input.key },
    update: {
      title: input.title,
      body: input.body,
      href: input.href || "",
      read: false,
    },
    create: {
      userId: input.userId,
      key: input.key,
      title: input.title,
      body: input.body,
      href: input.href || "",
    },
  });
}

export async function syncDuePaymentAlerts(userId: string) {
  const due = await prisma.booking.findMany({
    where: {
      travelerId: userId,
      status: "DEPOSIT_PAID",
      remainingDueAt: { lte: new Date() },
    },
    include: { trip: true, seats: true },
  });
  for (const booking of due) {
    await notify({
      userId,
      key: `pay-remaining:${booking.id}`,
      title: "Pay the remaining 50% today",
      body: `${booking.trip.title} departs tomorrow. Complete the full seat amount for seats ${booking.seats.map((s) => s.code).join(", ")}.`,
      href: `/traveler/bookings/${booking.id}`,
    });
  }
}

export async function listNotifications(userId: string) {
  await syncDuePaymentAlerts(userId);
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
