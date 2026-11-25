import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import SectionHeading from "@/components/site/SectionHeading";
import Icon from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import Placeholder from "@/components/ui/Placeholder";
import { formatDzd } from "@/lib/format";
import { getDictionary, tr } from "@/lib/i18n";
import { getRestaurant, getSettings, listPhotos } from "@/lib/server/repo";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/restaurant">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/restaurant", t.restaurant.title, t.restaurant.intro, listPhotos({ category: "restaurant" })[0]);
}

export default async function RestaurantPage({ params }: PageProps<"/[locale]/restaurant">) {
  const locale = (await params).locale as Locale;
  const t = getDictionary(locale);
  const r = getRestaurant();
  const s = getSettings();
  const photos = listPhotos({ category: "restaurant" });
  const description = tr(r.description, locale);
  const hours = tr(r.hours, locale);
  const breakfast = tr(r.breakfastHours, locale);
  const wa = waLink(s.whatsapp, `${t.restaurant.title} – ${tr(s.hotelName, locale)}`);
  // Hours and menu are only shown once management has confirmed them (business rule).
  const showDetails = r.confirmed;

  return (
    <>
      <PageHero photo={photos[1] ?? photos[0]} locale={locale} eyebrow={t.home.experienceEyebrow} title={t.restaurant.title} intro={t.restaurant.intro} />

      <section className="py-24 md:py-32">
        <div className="container-lux grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <SectionHeading eyebrow={t.nav.restaurant} title={t.restaurant.service} />
            <div className="mt-8 text-lg text-muted" data-reveal>
              {description ? <p>{description}</p> : <p>{t.home.restaurantText}</p>}
            </div>
            <ul className="mt-10 space-y-6 border-t border-ivory-200 pt-8" data-reveal>
              <li className="flex gap-4">
                <Icon name="clock" className="mt-1 shrink-0 text-xl text-gold-600" />
                <div>
                  <p className="field-label">{t.restaurant.hours}</p>
                  <div className="mt-1">{showDetails && hours ? hours : <Placeholder locale={locale} />}</div>
                </div>
              </li>
              <li className="flex gap-4">
                <Icon name="coffee" className="mt-1 shrink-0 text-xl text-gold-600" />
                <div>
                  <p className="field-label">{t.restaurant.breakfast}</p>
                  <div className="mt-1">{showDetails && breakfast ? breakfast : <Placeholder locale={locale} />}</div>
                </div>
              </li>
            </ul>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-forest mt-10" data-reveal>
                <Icon name="whatsapp" className="text-lg" />{t.restaurant.ask}
              </a>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            {photos.map((p, i) => {
              // Pattern: one wide photo, then two side by side. A half-width photo left alone in its row goes wide.
              const wide = i % 3 === 0 || (i % 3 === 1 && i === photos.length - 1);
              return (
              <figure key={p.id} className={"group frame relative overflow-hidden " + (wide ? "aspect-[4/5] sm:col-span-2 sm:aspect-[16/10]" : "aspect-[4/5]")} data-reveal style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}>
                <Picture photo={p} alt={p.alt[locale]} sizes={wide ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 28vw, 50vw"} fill className="zoom-img" />
                <figcaption className="sr-only">{p.alt[locale]}</figcaption>
              </figure>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pattern-lux on-dark py-24 text-ivory-50 md:py-32">
        <div className="container-lux max-w-4xl">
          <SectionHeading eyebrow={t.nav.restaurant} title={t.restaurant.menu} dark align="center" />
          {showDetails && r.menu.length > 0 ? (
            <ul className="mt-14 divide-y divide-ivory-50/10" data-reveal>
              {r.menu.map((m, i) => (
                <li key={i} className="flex items-baseline gap-4 py-6">
                  <div className="flex-1">
                    <p className="font-display text-2xl">{tr(m.name, locale)}</p>
                    {tr(m.description, locale) && <p className="mt-1 text-ivory-100/65">{tr(m.description, locale)}</p>}
                  </div>
                  <span className="hidden flex-1 border-b border-dotted border-gold-500/40 sm:block" aria-hidden="true" />
                  <span className="ltr font-display text-2xl text-gold-300">{m.priceDzd != null ? formatDzd(m.priceDzd, locale) : "—"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-12 text-center" data-reveal>
              <p className="mx-auto max-w-xl text-lg text-ivory-100/75">{t.restaurant.menuPending}</p>
              <p className="mt-5"><Placeholder locale={locale} /></p>
            </div>
          )}
          <div className="mt-14 text-center">
            <Link href={`/${locale}/booking`} className="btn btn-gold">{t.home.requestBooking}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
