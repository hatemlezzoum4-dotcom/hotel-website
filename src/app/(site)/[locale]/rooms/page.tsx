import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { RoomDetail } from "@/components/site/RoomCard";
import Icon from "@/components/ui/Icon";
import { getDictionary } from "@/lib/i18n";
import { listPhotos, listRooms } from "@/lib/server/repo";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/rooms">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/rooms", t.rooms.title, t.rooms.intro, listPhotos({ category: "rooms" })[0]);
}

export default async function RoomsPage({ params }: PageProps<"/[locale]/rooms">) {
  const locale = (await params).locale as Locale;
  const t = getDictionary(locale);
  const rooms = listRooms({ publishedOnly: true });
  const hero = listPhotos({ category: "rooms" })[0];
  return (
    <>
      <PageHero photo={hero} locale={locale} eyebrow={t.home.roomsEyebrow} title={t.rooms.title} intro={t.rooms.intro} />
      <section className="py-24 md:py-32">
        <div className="container-lux space-y-28 md:space-y-36">
          {rooms.length ? rooms.map((r, i) => <RoomDetail key={r.id} room={r} locale={locale} index={i} />) : <p className="text-muted">{t.rooms.empty}</p>}
        </div>
      </section>
      <section className="bg-ivory-100 py-16">
        <div className="container-lux flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between" data-reveal>
          <p className="flex max-w-2xl items-start gap-3 text-muted">
            <Icon name="calendar" className="mt-1 shrink-0 text-xl text-gold-600" />
            {t.rooms.disclaimer}
          </p>
          <Link href={`/${locale}/booking`} className="btn btn-gold">{t.home.requestBooking}</Link>
        </div>
      </section>
    </>
  );
}
