import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/i18n";

/** Visible marker for information that the hotel has not confirmed yet. */
export default function Placeholder({ locale, label, long }: { locale: Locale; label?: string; long?: boolean }) {
  const t = getDictionary(locale).placeholder;
  return (
    <span className="tbc" title={t.tbcLong}>
      <span aria-hidden="true">◇</span>
      {label ?? (long ? t.tbcLong : t.tbc)}
    </span>
  );
}
