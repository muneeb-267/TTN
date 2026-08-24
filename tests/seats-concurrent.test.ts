import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { claimSeats, layoutSeats } from "../lib/seats";

describe("concurrent last seat", () => {
  it("lets only one transaction claim the same seat", async () => {
    const prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } },
    });
    const agency = await prisma.agency.findFirst({ where: { status: "APPROVED" } });
    const travelerA = await prisma.user.findFirst({ where: { role: "TRAVELER" } });
    const travelerB = await prisma.user.findFirst({
      where: { role: "TRAVELER", id: { not: travelerA?.id } },
    });
    assert.ok(agency && travelerA);
    const other = travelerB || travelerA;
    const trip = await prisma.trip.create({
      data: {
        agencyId: agency.id,
        title: "Concurrent seat test",
        fromCity: "Lahore",
        toDestination: "Hunza",
        departureAt: new Date(Date.now() + 14 * 86400000),
        returnAt: new Date(Date.now() + 18 * 86400000),
        vehicleType: "Hiace",
        vehicleDetail: "test",
        seatCount: 4,
        pricePerSeat: 10000,
        itinerary: "test",
        hotelLinks: "[]",
        published: false,
        seats: { create: layoutSeats(4) },
      },
    });

    async function attempt(travelerId: string, ref: string) {
      try {
        return await prisma.$transaction(async (tx) => {
          const booking = await tx.booking.create({
            data: {
              publicRef: ref,
              travelerId,
              tripId: trip.id,
              status: "AWAITING_PAYMENT",
              totalPrice: 10000,
              depositAmount: 5000,
              remainingAmount: 5000,
              platformFee: 250,
              agencySettlement: 9750,
              netRevenue: 250,
              paymentMethod: "bank",
              remainingDueAt: new Date(),
            },
          });
          await claimSeats(tx, trip.id, ["1"], booking.id);
          return booking.id;
        });
      } catch {
        return null;
      }
    }

    const [a, b] = await Promise.all([
      attempt(travelerA.id, `TTN-TEST-A-${Date.now()}`),
      attempt(other.id, `TTN-TEST-B-${Date.now()}`),
    ]);
    const winners = [a, b].filter(Boolean);
    assert.equal(winners.length, 1);
    const seat = await prisma.seat.findUnique({
      where: { tripId_code: { tripId: trip.id, code: "1" } },
    });
    assert.equal(seat?.bookingId, winners[0]);
    await prisma.trip.delete({ where: { id: trip.id } });
    await prisma.$disconnect();
  });
});
