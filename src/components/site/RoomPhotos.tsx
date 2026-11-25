"use client";
import { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import type { Locale, Photo } from "@/lib/types";

/** Swipeable photo strip (CSS scroll-snap) with arrow buttons and position dots. */
export default function RoomPhotos({ photos, locale, labels, sizes, name }: {
  photos: Photo[];
  name: string;
  locale: Locale;
  labels: { prev: string; next: string };
  sizes: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const go = (d: number) => {
    const el = ref.current;
    if (!el) return;
    const n = Math.max(0, Math.min(photos.length - 1, idx + d));
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="group relative h-full w-full overflow-hidden" dir="ltr">
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label={name}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        }}
        onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((p, n) => (
          <div key={p.id} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
            <Picture photo={p} alt={p.alt[locale] || p.alt.fr} sizes={sizes} fill className="zoom-img" priority={false} />
            <span className="sr-only">{n + 1} / {photos.length}</span>
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={labels.prev} disabled={idx === 0}
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ivory-50/90 text-forest-900 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100 disabled:!opacity-0">
            <Icon name="arrowLeft" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label={labels.next} disabled={idx === photos.length - 1}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ivory-50/90 text-forest-900 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100 disabled:!opacity-0">
            <Icon name="arrow" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2" aria-hidden="true">
            {photos.map((p, n) => (
              <span key={p.id} className={"h-1 rounded-full bg-ivory-50 transition-all duration-500 " + (n === idx ? "w-6 opacity-100" : "w-2 opacity-60")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
