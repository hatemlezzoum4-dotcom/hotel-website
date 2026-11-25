import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["fr", "ar"];
const SESSION_COOKIE = "es_admin_session";

function preferredLocale(req: NextRequest) {
  const accept = req.headers.get("accept-language") || "";
  // Arabic only when it is ranked before French in the browser's preferences.
  const ar = accept.search(/\bar\b|\bar-/i);
  const fr = accept.search(/\bfr\b|\bfr-/i);
  return ar > -1 && (fr === -1 || ar < fr) ? "ar" : "fr";
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin: cheap early redirect when no session cookie exists.
  // The real check (database session lookup) happens in every admin page and server action.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname !== "/admin/login" && !req.cookies.get(SESSION_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) {
    // Lets the localised 404 page know which language to render.
    const headers = new Headers(req.headers);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  // Any other path gets the visitor's language prefix (e.g. "/" → "/fr", "/rooms" → "/ar/rooms").
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, media files, and metadata routes.
  matcher: ["/((?!_next/|media/|favicon\\.ico|icon\\.svg|apple-icon|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest).*)"],
};
