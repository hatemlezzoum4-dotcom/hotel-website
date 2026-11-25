import Placeholder from "@/components/ui/Placeholder";
import { tr, getDictionary } from "@/lib/i18n";
import { formatDzd } from "@/lib/format";
import type { Locale, Room } from "@/lib/types";

export default function PriceTag({ room, locale, compact }: { room: Room; locale: Locale; compact?: boolean }) {
  const t = getDictionary(locale);
  const note = tr(room.priceNote, locale);
  if (room.priceDzd == null) {
    return (
      <div>
        <p className={"font-display text-forest-900 " + (compact ? "text-xl" : "text-2xl")}>{t.placeholder.onRequest}</p>
        <div className="mt-1"><Placeholder locale={locale} /></div>
      </div>
    );
  }
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className={"ltr font-display text-forest-900 " + (compact ? "text-2xl" : "text-[2rem]")}>
          {formatDzd(room.priceDzd, locale)}
        </span>
        <span className="text-sm text-muted">{t.rooms.perNight}</span>
      </p>
      {note && <p className="text-sm text-forest-700">{note}</p>}
      {!room.priceConfirmed && (
        <div className="mt-1.5">
          <Placeholder locale={locale} label={t.placeholder.indicative} />
        </div>
      )}
    </div>
  );
}
