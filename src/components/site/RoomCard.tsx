import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Placeholder from "@/components/ui/Placeholder";
import PriceTag from "./PriceTag";
import RoomPhotos from "./RoomPhotos";
import { getDictionary, tr } from "@/lib/i18n";
import type { Locale, Room } from "@/lib/types";

function NoPhoto({ label }: { label: string }) {
  return (
    <div className="pattern-lux flex h-full w-full flex-col items-center justify-center gap-3 text-center text-ivory-100/70">
      <Icon name="bed" className="text-4xl text-gold-400" />
      <span className="tbc on-dark">{label}</span>
    </div>
  );
}

/** Compact card used on the home page. */
export function RoomTeaser({ room, locale, index }: { room: Room; locale: Locale; index: number }) {
  const t = getDictionary(locale);
  return (
    <article className="group card-lux flex flex-col" data-reveal style={{ ["--reveal-delay" as string]: `${index * 120}ms` }}>
      <div className="frame relative aspect-[4/3] overflow-hidden">
        {room.photos.length ? (
          <RoomPhotos name={tr(room.name, locale)} photos={room.photos} locale={locale} labels={t.a11y} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        ) : (
          <NoPhoto label={t.rooms.noPhoto} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-7">
        <p className="eyebrow">{tr(room.category, locale) || t.nav.rooms}</p>
        <h3 className="mt-3 text-3xl text-forest-900">{tr(room.name, locale)}</h3>
        <div className="mt-5 flex-1">
          <PriceTag room={room} locale={locale} compact />
        </div>
        <Link href={`/${locale}/booking?room=${room.slug}`} className="link-lux mt-6 self-start">
          {t.rooms.book}
          <Icon name={locale === "ar" ? "arrowLeft" : "arrow"} />
        </Link>
      </div>
    </article>
  );
}

/** Detailed alternating row used on the rooms page. */
export function RoomDetail({ room, locale, index }: { room: Room; locale: Locale; index: number }) {
  const t = getDictionary(locale);
  const amenities = room.amenities[locale].length ? room.amenities[locale] : room.amenities.fr;
  const description = tr(room.description, locale);
  const reverse = index % 2 === 1;
  return (
    <article id={room.slug} className="group grid scroll-mt-28 items-center gap-10 lg:grid-cols-12 lg:gap-16" aria-labelledby={`${room.slug}-title`}>
      <div className={"frame relative aspect-[4/3] overflow-hidden lg:col-span-7 " + (reverse ? "lg:order-2" : "")} data-reveal>
        {room.photos.length ? (
          <RoomPhotos name={tr(room.name, locale)} photos={room.photos} locale={locale} labels={t.a11y} sizes="(min-width: 1024px) 58vw, 100vw" />
        ) : (
          <NoPhoto label={t.rooms.noPhoto} />
        )}
      </div>
      <div className="lg:col-span-5" data-reveal style={{ ["--reveal-delay" as string]: "150ms" }}>
        <p className="eyebrow">{tr(room.category, locale) || t.nav.rooms}</p>
        <h2 id={`${room.slug}-title`} className="heading-lg mt-4 text-forest-900">{tr(room.name, locale)}</h2>
        {locale === "fr" && room.name.ar && <p lang="ar" dir="rtl" className="mt-2 w-fit font-arabic text-xl text-gold-700">{room.name.ar}</p>}
        <div className="mt-6 text-lg text-muted">
          {description ? <p>{description}</p> : <Placeholder locale={locale} long />}
        </div>

        <dl className="mt-8 grid gap-5 border-y border-ivory-200 py-6 sm:grid-cols-2">
          <div>
            <dt className="field-label flex items-center gap-2"><Icon name="users" className="text-gold-600" />{t.rooms.capacity}</dt>
            <dd className="mt-2">{room.capacity ? t.rooms.persons(room.capacity) : <Placeholder locale={locale} />}</dd>
          </div>
          <div>
            <dt className="field-label flex items-center gap-2"><Icon name="star" className="text-gold-600" />{t.rooms.amenities}</dt>
            <dd className="mt-2">
              {amenities.length ? (
                <ul className="space-y-1">
                  {amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2"><Icon name="check" className="text-gold-600" />{a}</li>
                  ))}
                </ul>
              ) : (
                <Placeholder locale={locale} />
              )}
            </dd>
          </div>
        </dl>
        {!room.detailsConfirmed && (description || room.capacity || amenities.length > 0) && (
          <p className="mt-3"><Placeholder locale={locale} long /></p>
        )}

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="field-label mb-2">{t.rooms.price}</p>
            <PriceTag room={room} locale={locale} />
          </div>
          <Link href={`/${locale}/booking?room=${room.slug}`} className="btn btn-forest">
            {t.rooms.book}
          </Link>
        </div>
      </div>
    </article>
  );
}
