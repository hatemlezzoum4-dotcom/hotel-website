import BookingForm from "@/components/site/BookingForm";
import PageHero from "@/components/site/PageHero";
import Icon from "@/components/ui/Icon";
import Placeholder from "@/components/ui/Placeholder";
import { telHref, todayInAlgiers } from "@/lib/format";
import { getDictionary, tr } from "@/lib/i18n";
import { getSettings, listPhotos, listRooms } from "@/lib/server/repo";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/booking">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/booking", t.booking.title, t.booking.intro);
}

export default async function BookingPage({ params, searchParams }: PageProps<"/[locale]/booking">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const t = getDictionary(locale);
  const s = getSettings();
  const rooms = listRooms({ publishedOnly: true }).map((r) => ({ slug: r.slug, label: tr(r.name, locale) }));
  const hero = listPhotos({ category: "hotel" }).find((p) => p.width > p.height);

  return (
    <>
      <PageHero photo={hero} locale={locale} eyebrow={t.nav.book} title={t.booking.title} intro={t.booking.intro} />
      <section className="bg-ivory-100 py-20 md:py-28">
        <div className="container-lux grid items-start gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-4 lg:sticky lg:top-32">
            <ol className="space-y-8">
              {t.booking.steps.map((step, i) => (
                <li key={step} className="flex gap-5" data-reveal style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold-500 font-display text-xl text-gold-700">{i + 1}</span>
                  <p className="pt-2.5 text-lg text-forest-900">{step}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 border-t border-ivory-300 pt-8" data-reveal>
              <p className="field-label">{t.contact.phone}</p>
              <div className="mt-2 flex flex-col">
                {s.phones.length ? s.phones.map((p) => (
                  <a key={p} href={telHref(p)} className="ltr flex w-fit items-center gap-2 text-lg hover:text-gold-700">
                    <Icon name="phone" className="text-gold-600" />{p}
                  </a>
                )) : <Placeholder locale={locale} />}
              </div>
              {!s.whatsappConfirmed && s.whatsapp && (
                <p className="mt-6"><Placeholder locale={locale} label={`${t.contact.whatsapp} · ${t.placeholder.tbc}`} /></p>
              )}
            </div>
          </aside>
          <div className="lg:col-span-8" data-reveal>
            <BookingForm
              locale={locale}
              rooms={rooms}
              initialRoom={typeof sp.room === "string" ? sp.room : ""}
              today={todayInAlgiers()}
              phone={s.phones[0]}
            />
          </div>
        </div>
      </section>
    </>
  );
}
