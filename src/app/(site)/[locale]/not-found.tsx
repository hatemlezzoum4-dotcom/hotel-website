import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/types";

export default async function NotFound() {
  const h = await headers();
  const seg = (h.get("x-pathname") || "").split("/")[1] || "";
  const locale = isLocale(seg) ? seg : "fr";
  const t = getDictionary(locale);
  return (
    <section className="pattern-lux on-dark flex min-h-[80vh] items-center pt-24 text-ivory-50">
      <div className="container-lux text-center">
        <p className="font-display text-8xl text-gold-400">404</p>
        <h1 className="heading-lg mt-4">{t.notFound.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-ivory-100/75">{t.notFound.text}</p>
        <Link href={`/${locale}`} className="btn btn-gold mt-10">
          {t.notFound.back}
        </Link>
      </div>
    </section>
  );
}
