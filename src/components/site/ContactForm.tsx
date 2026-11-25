"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { submitContact, type ContactState } from "@/app/(site)/[locale]/contact/actions";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export default function ContactForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [state, setState] = useState<ContactState | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const errs = state?.status === "error" ? state.errors : {};
  const errText = (k: string) => {
    const key = errs[k] as keyof Dictionary["form"]["errors"] | undefined;
    return key ? t.form.errors[key] ?? t.form.errors.generic : null;
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      let res: ContactState;
      try {
        res = await submitContact(fd);
      } catch {
        res = { status: "error", errors: { form: "server" } };
      }
      setState(res);
      if (res.status === "success") form.reset();
      requestAnimationFrame(() => {
        const first = res.status === "error" && !res.errors.form ? formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') : null;
        (first ?? statusRef.current)?.focus();
      });
    });
  }

  const field = (name: string) => ({
    name,
    id: `ct-${name}`,
    "aria-invalid": errs[name] ? (true as const) : undefined,
    "aria-describedby": errs[name] ? `ct-${name}-err` : undefined,
  });
  const Err = ({ name }: { name: string }) =>
    errText(name) ? <p id={`ct-${name}-err`} className="field-error">{errText(name)}</p> : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="card-lux grid gap-6 p-6 sm:p-10" aria-busy={pending}>
      <h2 className="heading-md text-forest-900">{t.contact.formTitle}</h2>
      <input type="hidden" name="locale" value={locale} />
      <div aria-hidden="true" className="sr-only">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div ref={statusRef} tabIndex={-1} className="outline-none" aria-live="polite">
        {state?.status === "success" && (
          <p role="status" className="flex items-start gap-3 border border-forest-600/30 bg-forest-600/5 p-4 text-forest-800">
            <Icon name="check" className="mt-1 shrink-0 text-gold-600" />{t.contact.sent}
          </p>
        )}
        {errs.form && <p role="alert" className="border border-[#b4412f]/40 bg-[#b4412f]/5 p-4 text-sm text-[#8a2f21]">{errText("form")}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="ct-fullName" className="field-label">{t.contact.name} *</label>
          <input {...field("fullName")} className="input" autoComplete="name" required maxLength={80} />
          <Err name="fullName" />
        </div>
        <div className="field">
          <label htmlFor="ct-replyTo" className="field-label">{t.contact.replyTo} *</label>
          <input {...field("replyTo")} className="input ltr text-start" autoComplete="email" required maxLength={120} />
          <Err name="replyTo" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="ct-subject" className="field-label">{t.contact.subject}</label>
        <input {...field("subject")} className="input" maxLength={120} />
        <Err name="subject" />
      </div>
      <div className="field">
        <label htmlFor="ct-message" className="field-label">{t.contact.message} *</label>
        <textarea {...field("message")} className="input" rows={5} required maxLength={2000} />
        <Err name="message" />
      </div>
      <div className="field">
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="consent" required aria-invalid={errs.consent ? true : undefined}
            aria-describedby={errs.consent ? "ct-consent-err" : undefined} className="mt-1 h-4 w-4 shrink-0 accent-forest-800" />
          <span>
            {t.booking.consent}{" "}
            <Link href={`/${locale}/privacy`} className="underline decoration-gold-500 underline-offset-4">{t.booking.privacyLink}</Link>
          </span>
        </label>
        <Err name="consent" />
      </div>
      <button type="submit" className="btn btn-forest justify-self-start" disabled={pending}>
        {pending ? t.booking.sending : t.contact.send}
      </button>
    </form>
  );
}
