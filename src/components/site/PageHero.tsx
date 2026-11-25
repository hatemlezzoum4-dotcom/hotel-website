import Picture from "@/components/ui/Picture";
import type { Locale, Photo } from "@/lib/types";

/** Banner at the top of inner pages: photo, dark gradient, eyebrow, title and intro. */
export default function PageHero({
  photo,
  locale,
  eyebrow,
  title,
  intro,
  children,
}: {
  photo?: Photo | null;
  locale: Locale;
  eyebrow: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="on-dark relative flex min-h-[62vh] items-end overflow-hidden bg-forest-950 pb-16 pt-40 text-ivory-50 md:min-h-[68vh] md:pb-24">
      {photo && <Picture photo={photo} alt="" sizes="100vw" fill priority className="kenburns opacity-70" />}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/55 to-forest-950/30" />
      <div className="grain" />
      <div className="container-lux relative">
        <p className="eyebrow hero-line">{eyebrow}</p>
        <h1 className="heading-xl hero-line mt-5 max-w-4xl" style={{ ["--d" as string]: "120ms" }}>
          {title}
        </h1>
        {intro && (
          <p className="hero-line mt-6 max-w-2xl text-lg text-ivory-100/80" style={{ ["--d" as string]: "240ms" }}>
            {intro}
          </p>
        )}
        {children && <div className="hero-line mt-8" style={{ ["--d" as string]: "360ms" }}>{children}</div>}
      </div>
    </section>
  );
}
