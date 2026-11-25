import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "@/lib/site";
import { LOCALES } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path === "/rooms" || path === "/booking" ? 0.9 : 0.7,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
    })),
  );
}
