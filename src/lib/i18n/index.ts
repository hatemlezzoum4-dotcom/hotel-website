import fr from "./fr";
import ar from "./ar";
import type { L10n, Locale } from "@/lib/types";

const dictionaries = { fr, ar };
export const getDictionary = (locale: Locale) => dictionaries[locale];
export type { Dictionary } from "./fr";

/** Picks the localised text, falling back to French when the Arabic version is not written yet. */
export const tr = (v: L10n, locale: Locale) => (v[locale] || v.fr || "").trim();
export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");
