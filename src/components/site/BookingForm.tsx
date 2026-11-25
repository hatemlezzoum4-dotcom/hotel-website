"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { submitBooking, type BookingState } from "@/app/(site)/[locale]/booking/actions";
import { nightsBetween } from "@/lib/format";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type RoomOption = { slug: string; label: string };

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function BookingForm({
  locale,
  rooms,
  initialRoom,
  today,
  phone,
}: {
  locale: Locale;
  rooms: RoomOption[];
  initialRoom: string;
  today: string;
  phone?: string;
}) {
  const t = getDictionary(locale);
  const [state, setState] = useState<BookingState | null>(null);
  const [pending, start] = useTransition();
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const tb = t.booking;
  const errs = state?.status === "error" ? state.errors : {};
  const errText = (k: string) => {
    const key = errs[k] as keyof Dictionary["form"]["errors"] | undefined;
    return key ? t.form.errors[key] ?? t.form.errors.generic : null;
  };
  const nights = arrival && departure ? nightsBetween(arrival, departure) : 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      let res: BookingState;
      try {
        res = await submitBooking(fd);
      } catch {
        res = { status: "error", errors: { form: "server" } };
      }
      setState(res);
      if (res.status === "success") {
        // Still within the click's user-activation window in modern browsers; the button below is the fallback.
        if (res.waUrl) window.open(res.waUrl, "_blank", "noopener,noreferrer");
        requestAnimationFrame(() => resultRef.current?.focus());
      } else {
        requestAnimationFrame(() => {
          const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
          (first ?? resultRef.current)?.focus();
        });
      }
    });
  }

  if (state?.status === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} className="card-lux p-8 text-center outline-none md:p-14" role="status">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold-500 text-3xl text-gold-600">
          <Icon name="check" />
        </span>
        <h2 className="heading-md mt-6 text-forest-900">{tb.successTitle}</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted">{tb.successText(state.ref)}</p>
        <p className="ltr mt-6 font-display text-3xl tracking-wider text-gold-700">{state.ref}</p>
        {state.waUrl ? (
          <a href={state.waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-wa mt-8">
            <Icon name="whatsapp" className="text-lg" />
            {tb.openWhatsapp}
          </a>
        ) : (
          <p className="mx-auto mt-8 max-w-md text-sm text-muted">{tb.whatsappMissing}</p>
        )}
        <p className="mx-auto mt-6 max-w-md text-xs text-muted">{tb.notice}</p>
        <button
          type="button"
          className="link-lux mt-8"
          onClick={() => {
            setState(null);
            setArrival("");
            setDeparture("");
          }}
        >
          {tb.another}
        </button>
      </div>
    );
  }

  const field = (name: string) => ({
    name,
    id: `bk-${name}`,
    "aria-invalid": errs[name] ? (true as const) : undefined,
    "aria-describedby": errs[name] ? `bk-${name}-err` : undefined,
  });
  const Err = ({ name }: { name: string }) =>
    errText(name) ? (
      <p id={`bk-${name}-err`} className="field-error">
        {errText(name)}
      </p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="card-lux grid gap-6 p-6 sm:p-10" aria-busy={pending}>
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot for bots — hidden from people and assistive technology. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {errs.form && (
        <div ref={resultRef} tabIndex={-1} role="alert" className="border border-[#b4412f]/40 bg-[#b4412f]/5 p-4 text-sm text-[#8a2f21] outline-none">
          {errText("form")}
          {errs.form === "server" && phone && (
            <> · <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="ltr underline">{phone}</a></>
          )}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="bk-fullName" className="field-label">{tb.fullName} *</label>
          <input {...field("fullName")} className="input" autoComplete="name" required maxLength={80} />
          <Err name="fullName" />
        </div>
        <div className="field">
          <label htmlFor="bk-phone" className="field-label">{tb.phone} *</label>
          <input {...field("phone")} className="input ltr text-start" type="tel" inputMode="tel" autoComplete="tel" required maxLength={22}
            aria-describedby={errs.phone ? "bk-phone-err" : "bk-phone-hint"} />
          {errText("phone") ? <Err name="phone" /> : <p id="bk-phone-hint" className="field-hint">{tb.phoneHint}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="bk-arrival" className="field-label">{tb.arrival} *</label>
          <input
            {...field("arrival")}
            className="input"
            type="date"
            required
            min={today}
            value={arrival}
            onChange={(e) => {
              setArrival(e.target.value);
              if (e.target.value && (!departure || departure <= e.target.value)) setDeparture(addDays(e.target.value, 1));
            }}
          />
          <Err name="arrival" />
        </div>
        <div className="field">
          <label htmlFor="bk-departure" className="field-label">{tb.departure} *</label>
          <input
            {...field("departure")}
            className="input"
            type="date"
            required
            min={arrival ? addDays(arrival, 1) : addDays(today, 1)}
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
          <Err name="departure" />
        </div>
      </div>
      {nights > 0 && (
        <p className="-mt-2 flex items-center gap-2 text-sm text-forest-700" aria-live="polite">
          <Icon name="calendar" className="text-gold-600" />
          {tb.nights(nights)}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="bk-room" className="field-label">{tb.roomType}</label>
          <select {...field("room")} className="input" defaultValue={rooms.some((r) => r.slug === initialRoom) ? initialRoom : ""}>
            <option value="">{tb.anyRoom}</option>
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>{r.label}</option>
            ))}
          </select>
          <Err name="room" />
        </div>
        <div className="field">
          <label htmlFor="bk-guests" className="field-label">{tb.guests} *</label>
          <input {...field("guests")} className="input" type="number" inputMode="numeric" min={1} max={20} defaultValue={1} required />
          <Err name="guests" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="bk-message" className="field-label">{tb.message}</label>
        <textarea {...field("message")} className="input" maxLength={1000} placeholder={tb.messageHint} rows={4} />
        <Err name="message" />
      </div>

      <div className="field">
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={errs.consent ? true : undefined}
            aria-describedby={errs.consent ? "bk-consent-err" : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-forest-800"
          />
          <span>
            {tb.consent}{" "}
            <Link href={`/${locale}/privacy`} className="underline decoration-gold-500 underline-offset-4 hover:text-forest-900">{tb.privacyLink}</Link>
          </span>
        </label>
        <Err name="consent" />
      </div>

      <div className="flex flex-col items-start gap-4 border-t border-ivory-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-xs text-muted">{tb.notice}</p>
        <button type="submit" className="btn btn-wa w-full sm:w-auto" disabled={pending}>
          <Icon name="whatsapp" className="text-lg" />
          {pending ? tb.sending : tb.submit}
        </button>
      </div>
    </form>
  );
}
