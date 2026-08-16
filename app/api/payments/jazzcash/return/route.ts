import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { confirmPayment, verifyJazzcashResponse } from "@/lib/payments";

export async function POST(req: Request) {
  const form = await req.formData();
  const fields: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") fields[key] = value;
  });
  return finish(fields);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fields: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    fields[key] = value;
  });
  return finish(fields);
}

async function finish(fields: Record<string, string>) {
  const txnRef = fields.pp_TxnRefNo || "";
  const payment = await prisma.payment.findFirst({
    where: { providerRef: txnRef },
    include: { booking: true },
  });
  if (!payment) {
    redirect("/traveler");
  }
  const ok =
    fields.pp_ResponseCode === "000" &&
    (!process.env.JAZZCASH_INTEGRITY_SALT || verifyJazzcashResponse(fields));
  if (ok) {
    await confirmPayment(payment.id, {
      providerTxn: fields.pp_RetreivalReferenceNo || fields.pp_TxnRefNo,
      payerAccount: fields.pp_MobileNumber || "",
    });
    redirect(`/traveler/bookings/${payment.bookingId}/slip`);
  }
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: payment.status === "CONFIRMED" ? payment.status : "FAILED" },
  });
  redirect(`/traveler/bookings/${payment.bookingId}/pay`);
}
