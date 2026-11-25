import Gallery from "@/components/site/Gallery";
import PageHero from "@/components/site/PageHero";
import { getDictionary } from "@/lib/i18n";
import { listPhotos } from "@/lib/server/repo";
import { pageMeta } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return pageMeta(locale, "/gallery", t.gallery.title, t.gallery.intro, listPhotos({ category: "hotel" })[0]);
}

export default async function GalleryPage({ params }: PageProps<"/[locale]/gallery">) {
  const locale = (await params).locale as Locale;
  const t = getDictionary(locale);
  const photos = listPhotos({ gallery: true });
  const hero = photos.find((p) => p.category === "hotel" && p.width > p.height) ?? photos[0];
  return (
    <>
      <PageHero photo={hero} locale={locale} eyebrow={t.home.galleryEyebrow} title={t.gallery.title} intro={t.gallery.intro} />
      <section className="py-20 md:py-28">
        <div className="container-lux">
          <Gallery
            photos={photos}
            locale={locale}
            labels={{ all: t.gallery.all, filters: t.gallery.filters, cats: t.gallery.cats, empty: t.gallery.empty, open: t.gallery.open, close: t.a11y.close, prev: t.a11y.prev, next: t.a11y.next }}
          />
        </div>
      </section>
    </>
  );
}
