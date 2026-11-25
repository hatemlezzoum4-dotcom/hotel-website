import "server-only";
import { db } from "./db";
import type {
  BookingRequest,
  BookingStatus,
  ContactMessage,
  Facility,
  HotelSettings,
  L10n,
  Locale,
  Photo,
  PhotoCategory,
  RestaurantInfo,
  Room,
  SalonInfo,
} from "@/lib/types";

const empty: L10n = { fr: "", ar: "" };
const bool = (v: unknown) => v === 1 || v === true;
const json = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

/* ───────────────────────── Settings (key → JSON) ───────────────────────── */

export const DEFAULT_SETTINGS: HotelSettings = {
  hotelName: { fr: "Hôtel El Sahel", ar: "فندق الساحل" },
  tagline: empty,
  intro: empty,
  address: empty,
  phones: [],
  email: "",
  whatsapp: "",
  mapsUrl: "",
  mapLat: null,
  mapLng: null,
  checkIn: "",
  checkOut: "",
  heroPhotoIds: [],
  aboutPhotoId: null,
  contactConfirmed: false,
  whatsappConfirmed: false,
};

export const DEFAULT_RESTAURANT: RestaurantInfo = {
  description: empty,
  hours: empty,
  breakfastHours: empty,
  menu: [],
  confirmed: false,
};

export const DEFAULT_SALON: SalonInfo = {
  description: empty,
  services: [],
  capacity: empty,
  confirmed: false,
};

function getKey<T extends object>(key: string, defaults: T): T {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row ? { ...defaults, ...json<Partial<T>>(row.value, {}) } : defaults;
}
function setKey(key: string, value: unknown) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(key, JSON.stringify(value));
}

export const getSettings = () => getKey("hotel", DEFAULT_SETTINGS);
export const saveSettings = (s: HotelSettings) => setKey("hotel", s);
export const getRestaurant = () => getKey("restaurant", DEFAULT_RESTAURANT);
export const saveRestaurant = (r: RestaurantInfo) => setKey("restaurant", r);
export const getSalon = () => getKey("salon", DEFAULT_SALON);
export const saveSalon = (s: SalonInfo) => setKey("salon", s);

/* ───────────────────────────────── Photos ──────────────────────────────── */

type PhotoRow = {
  id: number; file_key: string; width: number; height: number; blur: string; category: PhotoCategory;
  alt_fr: string; alt_ar: string; room_id: number | null; in_gallery: number; sort: number;
};
const toPhoto = (r: PhotoRow): Photo => ({
  id: r.id, fileKey: r.file_key, width: r.width, height: r.height, blur: r.blur, category: r.category,
  alt: { fr: r.alt_fr, ar: r.alt_ar }, roomId: r.room_id, inGallery: bool(r.in_gallery), sort: r.sort,
});

