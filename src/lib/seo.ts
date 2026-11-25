import type { Metadata } from "next";
import { getDictionary } from "./i18n";
import { SITE_URL } from "./site";
import { mediaUrl } from "./media";
import type { Locale, Photo } from "./types";

/** Page metadata with canonical URL, hreflang alternates and Open Graph image. */
export function pageMeta(locale: Locale, path: string, title: string | null, description?: string, image?: Photo | null): Metadata {
  const t = getDictionary(locale);
  const url = `/${locale}${path}`;
  return {
    ...(title ? { title } : {}),
    description: description || t.meta.defaultDescription,
    alternates: {
      canonical: url,
      languages: { fr: `/fr${path}`, ar: `/ar${path}`, "x-default": `/fr${path}` },
    },
    openGraph: {
      url,
      title: title ? `${title} · ${t.meta.siteName}` : t.meta.defaultTitle,
      description: description || t.meta.defaultDescription,
      images: image ? [{ url: SITE_URL + mediaUrl(image.fileKey, Math.min(image.width, 1600)), width: Math.min(image.width, 1600) }] : undefined,
    },
  };
}
