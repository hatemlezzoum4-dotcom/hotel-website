export default function SectionHeading({
  eyebrow,
  title,
  text,
  align = "start",
  dark,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  align?: "start" | "center";
  dark?: boolean;
}) {
  return (
    <div className={(align === "center" ? "mx-auto text-center " : "") + "max-w-2xl " + (dark ? "on-dark" : "")} data-reveal>
      <p className={"eyebrow " + (align === "center" ? "justify-center" : "")}>{eyebrow}</p>
      <h2 className={"heading-lg mt-5 " + (dark ? "text-ivory-50" : "text-forest-900")}>{title}</h2>
      {text && <p className={"mt-5 text-lg " + (dark ? "text-ivory-100/75" : "text-muted")}>{text}</p>}
    </div>
  );
}
