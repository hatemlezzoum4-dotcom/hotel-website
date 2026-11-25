"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Logo from "./Logo";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export default function SiteHeader({ locale, hotelName }: { locale: Locale; hotelName: string }) {
  const t = getDictionary(locale);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const other: Locale = locale === "fr" ? "ar" : "fr";
  const switchHref = pathname.replace(/^\/(fr|ar)(?=\/|$)/, `/${other}`) || `/${other}`;
  const links = [
    { href: `/${locale}/rooms`, label: t.nav.rooms },
    { href: `/${locale}/restaurant`, label: t.nav.restaurant },
    { href: `/${locale}/salon`, label: t.nav.salon },
    { href: `/${locale}/gallery`, label: t.nav.gallery },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ];
  const isActive = (h: string) => pathname === h || pathname.startsWith(h + "/");

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 " +
        // No backdrop-filter while the menu is open: it would become the containing block of the fixed menu.
        (open
          ? "bg-forest-950 py-2"
          : scrolled
            ? "bg-forest-950/92 py-2 shadow-[0_10px_40px_-20px_rgba(0,0,0,.6)] backdrop-blur-md"
            : "bg-gradient-to-b from-forest-950/70 to-transparent py-4")
      }
    >
      <div className="container-lux relative z-10 flex items-center justify-between gap-6 text-ivory-50">
        <Link href={`/${locale}`} className="relative z-10" aria-label={`${hotelName} – ${t.nav.home}`}>
          <Logo name={hotelName} place={t.home.eyebrow.split("·")[0].trim()} />
        </Link>

        <nav aria-label={t.a11y.menu} className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={
                    "relative py-2 text-[0.8rem] uppercase tracking-[0.18em] transition-colors rtl:text-[0.95rem] rtl:tracking-normal " +
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:bg-gold-400 after:transition-transform after:duration-500 " +
                    (isActive(l.href) ? "text-gold-300 after:scale-x-100" : "text-ivory-100/85 hover:text-ivory-50 after:scale-x-0 hover:after:scale-x-100")
                  }
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="relative z-10 flex items-center gap-3 sm:gap-5">
          <Link
            href={switchHref}
            hrefLang={other}
            lang={other}
            className="flex items-center gap-1.5 text-sm text-ivory-100/85 transition-colors hover:text-gold-300"
          >
            <Icon name="globe" className="text-base" />
            <span>{t.nav.switchTo}</span>
          </Link>
          <Link href={`/${locale}/booking`} className="btn btn-gold hidden !min-h-[2.6rem] !px-5 sm:inline-flex">
            {t.nav.book}
          </Link>
          <button
            ref={menuBtn}
            type="button"
            className="grid h-11 w-11 place-items-center text-2xl lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.a11y.close : t.a11y.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="pattern-lux fixed inset-0 z-0 overflow-y-auto pb-10 pt-28 text-ivory-50 lg:hidden"
      >
        <nav aria-label={t.a11y.menu} className="container-lux">
          <ul className="space-y-1">
            {[{ href: `/${locale}`, label: t.nav.home }, ...links, { href: `/${locale}/booking`, label: t.nav.book }].map((l, i) => (
              <li key={l.href} className="hero-line" style={{ ["--d" as string]: `${i * 60}ms` }}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="flex items-center justify-between border-b border-ivory-50/10 py-4 font-display text-3xl aria-[current=page]:text-gold-300"
                >
                  {l.label}
                  <Icon name={locale === "ar" ? "arrowLeft" : "arrow"} className="text-lg text-gold-400" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
