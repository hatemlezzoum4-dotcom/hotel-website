"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import type { Locale, Photo, PhotoCategory } from "@/lib/types";

type Labels = {
  all: string;
  filters: string;
  cats: Record<PhotoCategory, string>;
  empty: string;
  open: string;
  close: string;
  prev: string;
  next: string;
};

export default function Gallery({ photos, locale, labels }: { photos: Photo[]; locale: Locale; labels: Labels }) {
  const cats = (Object.keys(labels.cats) as PhotoCategory[]).filter((c) => photos.some((p) => p.category === c));
  const [filter, setFilter] = useState<PhotoCategory | "all">("all");
  const [current, setCurrent] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);

  const shown = filter === "all" ? photos : photos.filter((p) => p.category === filter);

  const open = (i: number, el: HTMLElement) => {
    opener.current = el;
    setCurrent(i);
  };
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback((d: number) => setCurrent((c) => (c == null ? c : (c + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    const dlg = dialog.current;
    if (current != null && dlg && !dlg.open) dlg.showModal();
  }, [current]);

  useEffect(() => {
    const dlg = dialog.current;
    if (!dlg) return;
    const onClose = () => {
      setCurrent(null);
      opener.current?.focus();
    };
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, []);

  const rtl = locale === "ar";
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(rtl ? -1 : 1);
    if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
  };

  const photo = current != null ? shown[current] : null;

  return (
    <>
      <div role="group" aria-label={labels.filters} className="flex flex-wrap justify-center gap-2 md:gap-3">
        {(["all", ...cats] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
            className={
              "border px-5 py-2.5 text-[0.78rem] uppercase tracking-[0.16em] transition-all duration-500 rtl:text-[0.95rem] rtl:tracking-normal " +
              (filter === c ? "border-forest-900 bg-forest-900 text-ivory-50" : "border-ivory-300 text-forest-800 hover:border-gold-500 hover:text-gold-700")
            }
          >
            {c === "all" ? labels.all : labels.cats[c]}
            <span className="ms-2 opacity-60">{c === "all" ? photos.length : photos.filter((p) => p.category === c).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-16 text-center text-muted">{labels.empty}</p>
      ) : (
        <ul key={filter} className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
          {shown.map((p, i) => (
            <li key={p.id} className="break-inside-avoid motion-safe:animate-[fadeUp_.8s_cubic-bezier(.22,.61,.36,1)_both]" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
              <button
                type="button"
                onClick={(e) => open(i, e.currentTarget)}
                className="group relative block w-full overflow-hidden"
                aria-label={`${labels.open} : ${p.alt[locale] || p.alt.fr}`}
              >
                <Picture photo={p} alt={p.alt[locale] || p.alt.fr} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="zoom-img h-auto w-full" />
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-forest-950/80 via-transparent to-transparent p-5 text-start opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="flex w-full items-end justify-between gap-3 text-ivory-50">
                    <span className="text-sm">{p.alt[locale] || p.alt.fr}</span>
                    <Icon name="expand" className="shrink-0 text-xl text-gold-300" />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        onKeyDown={onKey}
        onClick={(e) => e.target === e.currentTarget && close()}
        aria-label={photo ? photo.alt[locale] || photo.alt.fr : labels.open}
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-forest-950/97 p-0 text-ivory-50 backdrop:bg-forest-950/90"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) step((dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
          touchX.current = null;
        }}
      >
        {photo && (
          <div className="flex h-full flex-col" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="flex items-center justify-between px-5 py-4 md:px-8">
              <p className="ltr text-sm tracking-[0.2em] text-gold-300">
                {current! + 1} / {shown.length}
              </p>
              <button type="button" onClick={close} autoFocus className="grid h-12 w-12 place-items-center text-2xl transition-colors hover:text-gold-300" aria-label={labels.close}>
                <Icon name="close" />
              </button>
            </div>
            <figure className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-24" onClick={(e) => e.target === e.currentTarget && close()}>
              <Picture key={photo.id} photo={photo} alt={photo.alt[locale] || photo.alt.fr} sizes="100vw" priority className="max-h-full w-auto max-w-full object-contain motion-safe:animate-[fadeIn_.6s_ease_both]" />
            </figure>
            <p className="px-6 py-5 text-center text-ivory-100/80">{photo.alt[locale] || photo.alt.fr}</p>
            {shown.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label={labels.prev} className="absolute top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-ivory-50/25 bg-forest-950/40 text-xl transition hover:border-gold-400 hover:text-gold-300 ltr:left-3 rtl:right-3 md:ltr:left-8 md:rtl:right-8">
                  <Icon name={rtl ? "arrow" : "arrowLeft"} />
                </button>
                <button type="button" onClick={() => step(1)} aria-label={labels.next} className="absolute top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-ivory-50/25 bg-forest-950/40 text-xl transition hover:border-gold-400 hover:text-gold-300 ltr:right-3 rtl:left-3 md:ltr:right-8 md:rtl:left-8">
                  <Icon name={rtl ? "arrowLeft" : "arrow"} />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
