"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function reviewAgency(agencyId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return;
  const decision = String(formData.get("decision") || "");
  const status = decision === "approve" ? "APPROVED" : "REJECTED";
  await prisma.agency.update({ where: { id: agencyId }, data: { status } });
  revalidatePath("/admin");
}
