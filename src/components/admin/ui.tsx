import type { ReactNode } from "react";

export function PageHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ivory-200 pb-6">
      <div>
        <h1 className="font-display text-4xl text-forest-900">{title}</h1>
        {text && <p className="mt-2 max-w-3xl text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={"rounded-sm border border-ivory-200 bg-white p-5 shadow-[0_20px_40px_-35px_rgba(13,42,31,.35)] md:p-7 " + className}>
      {title && <h2 className="mb-5 font-display text-2xl text-forest-900">{title}</h2>}
      {children}
    </section>
  );
}

/** Success / error banner driven by ?ok= / ?error= in the URL after a server action. */
export function Flash({ ok, error }: { ok?: string | string[]; error?: string | string[] }) {
  const o = Array.isArray(ok) ? ok[0] : ok;
  const e = Array.isArray(error) ? error[0] : error;
  if (!o && !e) return null;
  return (
    <div
      role={e ? "alert" : "status"}
      className={
        "mb-6 border-s-4 px-4 py-3 text-sm " +
        (e ? "border-[#b4412f] bg-[#b4412f]/8 text-[#7d2a1e]" : "border-forest-600 bg-forest-600/8 text-forest-800")
      }
    >
      {e ?? o}
    </div>
  );
}

type InputProps = {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
  required?: boolean;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
};

export function Field({ label, name, defaultValue, type = "text", hint, textarea, rows = 3, dir, ...rest }: InputProps) {
  const id = `f-${name}`;
  const common = {
    id,
    name,
    defaultValue: defaultValue ?? "",
    dir,
    "aria-describedby": hint ? `${id}-hint` : undefined,
    className: "input !min-h-[2.75rem] !py-2.5 text-[0.95rem]",
    ...rest,
  };
  return (
    <div className="field">
      <label htmlFor={id} className="field-label !text-[0.7rem]">
        {label}
        {rest.required && " *"}
      </label>
      {textarea ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
    </div>
  );
}

/** French + Arabic versions of the same text, side by side. */
export function Bilingual({ label, name, value, textarea, rows, required, hint, maxLength }: {
  label: string;
  name: string;
  value: { fr: string; ar: string };
  textarea?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label={`${label} · Français`} name={`${name}_fr`} defaultValue={value.fr} textarea={textarea} rows={rows} required={required} hint={hint} maxLength={maxLength} />
      <Field label={`${label} · العربية`} name={`${name}_ar`} defaultValue={value.ar} textarea={textarea} rows={rows} dir="rtl" maxLength={maxLength} />
    </div>
  );
}

export function Check({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 shrink-0 accent-forest-800" />
      <span>
        <span className="font-medium text-forest-900">{label}</span>
        {hint && <span className="block text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Badge({ tone, children }: { tone: "green" | "gold" | "grey" | "red" | "blue"; children: ReactNode }) {
  const c = {
    green: "bg-forest-600/12 text-forest-700",
    gold: "bg-gold-500/15 text-gold-700",
    grey: "bg-ink/8 text-muted",
    red: "bg-[#b4412f]/12 text-[#8a2f21]",
    blue: "bg-[#2d5db8]/12 text-[#244a92]",
  }[tone];
  return <span className={"inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium " + c}>{children}</span>;
}

export const BOOKING_LABELS: Record<string, [string, "gold" | "blue" | "green" | "red" | "grey"]> = {
  new: ["Nouvelle", "gold"],
  contacted: ["Client contacté", "blue"],
  confirmed: ["Confirmée par l’hôtel", "green"],
  declined: ["Refusée / complet", "red"],
  cancelled: ["Annulée", "grey"],
};
