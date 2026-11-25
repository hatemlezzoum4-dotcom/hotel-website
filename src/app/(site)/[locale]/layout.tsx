import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../../globals.css";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";
import RevealObserver from "@/components/ui/RevealObserver";
import { dirOf, getDictionary, tr } from "@/lib/i18n";
import { getSettings } from "@/lib/server/repo";
import { SITE_URL } from "@/lib/site";
import { LOCALES, isLocale } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

export const viewport: Viewport = { themeColor: "#0d2a1f", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.defaultTitle, template: `%s · ${t.meta.siteName}` },
    description: t.meta.defaultDescription,
    applicationName: t.meta.siteName,
    openGraph: { siteName: t.meta.siteName, locale: locale === "ar" ? "ar_DZ" : "fr_DZ", type: "website" },
    twitter: { card: "summary_large_image" },
    icons: { icon: "/icon.svg" },
    formatDetection: { telephone: false },
  };
}

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const s = getSettings();
  const name = tr(s.hotelName, locale);
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <head>
        {/* Marks JS as available before paint so reveal animations never hide content without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed top-3 z-[100] -translate-y-24 bg-gold-500 px-4 py-2 text-forest-950 transition-transform focus:translate-y-0 ltr:left-3 rtl:right-3"
        >
          {t.a11y.skip}
        </a>
        <SiteHeader locale={locale} hotelName={name} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter locale={locale} t={t} s={s} />
        <WhatsAppFloat number={s.whatsapp} label={t.contact.writeUs} text={t.home.welcome} />
        <RevealObserver />
      </body>
    </html>
  );
}
