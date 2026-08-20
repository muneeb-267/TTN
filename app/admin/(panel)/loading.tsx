export default function Loading() {
  return (
    <div>
      <div className="h-3 w-32 rounded-full bg-gold/30" />
      <div className="mt-3 h-10 w-56 rounded-full bg-pine/15" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse rounded-3xl bg-sand/80" />
        ))}
      </div>
    </div>
  );
}
