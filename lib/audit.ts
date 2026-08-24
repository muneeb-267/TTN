import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function writeAudit(input: {
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  let ip = "";
  try {
    const h = await headers();
    ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "").split(",")[0].trim();
  } catch {
    ip = "";
  }
  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      oldValue: input.oldValue === undefined ? "" : JSON.stringify(input.oldValue),
      newValue: input.newValue === undefined ? "" : JSON.stringify(input.newValue),
      ip,
    },
  });
}
