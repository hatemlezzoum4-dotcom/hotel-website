"use client";
import { useEffect, useState } from "react";
import Picture from "@/components/ui/Picture";
import type { Locale, Photo } from "@/lib/types";

/** Full-bleed cross-fading photographs with a slow Ken Burns zoom. Pauses for reduced-motion users. */
export default function HeroSlideshow({ photos, locale, interval = 6500 }: { photos: Photo[]; locale: Locale; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (photos.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!document.hidden) setI((v) => (v + 1) % photos.length);
    }, interval);
    return () => clearInterval(id);
  }, [photos.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-forest-950" aria-hidden="true">
      {photos.map((p, n) => (
        <div
          key={p.id}
          className={"absolute inset-0 transition-opacity duration-[1800ms] ease-in-out " + (n === i ? "opacity-100" : "opacity-0")}
        >
          {/* Re-mounting the image restarts the zoom each time the slide becomes active. */}
          {(n === i || n === (i + photos.length - 1) % photos.length) && (
            <Picture
              key={n === i ? `on-${i}` : `off-${p.id}`}
              photo={p}
              alt={p.alt[locale]}
              sizes="100vw"
              fill
              priority={n === 0}
              className={n === i ? "kenburns" : ""}
            />
          )}
        </div>
      ))}
    </div>
  );
}
