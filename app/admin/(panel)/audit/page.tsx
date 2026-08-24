import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { admin: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="display text-4xl">Audit logs</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="text-xs tracking-widest text-moss">
              <th className="pb-2">When</th>
              <th className="pb-2">Admin</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">Entity</th>
              <th className="pb-2">New value</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-ink/10 align-top">
                <td className="py-2">{l.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
                <td>{l.admin.email}</td>
                <td>{l.action}</td>
                <td>
                  {l.entity} {l.entityId}
                </td>
                <td className="max-w-sm truncate text-ink/60">{l.newValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
