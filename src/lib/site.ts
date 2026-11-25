import type { Locale } from "./types";

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const ROUTES = ["", "/rooms", "/restaurant", "/salon", "/gallery", "/booking", "/contact", "/privacy"] as const;

export const href = (locale: Locale, path: string = "") => `/${locale}${path}`;
