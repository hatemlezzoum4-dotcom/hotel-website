import ContactForm from "@/components/site/ContactForm";
import MapEmbed from "@/components/site/MapEmbed";
import PageHero from "@/components/site/PageHero";
import Icon from "@/components/ui/Icon";
import Placeholder from "@/components/ui/Placeholder";
import { telHref } from "@/lib/format";
import { getDictionary, tr } from "@/lib/i18n";
import { getSettings, listPhotos } from "@/lib/server/repo";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/contact", t.contact.title, t.contact.intro);
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = (await params).locale as Locale;
  const t = getDictionary(locale);
  const s = getSettings();
  const hero = listPhotos({ category: "hotel" })[1];
  const wa = waLink(s.whatsapp, t.home.welcome);
  const Row = ({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) => (
    <li className="flex gap-5 border-b border-ivory-200 py-6">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold-400 text-xl text-gold-600"><Icon name={icon} /></span>
      <div className="min-w-0">
        <p className="field-label">{label}</p>
        <div className="mt-1.5 text-lg">{children}</div>
      </div>
    </li>
  );

  return (
    <>
      <PageHero photo={hero} locale={locale} eyebrow={t.nav.contact} title={t.contact.title} intro={t.contact.intro} />
      <section className="py-20 md:py-28">
        <div className="container-lux grid items-start gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5" data-reveal>
            <ul>
              <Row icon="pin" label={t.contact.address}>{tr(s.address, locale) || <Placeholder locale={locale} />}</Row>
              <Row icon="phone" label={t.contact.phone}>
                {s.phones.length ? (
                  <span className="flex flex-col">{s.phones.map((p) => <a key={p} href={telHref(p)} className="ltr w-fit hover:text-gold-700">{p}</a>)}</span>
                ) : <Placeholder locale={locale} />}
              </Row>
              <Row icon="mail" label={t.contact.email}>
                {s.email ? <a href={`mailto:${s.email}`} className="ltr break-all hover:text-gold-700">{s.email}</a> : <Placeholder locale={locale} />}
              </Row>
              <Row icon="whatsapp" label={t.contact.whatsapp}>
                {wa ? (
                  <span className="flex flex-col items-start gap-2">
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="link-lux">{t.contact.writeUs}</a>
                    {!s.whatsappConfirmed && <Placeholder locale={locale} />}
                  </span>
                ) : <Placeholder locale={locale} />}
              </Row>
              <Row icon="clock" label={`${t.contact.checkIn} · ${t.contact.checkOut}`}>
                {s.checkIn && s.checkOut ? <span className="ltr">{s.checkIn} · {s.checkOut}</span> : <Placeholder locale={locale} />}
              </Row>
            </ul>
            {!s.contactConfirmed && <p className="mt-6"><Placeholder locale={locale} long /></p>}
          </div>
          <div className="lg:col-span-7" data-reveal style={{ ["--reveal-delay" as string]: "150ms" }}>
            <ContactForm locale={locale} />
          </div>
        </div>
      </section>
      {s.mapLat != null && (
        <section className="relative h-[28rem] bg-ivory-200">
          <MapEmbed s={s} title={t.contact.mapTitle} className="!min-h-full" />
          {s.mapsUrl && (
            <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-forest absolute bottom-6 ltr:left-6 rtl:right-6">
              <Icon name="pin" />{t.contact.map}
            </a>
          )}
        </section>
      )}
    </>
  );
}
