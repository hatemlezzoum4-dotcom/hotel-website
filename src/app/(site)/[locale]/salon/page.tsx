import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import SectionHeading from "@/components/site/SectionHeading";
import Icon from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import Placeholder from "@/components/ui/Placeholder";
import { telHref } from "@/lib/format";
import { getDictionary, tr } from "@/lib/i18n";
import { getSalon, getSettings, listPhotos } from "@/lib/server/repo";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/salon">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/salon", t.salon.title, t.salon.intro, listPhotos({ category: "salon" })[0]);
}

export default async function SalonPage({ params }: PageProps<"/[locale]/salon">) {
  const locale = (await params).locale as Locale;
  const t = getDictionary(locale);
  const salon = getSalon();
  const s = getSettings();
  const photos = listPhotos({ category: "salon" });
  const extra = listPhotos({ category: "facilities" });
  const description = tr(salon.description, locale);
  const capacity = tr(salon.capacity, locale);
  const services = salon.services.map((x) => tr(x, locale)).filter(Boolean);
  const wa = waLink(s.whatsapp, `${t.salon.ask} – ${tr(s.hotelName, locale)}`);

  return (
    <>
      <PageHero photo={photos[0]} locale={locale} eyebrow={t.home.experienceEyebrow} title={t.salon.title} intro={t.salon.intro} />

      <section className="py-24 md:py-32">
        <div className="container-lux grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="grid grid-cols-2 gap-4">
            {[...photos, ...extra].slice(0, 3).map((p, i) => (
              <div key={p.id} className={"group frame relative overflow-hidden " + (i === 0 ? "col-span-2 aspect-[16/11]" : "aspect-square")} data-reveal style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}>
                <Picture photo={p} alt={p.alt[locale]} sizes={i === 0 ? "(min-width: 1024px) 45vw, 100vw" : "(min-width: 1024px) 22vw, 50vw"} fill className="zoom-img" />
              </div>
            ))}
          </div>
          <div>
            <SectionHeading eyebrow={t.nav.salon} title={t.salon.title} />
            <div className="mt-8 text-lg text-muted" data-reveal>
              {description ? <p>{description}</p> : <><p>{t.home.salonText}</p><p className="mt-3"><Placeholder locale={locale} long /></p></>}
            </div>

            <div className="mt-10 grid gap-8 border-t border-ivory-200 pt-8 sm:grid-cols-2" data-reveal>
              <div>
                <h3 className="field-label flex items-center gap-2"><Icon name="star" className="text-gold-600" />{t.salon.services}</h3>
                {services.length ? (
                  <ul className="mt-3 space-y-2">
                    {services.map((x) => <li key={x} className="flex items-center gap-2"><Icon name="check" className="text-gold-600" />{x}</li>)}
                  </ul>
                ) : (
                  <p className="mt-3"><Placeholder locale={locale} /></p>
                )}
              </div>
              <div>
                <h3 className="field-label flex items-center gap-2"><Icon name="users" className="text-gold-600" />{t.salon.capacity}</h3>
                <p className="mt-3">{capacity || <Placeholder locale={locale} />}</p>
              </div>
            </div>
            {!salon.confirmed && (services.length > 0 || capacity || description) && <p className="mt-4"><Placeholder locale={locale} long /></p>}
            {!services.length && <p className="mt-6 text-sm text-muted">{t.salon.servicesPending}</p>}
          </div>
        </div>
      </section>

      <section className="pattern-lux on-dark py-20 text-ivory-50">
        <div className="container-lux flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between" data-reveal>
          <div className="max-w-xl">
            <h2 className="heading-md">{t.salon.ask}</h2>
            <p className="mt-3 text-ivory-100/75">{t.salon.askText}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-gold"><Icon name="whatsapp" className="text-lg" />{t.contact.writeUs}</a>}
            {s.phones[0] && <a href={telHref(s.phones[0])} className="btn btn-outline-light"><Icon name="phone" />{<span className="ltr">{s.phones[0]}</span>}</a>}
            <Link href={`/${locale}/contact`} className="btn btn-outline-light">{t.nav.contact}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
