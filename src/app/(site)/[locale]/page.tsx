import Link from "next/link";
import HeroSlideshow from "@/components/site/HeroSlideshow";
import JsonLd from "@/components/site/JsonLd";
import MapEmbed from "@/components/site/MapEmbed";
import { RoomTeaser } from "@/components/site/RoomCard";
import SectionHeading from "@/components/site/SectionHeading";
import Icon from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import Placeholder from "@/components/ui/Placeholder";
import { telHref } from "@/lib/format";
import { getDictionary, tr } from "@/lib/i18n";
import { getPhoto, getPhotos, getSettings, listFacilities, listPhotos, listRooms } from "@/lib/server/repo";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale, type Photo } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/** Round-robin across categories so the teaser shows rooms, restaurant, salon… rather than one theme. */
function mixCategories(photos: Photo[]) {
  const groups = new Map<string, Photo[]>();
  for (const p of photos) groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  const out: Photo[] = [];
  while (out.length < photos.length) for (const g of groups.values()) if (g.length) out.push(g.shift()!);
  return out;
}

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const s = getSettings();
  return pageMeta(locale, "", null, undefined, getPhotos(s.heroPhotoIds)[0]);
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale: l } = await params;
  const locale = l as Locale;
  const t = getDictionary(locale);
  const s = getSettings();
  const heroPhotos = getPhotos(s.heroPhotoIds);
  const fallbackHero = heroPhotos.length ? heroPhotos : listPhotos({ category: "hotel" }).slice(0, 3);
  const aboutPhoto = s.aboutPhotoId ? getPhoto(s.aboutPhotoId) : null;
  const rooms = listRooms({ publishedOnly: true });
  const facilities = listFacilities({ publishedOnly: true });
  const restaurantPhoto = listPhotos({ category: "restaurant" })[0];
  const salonPhoto = listPhotos({ category: "salon" })[0];
  const gallery = mixCategories(listPhotos({ gallery: true }));
  const name = tr(s.hotelName, locale);
  const wa = waLink(s.whatsapp);
  const arrow = locale === "ar" ? "arrowLeft" : "arrow";

  return (
    <>
      <JsonLd s={s} locale={locale} photos={fallbackHero} />

      {/* ───────────── Hero ───────────── */}
      <section className="on-dark relative flex min-h-[100svh] items-end overflow-hidden text-ivory-50">
        <HeroSlideshow photos={fallbackHero} locale={locale} />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/45 to-forest-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/60 to-transparent rtl:bg-gradient-to-l" />
        <div className="grain" />
        <div className="container-lux relative pb-24 pt-40 md:pb-32">
          <p className="eyebrow hero-line">{t.home.eyebrow}</p>
          <p
            lang={locale === "fr" ? "ar" : "fr"}
            dir={locale === "fr" ? "rtl" : "ltr"}
            className="hero-line mt-6 w-fit font-arabic text-3xl text-gold-300 md:text-4xl"
            style={{ ["--d" as string]: "100ms" }}
          >
            {locale === "fr" ? s.hotelName.ar : s.hotelName.fr}
          </p>
          <h1 className="heading-xl hero-line mt-2 max-w-5xl" style={{ ["--d" as string]: "200ms" }}>
            {name}
          </h1>
          <p className="hero-line mt-4 font-display text-2xl italic text-ivory-100/90 md:text-3xl rtl:not-italic" style={{ ["--d" as string]: "320ms" }}>
            {t.home.welcome}
          </p>
          <p className="hero-line mt-6 max-w-xl text-lg text-ivory-100/80" style={{ ["--d" as string]: "440ms" }}>
            {tr(s.tagline, locale) || t.home.heroSub}
          </p>
          <div className="hero-line mt-10 flex flex-wrap gap-4" style={{ ["--d" as string]: "560ms" }}>
            <Link href={`/${locale}/rooms`} className="btn btn-gold">{t.home.exploreRooms}</Link>
            <Link href={`/${locale}/booking`} className="btn btn-outline-light">{t.home.requestBooking}</Link>
          </div>
        </div>
        <div className="absolute bottom-8 hidden flex-col items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-ivory-100/60 md:flex ltr:right-10 rtl:left-10" aria-hidden="true">
          {t.home.scroll}
          <span className="scroll-cue block h-14 w-px bg-gold-400" />
        </div>
      </section>

      {/* ───────────── Quick facts ───────────── */}
      <section className="relative z-10 -mt-px bg-forest-900 text-ivory-100" aria-label={t.contact.title}>
        <div className="container-lux grid divide-y divide-ivory-50/10 md:grid-cols-3 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
          <div className="flex items-start gap-4 py-7 md:px-8 md:first:ps-0">
            <Icon name="pin" className="mt-1 shrink-0 text-xl text-gold-400" />
            <div>
              <p className="field-label !text-gold-300">{t.contact.address}</p>
              <p className="mt-1">{tr(s.address, locale) || <Placeholder locale={locale} />}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 py-7 md:px-8">
            <Icon name="phone" className="mt-1 shrink-0 text-xl text-gold-400" />
            <div>
              <p className="field-label !text-gold-300">{t.contact.phone}</p>
              <p className="mt-1 flex flex-wrap gap-x-4">
                {s.phones.length ? s.phones.map((p) => <a key={p} href={telHref(p)} className="ltr hover:text-gold-300">{p}</a>) : <Placeholder locale={locale} />}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 py-7 md:px-8">
            <Icon name="clock" className="mt-1 shrink-0 text-xl text-gold-400" />
            <div>
              <p className="field-label !text-gold-300">{t.contact.checkIn} · {t.contact.checkOut}</p>
              <p className="mt-1">
                {s.checkIn && s.checkOut ? <span className="ltr">{s.checkIn} · {s.checkOut}</span> : <span className="on-dark"><Placeholder locale={locale} /></span>}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── About ───────────── */}
      <section className="overflow-hidden py-24 md:py-36">
        <div className="container-lux grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="relative lg:col-span-6" data-reveal>
            <div className="group frame relative aspect-[4/5] overflow-hidden">
              {aboutPhoto && <Picture photo={aboutPhoto} alt={aboutPhoto.alt[locale]} sizes="(min-width: 1024px) 45vw, 100vw" fill className="zoom-img" />}
            </div>
            <div className="absolute -bottom-8 hidden h-40 w-40 border border-gold-400 md:block ltr:-right-8 rtl:-left-8" aria-hidden="true" />
          </div>
          <div className="lg:col-span-6">
            <SectionHeading eyebrow={t.home.aboutEyebrow} title={t.home.aboutTitle} />
            <div className="mt-8 space-y-5 text-lg text-muted" data-reveal>
              <p>{tr(s.intro, locale) || t.home.aboutFallback}</p>
              {locale === "fr" && s.intro.ar && (
                <p lang="ar" dir="rtl" className="font-arabic text-xl leading-loose text-forest-700">{s.intro.ar}</p>
              )}
            </div>
            <div className="ornament mt-10 max-w-xs" aria-hidden="true">◆</div>
            <div className="mt-10 flex flex-wrap gap-4" data-reveal>
              <Link href={`/${locale}/gallery`} className="link-lux">{t.home.viewGallery}<Icon name={arrow} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Rooms ───────────── */}
      <section className="bg-ivory-100 py-24 md:py-32">
        <div className="container-lux">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading eyebrow={t.home.roomsEyebrow} title={t.home.roomsTitle} text={t.home.roomsText} />
            <Link href={`/${locale}/rooms`} className="btn btn-outline" data-reveal>{t.home.allRooms}</Link>
          </div>
          {rooms.length ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {rooms.slice(0, 3).map((r, i) => <RoomTeaser key={r.id} room={r} locale={locale} index={i} />)}
            </div>
          ) : (
            <p className="mt-12 text-muted">{t.rooms.empty}</p>
          )}
        </div>
      </section>

      {/* ───────────── Restaurant & salon ───────────── */}
      <section className="py-24 md:py-32">
        <div className="container-lux">
          <SectionHeading eyebrow={t.home.experienceEyebrow} title={`${t.nav.restaurant} · ${t.nav.salon}`} align="center" />
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {[
              { photo: restaurantPhoto, title: t.restaurant.title, text: t.home.restaurantText, href: `/${locale}/restaurant` },
              { photo: salonPhoto, title: t.salon.title, text: t.home.salonText, href: `/${locale}/salon` },
            ].map((c, i) => (
              <Link key={c.href} href={c.href} className="group on-dark relative flex aspect-[4/5] items-end overflow-hidden text-ivory-50 sm:aspect-[5/6]" data-reveal style={{ ["--reveal-delay" as string]: `${i * 150}ms` }}>
                {c.photo && <Picture photo={c.photo} alt={c.photo.alt[locale]} sizes="(min-width: 768px) 50vw, 100vw" fill className="zoom-img" />}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/95 via-forest-950/30 to-transparent transition-opacity duration-700 group-hover:opacity-90" />
                <div className="frame absolute inset-0" />
                <div className="relative p-8 md:p-12">
                  <h3 className="heading-md">{c.title}</h3>
                  <p className="mt-3 max-w-sm text-ivory-100/80">{c.text}</p>
                  <span className="link-lux mt-6">{t.home.discover}<Icon name={arrow} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Facilities ───────────── */}
      {facilities.length > 0 && (
        <section className="pattern-lux on-dark py-24 text-ivory-50 md:py-32">
          <div className="container-lux">
            <SectionHeading eyebrow={t.home.facilitiesEyebrow} title={t.home.facilitiesTitle} dark align="center" />
            <ul className="mt-16 grid border-s border-t border-ivory-50/10 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((f, i) => (
                <li key={f.id} className="group border-b border-e border-ivory-50/10 bg-forest-900/60 p-8 transition-colors duration-500 hover:bg-forest-800 md:p-10" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 100}ms` }}>
                  <Icon name={f.icon} className="text-4xl text-gold-400 transition-transform duration-700 group-hover:-translate-y-1" />
                  <h3 className="mt-6 text-2xl">{tr(f.name, locale)}</h3>
                  {tr(f.description, locale) && <p className="mt-2 text-ivory-100/70">{tr(f.description, locale)}</p>}
                  {!f.confirmed && <p className="mt-4"><Placeholder locale={locale} /></p>}
                </li>
              ))}
            </ul>
            {facilities.some((f) => !f.confirmed) && <p className="mt-8 text-center text-sm text-ivory-100/60">{t.home.facilitiesNote}</p>}
          </div>
        </section>
      )}

      {/* ───────────── Gallery teaser ───────────── */}
      {gallery.length >= 5 && (
        <section className="py-24 md:py-32">
          <div className="container-lux">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <SectionHeading eyebrow={t.home.galleryEyebrow} title={t.home.galleryTitle} text={t.gallery.intro} />
              <Link href={`/${locale}/gallery`} className="btn btn-outline" data-reveal>{t.home.viewGallery}</Link>
            </div>
            <div className="mt-14 grid auto-rows-[11rem] grid-cols-2 gap-3 md:auto-rows-[14rem] md:grid-cols-4 md:gap-4">
              {gallery.slice(0, 5).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/${locale}/gallery`}
                  className={"group relative overflow-hidden " + (i === 0 ? "col-span-2 row-span-2" : "")}
                  data-reveal
                  style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}
                >
                  <Picture photo={p} alt={p.alt[locale]} sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} fill className="zoom-img" />
                  <span className="absolute inset-0 bg-forest-950/0 transition-colors duration-500 group-hover:bg-forest-950/25" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────── Booking CTA ───────────── */}
      <section className="on-dark relative overflow-hidden bg-forest-950 py-24 text-ivory-50 md:py-32">
        {fallbackHero[1] && <Picture photo={fallbackHero[1]} alt="" sizes="100vw" fill className="opacity-30" />}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/85 to-forest-950/60 rtl:bg-gradient-to-l" />
        <div className="container-lux relative max-w-3xl text-center" data-reveal>
          <p className="eyebrow justify-center">{t.booking.title}</p>
          <h2 className="heading-lg mt-5">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ivory-100/80">{t.home.ctaText}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={`/${locale}/booking`} className="btn btn-gold">{t.home.requestBooking}</Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
                <Icon name="whatsapp" className="text-lg" />{t.contact.writeUs}
              </a>
            )}
          </div>
          {!s.whatsappConfirmed && wa && <p className="mt-6"><Placeholder locale={locale} label={`${t.contact.whatsapp} · ${t.placeholder.tbc}`} /></p>}
        </div>
      </section>

      {/* ───────────── Location ───────────── */}
      <section className="bg-ivory-100">
        <div className="grid lg:grid-cols-2">
          <div className="container-lux py-24 lg:max-w-none lg:px-16 xl:px-24">
            <SectionHeading eyebrow={t.home.locationEyebrow} title={t.home.locationTitle} />
            <ul className="mt-10 space-y-6" data-reveal>
              <li className="flex gap-4">
                <Icon name="pin" className="mt-1 shrink-0 text-xl text-gold-600" />
                <div><p className="field-label">{t.contact.address}</p><p className="mt-1 text-lg">{tr(s.address, locale) || <Placeholder locale={locale} />}</p></div>
              </li>
              <li className="flex gap-4">
                <Icon name="mail" className="mt-1 shrink-0 text-xl text-gold-600" />
                <div><p className="field-label">{t.contact.email}</p><p className="mt-1 text-lg">{s.email ? <a href={`mailto:${s.email}`} className="ltr hover:text-gold-700">{s.email}</a> : <Placeholder locale={locale} />}</p></div>
              </li>
            </ul>
            <div className="mt-10 flex flex-wrap gap-4" data-reveal>
              {s.mapsUrl && <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-forest">{t.contact.map}</a>}
              <Link href={`/${locale}/contact`} className="btn btn-outline">{t.nav.contact}</Link>
            </div>
          </div>
          <div className="min-h-[24rem]">
            <MapEmbed s={s} title={t.contact.mapTitle} />
          </div>
        </div>
      </section>
    </>
  );
}
