import { PageShell } from "@/components/shell";
import { RulesLayout } from "@/components/rules-page";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";

export default async function LegalPage({
  title,
  kicker,
  intro,
  sections,
}: {
  title: string;
  kicker: string;
  intro: string;
  sections: { heading: string; points: string[] }[];
}) {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <RulesLayout kicker={kicker} title={title} intro={intro} sections={sections} />
    </PageShell>
  );
}
