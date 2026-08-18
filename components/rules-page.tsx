import Link from "next/link";
import { COMPLAINTS_EMAIL } from "@/lib/constants";

export function RulesLayout({
  kicker,
  title,
  intro,
  sections,
}: {
  kicker: string;
  title: string;
  intro: string;
  sections: { heading: string; points: string[] }[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs tracking-[0.3em] text-moss">{kicker}</p>
      <h1 className="display mt-3 text-5xl">{title}</h1>
      <p className="mt-4 text-ink/70">{intro}</p>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading} className="card rounded-3xl p-6">
            <h2 className="display text-2xl">{section.heading}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink/80">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm text-ink/60">
        Questions or complaints:{" "}
        <a href={`mailto:${COMPLAINTS_EMAIL}`} className="text-link">
          {COMPLAINTS_EMAIL}
        </a>
        {" · "}
        <Link href="/trips" className="text-link">
          Back to trips
        </Link>
      </p>
    </div>
  );
}
