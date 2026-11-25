"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { tr } from "@/lib/i18n";
import { db } from "@/lib/server/db";
import { clientIp, hit } from "@/lib/server/rate-limit";
import { getSettings, insertBooking, listRooms } from "@/lib/server/repo";
import { isLocale } from "@/lib/types";
import { bookingSchema, fieldErrors } from "@/lib/validation";
import { bookingMessage, waLink } from "@/lib/whatsapp";

export type BookingState =
  | { status: "error"; errors: Record<string, string> }
  | { status: "success"; ref: string; waUrl: string | null };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion on the phone

function newRef() {
  for (;;) {
    const bytes = crypto.randomBytes(6);
    const ref = "ES-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    if (!db.prepare("SELECT 1 FROM booking_requests WHERE ref = ?").get(ref)) return ref;
  }
}

export async function submitBooking(formData: FormData): Promise<BookingState> {
  const locale = String(formData.get("locale"));
  if (!isLocale(locale)) return { status: "error", errors: { form: "server" } };

  // Honeypot: real visitors never see or fill this field.
  if (String(formData.get("website") ?? "")) return { status: "error", errors: { form: "generic" } };

  const parsed = bookingSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    phone: formData.get("phone") ?? "",
    arrival: formData.get("arrival") ?? "",
    departure: formData.get("departure") ?? "",
    room: formData.get("room") ?? "",
    guests: formData.get("guests") ?? "",
    message: formData.get("message") ?? "",
    consent: formData.get("consent") ?? "",
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };

  if (!hit("booking", await clientIp(), 5, 600)) return { status: "error", errors: { form: "rate" } };

  const v = parsed.data;
  const room = v.room ? listRooms({ publishedOnly: true }).find((r) => r.slug === v.room) : null;
  if (v.room && !room) return { status: "error", errors: { room: "room" } };

  const roomLabel = room ? tr(room.name, locale) : locale === "ar" ? "بدون تفضيل" : "Pas de préférence";
  const ref = newRef();
  try {
    insertBooking({
      ref,
      fullName: v.fullName,
      phone: v.phone,
      arrival: v.arrival,
      departure: v.departure,
      roomId: room?.id ?? null,
      roomLabel: room ? room.name.fr : "Pas de préférence",
      guests: v.guests,
      message: v.message,
      locale,
    });
  } catch (e) {
    console.error("booking insert failed", e);
    return { status: "error", errors: { form: "server" } };
  }
  revalidatePath("/admin", "layout");

  const s = getSettings();
  const text = bookingMessage({ ref, ...v, roomLabel }, locale);
  return { status: "success", ref, waUrl: waLink(s.whatsapp, text) };
}
