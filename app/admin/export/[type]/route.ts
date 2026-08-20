import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csv(rows: string[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { type } = await params;
  let rows: string[][] = [];
  if (type === "bookings") {
    const data = await prisma.booking.findMany({ include: { traveler: true, trip: { include: { agency: true } } } });
    rows = [
      ["ref", "status", "traveler", "agency", "gross", "commission", "processingFee", "agencySettlement", "refund", "net"],
      ...data.map((b) => [
        b.publicRef,
        b.status,
        b.traveler.email,
        b.trip.agency.businessName,
        String(b.totalPrice),
        String(b.platformFee),
        String(b.processingFee),
        String(b.agencySettlement),
        String(b.refundAmount),
        String(b.netRevenue),
      ]),
    ];
  } else if (type === "payments") {
    const data = await prisma.payment.findMany({ include: { booking: true } });
    rows = [
      ["id", "booking", "method", "amount", "status", "providerTxn", "created"],
      ...data.map((p) => [p.id, p.booking.publicRef, p.method, String(p.amount), p.status, p.providerTxn, p.createdAt.toISOString()]),
    ];
  } else if (type === "commission") {
    const data = await prisma.ledgerEntry.findMany({ where: { type: "COMMISSION" } });
    rows = [["reference", "amount", "created"], ...data.map((e) => [e.reference, String(e.amount), e.createdAt.toISOString()])];
  } else if (type === "settlements") {
    const data = await prisma.settlement.findMany({ include: { agency: true } });
    rows = [
      ["agency", "gross", "commission", "fees", "refunds", "net", "status"],
      ...data.map((s) => [
        s.agency.businessName,
        String(s.grossAmount),
        String(s.commissionAmount),
        String(s.processingFeeAmount),
        String(s.refundAmount),
        String(s.netPayable),
        s.status,
      ]),
    ];
  } else if (type === "refunds") {
    const data = await prisma.refundRequest.findMany({ include: { booking: true } });
    rows = [["booking", "status", "travelerRefund", "platformKeep", "agencyKeep"], ...data.map((r) => [r.booking.publicRef, r.status, String(r.travelerRefund), String(r.platformKeep), String(r.agencyKeep)])];
  } else if (type === "users") {
    const data = await prisma.user.findMany();
    rows = [["name", "email", "role", "created"], ...data.map((u) => [u.name, u.email, u.role, u.createdAt.toISOString()])];
  } else if (type === "agencies") {
    const data = await prisma.agency.findMany({ include: { user: true } });
    rows = [["name", "email", "status", "city"], ...data.map((a) => [a.businessName, a.user.email, a.status, a.city])];
  } else {
    return NextResponse.json({ error: "Unknown report" }, { status: 404 });
  }
  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ttn-${type}.csv"`,
    },
  });
}
