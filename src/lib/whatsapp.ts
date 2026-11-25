import { getDictionary } from "./i18n";
import { formatDate, nightsBetween } from "./format";
import type { Locale } from "./types";

export const waNumber = (raw: string) => raw.replace(/\D/g, "");

export function waLink(number: string, text?: string) {
  const n = waNumber(number);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export type BookingMessageInput = {
  ref: string;
  fullName: string;
  phone: string;
  arrival: string;
  departure: string;
  roomLabel: string;
  guests: number;
  message: string;
};

/** Builds the WhatsApp text in the visitor's language, using WhatsApp *bold* / _italic_ markup. */
export function bookingMessage(b: BookingMessageInput, locale: Locale) {
  const t = getDictionary(locale).booking;
  const n = nightsBetween(b.arrival, b.departure);
  const lines = [
    `*${t.wa.header}*`,
    `${t.wa.ref} : ${b.ref}`,
    "",
    `${t.wa.name} : ${b.fullName}`,
    `${t.wa.phone} : ${b.phone}`,
    `${t.wa.arrival} : ${formatDate(b.arrival)}`,
    `${t.wa.departure} : ${formatDate(b.departure)} (${t.nights(n)})`,
    `${t.wa.room} : ${b.roomLabel}`,
    `${t.wa.guests} : ${b.guests}`,
  ];
  if (b.message) lines.push(`${t.wa.message} : ${b.message}`);
  lines.push("", `_${t.wa.footer}_`);
  return lines.join("\n");
}

/** Converts a guest's phone ("0550 12 34 56", "+213 550…") to wa.me format; Algerian local numbers get 213. */
export function guestWaNumber(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 10) d = "213" + d.slice(1);
  return d.length >= 9 ? d : "";
}
