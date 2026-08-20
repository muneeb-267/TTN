export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border-2 border-gold/45 bg-[#fffdf8] px-3 py-2.5 outline-none ring-gold/40 transition hover:border-gold focus:ring-2";
