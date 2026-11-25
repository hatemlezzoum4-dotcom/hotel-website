import type { Locale } from "./types";

/** "4500" → "4 500 DZD" / "4,500 دج" (Western digits are standard for prices in Algeria). */
export function formatDzd(amount: number, locale: Locale) {
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", { maximumFractionDigits: 0, numberingSystem: "latn" }).format(amount);
  return locale === "ar" ? `${n} دج` : `${n} DZD`;
}

/** "2026-12-03" → "03/12/2026" */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function nightsBetween(arrival: string, departure: string) {
  return Math.round((Date.parse(departure + "T00:00:00Z") - Date.parse(arrival + "T00:00:00Z")) / 86_400_000);
}

/** Today's date in Algeria (UTC+1, no DST), as YYYY-MM-DD. */
export function todayInAlgiers() {
  return new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
}

export const telHref = (phone: string) => "tel:" + phone.replace(/[^\d+]/g, "");
