export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="h-3 w-40 rounded-full bg-gold/30" />
      <div className="mt-4 h-10 w-72 rounded-full bg-pine/15" />
      <div className="mt-8 grid gap-4">
        <div className="card h-40 animate-pulse rounded-3xl bg-sand/80" />
        <div className="card h-40 animate-pulse rounded-3xl bg-sand/80" />
      </div>
    </div>
  );
}
