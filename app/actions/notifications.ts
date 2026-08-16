"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session) return;
  await prisma.notification.updateMany({
    where: { id, userId: session.id },
    data: { read: true },
  });
  revalidatePath("/inbox");
}
