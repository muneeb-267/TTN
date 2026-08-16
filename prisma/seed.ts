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

const whatsappUrls = [
  "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
];

const cnicUrls = [
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
];

function verificationMedia() {
  return [
    ...Array.from({ length: 20 }, (_, i) => ({
      kind: "WHATSAPP",
      url: whatsappUrls[i % whatsappUrls.length],
      caption: `WhatsApp client review ${i + 1}`,
      isPreviousTrip: false,
    })),
    {
      kind: "CNIC",
      url: cnicUrls[0],
      caption: "CNIC person 1",
      isPreviousTrip: false,
    },
    {
      kind: "CNIC",
      url: cnicUrls[1],
      caption: "CNIC person 2",
      isPreviousTrip: false,
    },
  ];
}

async function ensureVerificationAndDemoBookings() {
  const agencies = await prisma.agency.findMany();
  for (const agency of agencies) {
    if (agency.clientPhones === "[]") {
      await prisma.agency.update({
        where: { id: agency.id },
        data: {
          clientPhones: JSON.stringify([
            "03001112233",
            "03014445566",
            "03216667788",
            "03339998877",
            "03125550011",
          ]),
        },
      });
    }
    const whatsapp = await prisma.media.count({ where: { agencyId: agency.id, kind: "WHATSAPP" } });
    if (whatsapp < 20) {
      await prisma.media.createMany({ data: verificationMedia().map((m) => ({ ...m, agencyId: agency.id })) });
    }
  }

  const sara = await prisma.user.findUnique({ where: { email: "sara@ttn.pk" } });
  const hunza = await prisma.trip.findFirst({
    where: { title: { contains: "Hunza, Skardu" } },
  });
  if (sara && hunza && !(await prisma.booking.findUnique({ where: { publicRef: "TTN-LIVE01" } }))) {
    const quoteDeposit = Math.round(hunza.pricePerSeat * 0.5);
    const booking = await prisma.booking.create({
      data: {
        publicRef: "TTN-LIVE01",
        travelerId: sara.id,
        tripId: hunza.id,
        status: "DEPOSIT_PAID",
        totalPrice: hunza.pricePerSeat,
        depositAmount: quoteDeposit,
        remainingAmount: hunza.pricePerSeat - quoteDeposit,
        platformFee: Math.round(hunza.pricePerSeat * 0.05),
        paymentMethod: "jazzcash",
        remainingDueAt: addDays(hunza.departureAt, -1),
        depositPaidAt: new Date(),
        payments: {
          create: { kind: "DEPOSIT", amount: quoteDeposit, method: "jazzcash", status: "CONFIRMED" },
        },
      },
    });
    await prisma.seat.update({
      where: { tripId_code: { tripId: hunza.id, code: "3" } },
      data: { bookingId: booking.id },
    });
    await prisma.notification.create({
      data: {
        userId: sara.id,
        key: `slip:${booking.id}`,
        title: "50% payment slip created",
        body: "Your 50% deposit is locked. One day before the trip you will be asked to pay the remaining 50%.",
        href: `/traveler/bookings/${booking.id}/slip`,
      },
    });
    const agency = await prisma.agency.findUnique({ where: { id: hunza.agencyId } });
    if (agency) {
      await prisma.notification.create({
        data: {
          userId: agency.userId,
          key: `booking:${booking.id}`,
          title: "New seat booking",
          body: `${sara.name} booked seat 3 on ${hunza.title}.`,
          href: `/agency/trips/${hunza.id}`,
        },
      });
    }
  }

  if (sara && hunza && !(await prisma.booking.findUnique({ where: { publicRef: "TTN-DUE01" } }))) {
    const dueTrip = await prisma.trip.create({
      data: {
        agencyId: hunza.agencyId,
        title: "Skardu weekend — remaining 50% due",
        fromCity: "Lahore",
        toDestination: "Skardu",
        departureAt: addDays(new Date(), 1),
        returnAt: addDays(new Date(), 4),
        vehicleType: "Grand Cabin",
        vehicleDetail: "Demo trip so the one-day-before payment alert is visible",
        seatCount: 10,
        pricePerSeat: 22000,
        itinerary: "Demo departure used to show the remaining 50% notification.",
        hotelLinks: "[]",
        seats: { create: layoutSeats(10) },
      },
    });
    const deposit = 11000;
    const booking = await prisma.booking.create({
      data: {
        publicRef: "TTN-DUE01",
        travelerId: sara.id,
        tripId: dueTrip.id,
        status: "DEPOSIT_PAID",
        totalPrice: 22000,
        depositAmount: deposit,
        remainingAmount: deposit,
        platformFee: 1100,
        paymentMethod: "easypaisa",
        remainingDueAt: subDays(new Date(), 0),
        bookedAt: subDays(new Date(), 6),
        depositPaidAt: subDays(new Date(), 6),
        payments: {
          create: { kind: "DEPOSIT", amount: deposit, method: "easypaisa", status: "CONFIRMED" },
        },
      },
    });
    await prisma.seat.update({
      where: { tripId_code: { tripId: dueTrip.id, code: "1" } },
      data: { bookingId: booking.id },
    });
  }
}

async function main() {
  if (await prisma.user.findUnique({ where: { email: "admin@ttn.pk" } })) {
    await ensureVerificationAndDemoBookings();
    console.log("Database already seeded. Verification media and demo bookings checked.");
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
      clientPhones: JSON.stringify(["03001112233", "03014445566", "03216667788", "03339998877", "03125550011"]),
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
          ...verificationMedia(),
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
      clientPhones: JSON.stringify(["03450001122", "03128889900", "03331112233", "03025556677", "03219990011"]),
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
          ...verificationMedia(),
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

  await ensureVerificationAndDemoBookings();
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
