import { mediaUrl } from "@/lib/media";
import { tr } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import type { HotelSettings, Locale, Photo } from "@/lib/types";

/** schema.org Hotel data. Only factual fields already shown on the site; no ratings, no price range. */
export default function JsonLd({ s, locale, photos }: { s: HotelSettings; locale: Locale; photos: Photo[] }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: tr(s.hotelName, locale),
    url: `${SITE_URL}/${locale}`,
    image: photos.slice(0, 4).map((p) => SITE_URL + mediaUrl(p.fileKey, Math.min(p.width, 1600))),
    address: tr(s.address, locale)
      ? { "@type": "PostalAddress", streetAddress: tr(s.address, locale), addressLocality: "Douéra", addressRegion: "Alger", addressCountry: "DZ" }
      : undefined,
    telephone: s.phones[0] || undefined,
    email: s.email || undefined,
    geo: s.mapLat != null && s.mapLng != null ? { "@type": "GeoCoordinates", latitude: s.mapLat, longitude: s.mapLng } : undefined,
    hasMap: s.mapsUrl || undefined,
    checkinTime: s.checkIn || undefined,
    checkoutTime: s.checkOut || undefined,
  };
  // "<" is escaped so the JSON can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
