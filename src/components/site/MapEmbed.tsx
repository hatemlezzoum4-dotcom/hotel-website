import type { HotelSettings } from "@/lib/types";

/** Google Maps embed (no API key required). Disclosed on the privacy page as a third-party service. */
export default function MapEmbed({ s, title, className = "" }: { s: HotelSettings; title: string; className?: string }) {
  if (s.mapLat == null || s.mapLng == null) return null;
  const src = `https://maps.google.com/maps?q=${s.mapLat},${s.mapLng}&z=17&hl=fr&output=embed`;
  return (
    <iframe
      title={title}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={"h-full min-h-[22rem] w-full border-0 grayscale-[35%] contrast-[1.05] " + className}
    />
  );
}
