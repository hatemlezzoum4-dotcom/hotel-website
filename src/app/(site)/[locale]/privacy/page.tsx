import PageHero from "@/components/site/PageHero";
import { getDictionary } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, "/privacy", getDictionary(locale).privacy.title);
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const locale = (await params).locale as Locale;
  const t = getDictionary(locale);
  return (
    <>
      <PageHero locale={locale} eyebrow={t.footer.info} title={t.privacy.title} />
      <section className="py-20">
        <div className="container-lux max-w-3xl space-y-6 text-lg text-muted">
          {t.privacy.body.map((p) => <p key={p}>{p}</p>)}
        </div>
      </section>
    </>
  );
}
