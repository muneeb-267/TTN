import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import { layoutSeats } from "../lib/seats";

const prisma = new PrismaClient();

const names = [
  "Ahmed Raza", "Fatima Noor", "Hassan Ali", "Ayesha Khan", "Bilal Sheikh",
  "Sana Malik", "Usman Tariq", "Hira Qureshi", "Zainab Ijaz", "Hamza Farooq",
  "Maryam Shah", "Omar Siddiqui", "Iqra Javed", "Taha Butt", "Nimra Yousaf",
  "Danish Iqbal", "Rabia Anwar", "Shahzaib Mehmood", "Laiba Aslam", "Waleed Nasir",
];

function reviewsFor(destination: string) {
  return names.map((clientName, i) => ({
    clientName,
    rating: 4 + (i % 2),
    tripDestination: destination,
    comment:
      i % 3 === 0
        ? "Hotels matched the pictures and the coaster left on time."
        : i % 3 === 1
          ? "Jeep day in Deosai was handled well. Would travel again."
          : "Clean vehicle, decent food, no last-minute hotel switch.",
  }));
}

async function main() {
  if (await prisma.user.findUnique({ where: { email: "admin@ttn.pk" } })) {
    console.log("Database already seeded.");
    return;
  }

  const password = {
    admin: await bcrypt.hash("TTN-Admin-2026", 10),
    traveler: await bcrypt.hash("Travel123!", 10),
    agency: await bcrypt.hash("Agency123!", 10),
  };

  await prisma.user.create({
    data: {
      name: "TTN Admin",
      email: "admin@ttn.pk",
      passwordHash: password.admin,
      role: "ADMIN",
    },
  });

  const sara = await prisma.user.create({
    data: {
      name: "Sara Malik",
      email: "sara@ttn.pk",
      phone: "03001234567",
      passwordHash: password.traveler,
      role: "TRAVELER",
    },
  });

  const karakoram = await prisma.agency.create({
    data: {
      businessName: "Karakoram Coasters",
      city: "Lahore",
      about:
        "Weekly Hunza and Skardu group tours from Lahore and Islamabad. Grand Cabin and coaster fleet.",
      status: "APPROVED",
      realMediaDeclaration: true,
      user: {
        create: {
          name: "Imran Balti",
          email: "hunza@karakoram.pk",
          phone: "03215551234",
          passwordHash: password.agency,
          role: "AGENCY",
        },
      },
      signupReviews: { create: reviewsFor("Hunza & Skardu") },
      media: {
        create: [
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1587474260584-196eb9e3ad1f?auto=format&fit=crop&w=1200&q=80",
            caption: "Passu cones",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
            caption: "Attabad",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
            caption: "Rakaposhi view",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
            caption: "Eagle's nest sunset",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
            caption: "Khunjerab road",
            isPreviousTrip: true,
          },
        ],
      },
    },
  });

  const northstar = await prisma.agency.create({
    data: {
      businessName: "North Star Expeditions",
      city: "Karachi",
      about: "Karachi departures to Naran, Swat and Skardu with family-friendly sharing options.",
      status: "APPROVED",
      realMediaDeclaration: true,
      user: {
        create: {
          name: "Nadia Karim",
          email: "skardu@northstar.pk",
          phone: "03337654321",
          passwordHash: password.agency,
          role: "AGENCY",
        },
      },
      signupReviews: { create: reviewsFor("Naran & Kaghan") },
      media: {
        create: [
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1432405972610-b9c1d3d4c62f?auto=format&fit=crop&w=1200&q=80",
            caption: "Saif-ul-Maluk",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
            caption: "Babusar clouds",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
            caption: "Lake morning",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
            caption: "Pine trail",
            isPreviousTrip: true,
          },
          {
            kind: "PHOTO",
            url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
            caption: "Meadow camp",
            isPreviousTrip: true,
          },
        ],
      },
    },
  });

  const hunzaDepart = addDays(new Date(), 14);
  hunzaDepart.setHours(22, 0, 0, 0);
  const hunzaReturn = addDays(hunzaDepart, 8);
  hunzaReturn.setHours(20, 0, 0, 0);

  const trip1 = await prisma.trip.create({
    data: {
      agencyId: karakoram.id,
      title: "8 days Hunza, Skardu & Khunjerab",
      fromCity: "Lahore",
      toDestination: "Hunza & Skardu",
      departureAt: hunzaDepart,
      returnAt: hunzaReturn,
      vehicleType: "Grand Cabin",
      vehicleDetail: "2023 recliner, AC, luggage trailer",
      seatCount: 18,
      pricePerSeat: 42500,
      itinerary:
        "Night departure from Thokar Niaz Baig.\nDay 2: Besham to Hunza, Attabad, Karimabad.\nDay 3: Khunjerab (seasonal).\nDay 4–6: Skardu, Shangrila, Manthokha, Deosai jeep (weather).\nHotels listed below. Quad sharing unless you book twin.",
      hotelLinks: JSON.stringify([
        { name: "Hunza Embassy Hotel", url: "https://www.google.com/search?q=Hunza+Embassy+Hotel" },
        { name: "Concordia Motel Skardu", url: "https://www.google.com/search?q=Concordia+Motel+Skardu" },
      ]),
      seats: { create: layoutSeats(18) },
      comments: {
        create: {
          userId: sara.id,
          body: "Is the Deosai jeep included or extra?",
        },
      },
    },
  });

  await prisma.comment.create({
    data: {
      tripId: trip1.id,
      userId: (await prisma.user.findUniqueOrThrow({ where: { email: "hunza@karakoram.pk" } })).id,
      body: "Jeep day is included for Deosai when the plains are open. If closed we switch to Shigar.",
    },
  });

  const naranDepart = addDays(new Date(), 10);
  naranDepart.setHours(21, 30, 0, 0);
  await prisma.trip.create({
    data: {
      agencyId: northstar.id,
      title: "5 days Naran, Saif-ul-Maluk & Babusar",
      fromCity: "Karachi",
      toDestination: "Naran & Kaghan",
      departureAt: naranDepart,
      returnAt: addDays(naranDepart, 5),
      vehicleType: "Coaster",
      vehicleDetail: "Luxury saloon coaster, 2022",
      seatCount: 21,
      pricePerSeat: 28900,
      itinerary:
        "Karachi to Islamabad by road/air add-on, then Naran. Lake jeep extra if you want a private boat. Family friendly, no smoking on the coaster.",
      hotelLinks: JSON.stringify([
        { name: "Northern Retreat Naran", url: "https://www.google.com/search?q=Northern+Retreat+Naran" },
      ]),
      seats: { create: layoutSeats(21) },
    },
  });

  const islamabadDepart = addDays(new Date(), 21);
  islamabadDepart.setHours(7, 0, 0, 0);
  await prisma.trip.create({
    data: {
      agencyId: karakoram.id,
      title: "Fairy Meadows weekend (Islamabad)",
      fromCity: "Islamabad",
      toDestination: "Fairy Meadows",
      departureAt: islamabadDepart,
      returnAt: addDays(islamabadDepart, 4),
      vehicleType: "Hiace",
      vehicleDetail: "Grand cabin to Raikot, jeeps onward",
      seatCount: 14,
      pricePerSeat: 26500,
      itinerary: "Raikot bridge, jeep, trek to Fairy Meadows, Nanga Parbat view, Beyal optional.",
      hotelLinks: JSON.stringify([
        { name: "Raikot Inn", url: "https://www.google.com/search?q=Raikot+Inn+Fairy+Meadows" },
      ]),
      seats: { create: layoutSeats(14) },
    },
  });

  const pastDepart = subDays(new Date(), 20);
  const pastReturn = subDays(new Date(), 12);
  const past = await prisma.trip.create({
    data: {
      agencyId: karakoram.id,
      title: "Completed: Hunza blossom trip",
      fromCity: "Lahore",
      toDestination: "Hunza",
      departureAt: pastDepart,
      returnAt: pastReturn,
      vehicleType: "Grand Cabin",
      vehicleDetail: "2022 model",
      seatCount: 10,
      pricePerSeat: 36000,
      itinerary: "Past trip used for reviews.",
      hotelLinks: "[]",
      published: false,
      seats: { create: layoutSeats(10) },
    },
  });

  const pastBooking = await prisma.booking.create({
    data: {
      publicRef: "TTN-SEED01",
      travelerId: sara.id,
      tripId: past.id,
      status: "COMPLETED",
      totalPrice: 36000,
      depositAmount: 18000,
      remainingAmount: 18000,
      platformFee: 1800,
      paymentMethod: "jazzcash",
      remainingDueAt: subDays(pastDepart, 1),
      depositPaidAt: subDays(pastDepart, 10),
      remainingPaidAt: subDays(pastDepart, 1),
      completedAt: pastReturn,
    },
  });
  await prisma.seat.update({
    where: { tripId_code: { tripId: past.id, code: "1" } },
    data: { bookingId: pastBooking.id },
  });
  await prisma.tripReview.create({
    data: {
      bookingId: pastBooking.id,
      travelerId: sara.id,
      agencyId: karakoram.id,
      tripId: past.id,
      rating: 5,
      body: "Cabin was as shown. Hotels in Aliabad were clean. Would book again on TTN.",
    },
  });

  console.log("Seeded TTN demo data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
