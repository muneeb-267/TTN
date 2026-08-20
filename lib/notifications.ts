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
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const pending = await prisma.booking.findMany({
    where: {
      travelerId: userId,
      status: "DEPOSIT_PAID",
    },
    include: { trip: true, seats: true },
  });
  for (const booking of pending) {
    const ms = booking.remainingDueAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(ms / day);
    if (daysLeft <= 0) {
      await notify({
        userId,
        key: `pay-remaining:${booking.id}`,
        title: "Remaining payment is due",
        body: `Your remaining payment of ${booking.remainingAmount} PKR for ${booking.trip.title} is due. Pay it to keep this booking.`,
        href: `/traveler/bookings/${booking.id}`,
      });
    } else if (daysLeft <= 1) {
      await notify({
        userId,
        key: `pay-remaining-1:${booking.id}`,
        title: "Remaining payment due tomorrow",
        body: `Your remaining payment of ${booking.remainingAmount} PKR is due tomorrow.`,
        href: `/traveler/bookings/${booking.id}`,
      });
    } else if (daysLeft <= 3) {
      await notify({
        userId,
        key: `pay-remaining-3:${booking.id}`,
        title: "Reminder: balance due in 3 days",
        body: `Reminder: Your TTN booking balance of ${booking.remainingAmount} PKR is due in ${daysLeft} days.`,
        href: `/traveler/bookings/${booking.id}`,
      });
    } else if (daysLeft <= 7) {
      await notify({
        userId,
        key: `pay-remaining-7:${booking.id}`,
        title: "Remaining payment in 7 days",
        body: `Your remaining payment of ${booking.remainingAmount} PKR is due in ${daysLeft} days.`,
        href: `/traveler/bookings/${booking.id}`,
      });
    }
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