export function listPhotos(filter: { category?: PhotoCategory; gallery?: boolean; roomId?: number } = {}): Photo[] {
  const where: string[] = [];
  const args: unknown[] = [];
  if (filter.category) { where.push("category = ?"); args.push(filter.category); }
  if (filter.gallery) where.push("in_gallery = 1");
  if (filter.roomId !== undefined) { where.push("room_id = ?"); args.push(filter.roomId); }
  const sql = `SELECT * FROM photos ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY sort, id`;
  return (db.prepare(sql).all(...args) as PhotoRow[]).map(toPhoto);
}
export function getPhoto(id: number): Photo | null {
  const r = db.prepare("SELECT * FROM photos WHERE id = ?").get(id) as PhotoRow | undefined;
  return r ? toPhoto(r) : null;
}
export function getPhotos(ids: number[]): Photo[] {
  return ids.map(getPhoto).filter((p): p is Photo => !!p);
}
export function insertPhoto(p: Omit<Photo, "id">): number {
  const res = db.prepare(
    `INSERT INTO photos (file_key, width, height, blur, category, alt_fr, alt_ar, room_id, in_gallery, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(p.fileKey, p.width, p.height, p.blur, p.category, p.alt.fr, p.alt.ar, p.roomId, p.inGallery ? 1 : 0, p.sort);
  return Number(res.lastInsertRowid);
}
export function updatePhoto(id: number, p: Pick<Photo, "category" | "alt" | "roomId" | "inGallery" | "sort">) {
  db.prepare(
    "UPDATE photos SET category = ?, alt_fr = ?, alt_ar = ?, room_id = ?, in_gallery = ?, sort = ? WHERE id = ?",
  ).run(p.category, p.alt.fr, p.alt.ar, p.roomId, p.inGallery ? 1 : 0, p.sort, id);
}
export function deletePhotoRow(id: number) {
  db.prepare("DELETE FROM photos WHERE id = ?").run(id);
}

/* ───────────────────────────────── Rooms ───────────────────────────────── */

type RoomRow = {
  id: number; slug: string; name_fr: string; name_ar: string; category_fr: string; category_ar: string;
  description_fr: string; description_ar: string; capacity: number | null; amenities_fr: string; amenities_ar: string;
  price_dzd: number | null; price_note_fr: string; price_note_ar: string; price_confirmed: number;
  details_confirmed: number; published: number; sort: number;
};
const toRoom = (r: RoomRow): Room => ({
  id: r.id, slug: r.slug,
  name: { fr: r.name_fr, ar: r.name_ar },
  category: { fr: r.category_fr, ar: r.category_ar },
  description: { fr: r.description_fr, ar: r.description_ar },
  capacity: r.capacity,
  amenities: { fr: json<string[]>(r.amenities_fr, []), ar: json<string[]>(r.amenities_ar, []) },
  priceDzd: r.price_dzd,
  priceNote: { fr: r.price_note_fr, ar: r.price_note_ar },
  priceConfirmed: bool(r.price_confirmed),
  detailsConfirmed: bool(r.details_confirmed),
  published: bool(r.published),
  sort: r.sort,
  photos: listPhotos({ roomId: r.id }),
});

export function listRooms(opts: { publishedOnly?: boolean } = {}): Room[] {
  const sql = `SELECT * FROM rooms ${opts.publishedOnly ? "WHERE published = 1" : ""} ORDER BY sort, id`;
  return (db.prepare(sql).all() as RoomRow[]).map(toRoom);
}
export function getRoom(id: number): Room | null {
  const r = db.prepare("SELECT * FROM rooms WHERE id = ?").get(id) as RoomRow | undefined;
  return r ? toRoom(r) : null;
}

export type RoomInput = Omit<Room, "id" | "photos">;
const roomArgs = (r: RoomInput) => [
  r.slug, r.name.fr, r.name.ar, r.category.fr, r.category.ar, r.description.fr, r.description.ar, r.capacity,
  JSON.stringify(r.amenities.fr), JSON.stringify(r.amenities.ar), r.priceDzd, r.priceNote.fr, r.priceNote.ar,
  r.priceConfirmed ? 1 : 0, r.detailsConfirmed ? 1 : 0, r.published ? 1 : 0, r.sort,
];
export function insertRoom(r: RoomInput): number {
  const res = db.prepare(
    `INSERT INTO rooms (slug, name_fr, name_ar, category_fr, category_ar, description_fr, description_ar, capacity,
      amenities_fr, amenities_ar, price_dzd, price_note_fr, price_note_ar, price_confirmed, details_confirmed, published, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(...roomArgs(r));
  return Number(res.lastInsertRowid);
}
export function updateRoom(id: number, r: RoomInput) {
  db.prepare(
    `UPDATE rooms SET slug = ?, name_fr = ?, name_ar = ?, category_fr = ?, category_ar = ?, description_fr = ?,
      description_ar = ?, capacity = ?, amenities_fr = ?, amenities_ar = ?, price_dzd = ?, price_note_fr = ?,
      price_note_ar = ?, price_confirmed = ?, details_confirmed = ?, published = ?, sort = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(...roomArgs(r), id);
}
export function deleteRoom(id: number) {
  db.prepare("DELETE FROM rooms WHERE id = ?").run(id);
}
export function slugTaken(slug: string, exceptId?: number) {
  return !!db.prepare("SELECT 1 FROM rooms WHERE slug = ? AND id != ?").get(slug, exceptId ?? -1);
}

/* ─────────────────────────────── Facilities ────────────────────────────── */

type FacilityRow = {
  id: number; icon: string; name_fr: string; name_ar: string; description_fr: string; description_ar: string;
  confirmed: number; published: number; sort: number;
};
const toFacility = (r: FacilityRow): Facility => ({
  id: r.id, icon: r.icon, name: { fr: r.name_fr, ar: r.name_ar },
  description: { fr: r.description_fr, ar: r.description_ar },
  confirmed: bool(r.confirmed), published: bool(r.published), sort: r.sort,
});
export function listFacilities(opts: { publishedOnly?: boolean } = {}): Facility[] {
  const sql = `SELECT * FROM facilities ${opts.publishedOnly ? "WHERE published = 1" : ""} ORDER BY sort, id`;
  return (db.prepare(sql).all() as FacilityRow[]).map(toFacility);
}
export type FacilityInput = Omit<Facility, "id">;
const facArgs = (f: FacilityInput) => [
  f.icon, f.name.fr, f.name.ar, f.description.fr, f.description.ar, f.confirmed ? 1 : 0, f.published ? 1 : 0, f.sort,
];
export function insertFacility(f: FacilityInput) {
  db.prepare(
    `INSERT INTO facilities (icon, name_fr, name_ar, description_fr, description_ar, confirmed, published, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(...facArgs(f));
}
export function updateFacility(id: number, f: FacilityInput) {
  db.prepare(
    `UPDATE facilities SET icon = ?, name_fr = ?, name_ar = ?, description_fr = ?, description_ar = ?, confirmed = ?,
      published = ?, sort = ? WHERE id = ?`,
  ).run(...facArgs(f), id);
}
export function deleteFacility(id: number) {
  db.prepare("DELETE FROM facilities WHERE id = ?").run(id);
}

/* ──────────────────────────── Booking requests ─────────────────────────── */

type BookingRow = {
  id: number; ref: string; full_name: string; phone: string; arrival: string; departure: string;
  room_id: number | null; room_label: string; guests: number; message: string; locale: Locale;
  status: BookingStatus; staff_note: string; created_at: string; updated_at: string;
};
const toBooking = (r: BookingRow): BookingRequest => ({
  id: r.id, ref: r.ref, fullName: r.full_name, phone: r.phone, arrival: r.arrival, departure: r.departure,
  roomId: r.room_id, roomLabel: r.room_label, guests: r.guests, message: r.message, locale: r.locale,
  status: r.status, staffNote: r.staff_note, createdAt: r.created_at, updatedAt: r.updated_at,
});

export function insertBooking(b: Omit<BookingRequest, "id" | "status" | "staffNote" | "createdAt" | "updatedAt">) {
  db.prepare(
    `INSERT INTO booking_requests (ref, full_name, phone, arrival, departure, room_id, room_label, guests, message, locale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(b.ref, b.fullName, b.phone, b.arrival, b.departure, b.roomId, b.roomLabel, b.guests, b.message, b.locale);
}
export function listBookings(status?: BookingStatus): BookingRequest[] {
  const rows = status
    ? db.prepare("SELECT * FROM booking_requests WHERE status = ? ORDER BY created_at DESC, id DESC").all(status)
    : db.prepare("SELECT * FROM booking_requests ORDER BY created_at DESC, id DESC").all();
  return (rows as BookingRow[]).map(toBooking);
}
export function getBooking(id: number): BookingRequest | null {
  const r = db.prepare("SELECT * FROM booking_requests WHERE id = ?").get(id) as BookingRow | undefined;
  return r ? toBooking(r) : null;
}
export function updateBooking(id: number, status: BookingStatus, staffNote: string) {
  db.prepare(
    "UPDATE booking_requests SET status = ?, staff_note = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(status, staffNote, id);
}
export function deleteBooking(id: number) {
  db.prepare("DELETE FROM booking_requests WHERE id = ?").run(id);
}
export function countBookingsByStatus(): Record<BookingStatus, number> {
  const out = { new: 0, contacted: 0, confirmed: 0, declined: 0, cancelled: 0 };
  for (const r of db.prepare("SELECT status, COUNT(*) AS n FROM booking_requests GROUP BY status").all() as {
    status: BookingStatus; n: number;
  }[]) out[r.status] = r.n;
  return out;
}

/* ──────────────────────────── Contact messages ─────────────────────────── */

type MessageRow = {
  id: number; full_name: string; reply_to: string; subject: string; message: string; locale: Locale;
  status: ContactMessage["status"]; created_at: string;
};
const toMessage = (r: MessageRow): ContactMessage => ({
  id: r.id, fullName: r.full_name, replyTo: r.reply_to, subject: r.subject, message: r.message,
  locale: r.locale, status: r.status, createdAt: r.created_at,
});
export function insertMessage(m: Pick<ContactMessage, "fullName" | "replyTo" | "subject" | "message" | "locale">) {
  db.prepare(
    "INSERT INTO contact_messages (full_name, reply_to, subject, message, locale) VALUES (?, ?, ?, ?, ?)",
  ).run(m.fullName, m.replyTo, m.subject, m.message, m.locale);
}
export function listMessages(): ContactMessage[] {
  return (db.prepare(
    "SELECT * FROM contact_messages ORDER BY CASE status WHEN 'archived' THEN 1 ELSE 0 END, created_at DESC, id DESC",
  ).all() as MessageRow[]).map(toMessage);
}
export function setMessageStatus(id: number, status: ContactMessage["status"]) {
  db.prepare("UPDATE contact_messages SET status = ? WHERE id = ?").run(status, id);
}
export function deleteMessage(id: number) {
  db.prepare("DELETE FROM contact_messages WHERE id = ?").run(id);
}
export const countNewMessages = () =>
  (db.prepare("SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'new'").get() as { n: number }).n;
