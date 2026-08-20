import Link from "next/link";

export function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-12 text-center">
      <p className="display text-3xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">{body}</p>
      {href && cta ? (
        <Link href={href} className="btn-gold mt-6 inline-flex rounded-full px-5 py-2.5 font-semibold">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
