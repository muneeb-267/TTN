import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { suspendUser, reactivateUser } from "@/app/actions/admin";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const { q = "", role = "", page = "1" } = await searchParams;
  const take = 25;
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;
  const where = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [{ email: { contains: q } }, { name: { contains: q } }, { phone: { contains: q } }],
        }
      : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        suspendedAt: true,
        phone: true,
        _count: { select: { bookings: true } },
      },
    }),
  ]);
  return (
    <div>
      <h1 className="display text-4xl">Users</h1>
      <form className="mt-6 flex flex-wrap gap-2" action="/admin/users">
        <input name="q" defaultValue={q} placeholder="Name, email or phone" className="rounded-full border px-4 py-2" />
        <select name="role" defaultValue={role} className="rounded-full border px-4 py-2">
          <option value="">All roles</option>
          <option value="TRAVELER">Travelers</option>
          <option value="AGENCY">Agencies</option>
          <option value="ADMIN">Admins</option>
        </select>
        <button className="btn-pine rounded-full px-4 py-2">Search</button>
      </form>
      <p className="mt-3 text-sm text-ink/55">{total} users</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="text-xs tracking-widest text-moss">
              <th className="pb-2">User</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Joined</th>
              <th className="pb-2">Bookings</th>
              <th className="pb-2">Status</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ink/10">
                <td className="py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-ink/55">{u.email}</p>
                </td>
                <td>{u.role}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td>{u._count.bookings}</td>
                <td>{u.suspendedAt ? "Suspended" : "Active"}</td>
                <td>
                  {u.role !== "ADMIN" ? (
                    u.suspendedAt ? (
                      <form action={reactivateUser.bind(null, u.id)}>
                        <button className="text-link">Reactivate</button>
                      </form>
                    ) : (
                      <form action={suspendUser.bind(null, u.id)}>
                        <button className="text-link">Suspend</button>
                      </form>
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
