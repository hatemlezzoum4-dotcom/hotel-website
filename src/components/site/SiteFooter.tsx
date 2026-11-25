import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Placeholder from "@/components/ui/Placeholder";
import Logo from "./Logo";
import { tr, type Dictionary } from "@/lib/i18n";
import { telHref } from "@/lib/format";
import type { HotelSettings, Locale } from "@/lib/types";

export default function SiteFooter({ locale, t, s }: { locale: Locale; t: Dictionary; s: HotelSettings }) {
  const year = new Date().getFullYear();
  const address = tr(s.address, locale);
  const nav = [
    [`/${locale}/rooms`, t.nav.rooms],
    [`/${locale}/restaurant`, t.nav.restaurant],
    [`/${locale}/salon`, t.nav.salon],
    [`/${locale}/gallery`, t.nav.gallery],
    [`/${locale}/booking`, t.booking.title],
    [`/${locale}/contact`, t.nav.contact],
  ];
  return (
    <footer className="pattern-lux on-dark relative overflow-hidden text-ivory-100">
      <div className="container-lux grid gap-12 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo name={tr(s.hotelName, locale)} place={t.home.eyebrow.split("·")[0].trim()} />
          <p className="mt-6 max-w-sm text-ivory-100/70">{t.footer.tagline}</p>
          <Link href={`/${locale}/booking`} className="btn btn-gold mt-8">
            {t.home.requestBooking}
          </Link>
        </div>

        <nav aria-label={t.footer.explore} className="md:col-span-3">
          <h2 className="eyebrow mb-6">{t.footer.explore}</h2>
          <ul className="space-y-3">
            {nav.map(([h, l]) => (
              <li key={h}>
                <Link href={h} className="text-ivory-100/80 transition-colors hover:text-gold-300">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="eyebrow mb-6">{t.footer.info}</h2>
          <ul className="space-y-4 text-ivory-100/80">
            <li className="flex gap-3">
              <Icon name="pin" className="mt-1 shrink-0 text-gold-400" />
              <span>{address || <Placeholder locale={locale} />}</span>
            </li>
            <li className="flex gap-3">
              <Icon name="phone" className="mt-1 shrink-0 text-gold-400" />
              <span className="flex flex-col">
                {s.phones.length ? (
                  s.phones.map((p) => (
                    <a key={p} href={telHref(p)} className="ltr w-fit hover:text-gold-300">
                      {p}
                    </a>
                  ))
                ) : (
                  <Placeholder locale={locale} />
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <Icon name="mail" className="mt-1 shrink-0 text-gold-400" />
              {s.email ? (
                <a href={`mailto:${s.email}`} className="ltr break-all hover:text-gold-300">
                  {s.email}
                </a>
              ) : (
                <Placeholder locale={locale} />
              )}
            </li>
          </ul>
          {!s.contactConfirmed && (
            <p className="mt-5">
              <Placeholder locale={locale} />
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-ivory-50/10">
        <div className="container-lux flex flex-col gap-3 py-6 text-sm text-ivory-100/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {tr(s.hotelName, locale)}. {t.footer.rights}
          </p>
          <p className="text-xs">{t.footer.tbcNote}</p>
          <div className="flex gap-6">
            <Link href={`/${locale}/privacy`} className="hover:text-gold-300">
              {t.footer.privacy}
            </Link>
            <Link href="/admin" className="hover:text-gold-300" rel="nofollow">
              {t.footer.staff}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
