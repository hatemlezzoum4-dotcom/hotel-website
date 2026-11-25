"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { FormError, bool, id, intOrNull, l10n, lines, slugify, str } from "@/lib/server/form";
import { deleteImageFiles, ImageError, processImage, MAX_UPLOAD_BYTES } from "@/lib/server/images";
import * as repo from "@/lib/server/repo";
import { BOOKING_STATUSES, PHOTO_CATEGORIES, type BookingStatus, type PhotoCategory } from "@/lib/types";
import { phoneSchema } from "@/lib/validation";

/** Runs a mutation, then redirects back with a success or error flash message. */
async function run(back: string, ok: string, fn: () => void | string | Promise<void | string>) {
  let target = back;
  try {
    const r = await fn();
    target = typeof r === "string" ? r : back;
    target += (target.includes("?") ? "&" : "?") + "ok=" + encodeURIComponent(ok);
  } catch (e) {
    if (!(e instanceof FormError || e instanceof ImageError)) {
      console.error(e);
      e = new FormError("Une erreur inattendue est survenue. Rien n’a été modifié.");
    }
    target += (target.includes("?") ? "&" : "?") + "error=" + encodeURIComponent((e as Error).message);
  }
  redirect(target);
}

/* ─────────────── Rooms ─────────────── */

function roomFromForm(fd: FormData, roomId?: number): repo.RoomInput {
  const name = l10n(fd, "name", 120);
  if (!name.fr) throw new FormError("Le nom de la chambre (français) est obligatoire.");
  const slug = slugify(str(fd, "slug", 80) || name.fr);
  if (!slug) throw new FormError("Identifiant d’URL invalide.");
  if (repo.slugTaken(slug, roomId)) throw new FormError("Une autre chambre utilise déjà cet identifiant d’URL.");
  return {
    slug,
    name,
    category: l10n(fd, "category", 80),
    description: l10n(fd, "description", 3000),
    capacity: intOrNull(fd, "capacity", 1, 50),
    amenities: { fr: lines(fd, "amenities_fr"), ar: lines(fd, "amenities_ar") },
    priceDzd: intOrNull(fd, "priceDzd", 0, 10_000_000),
    priceNote: l10n(fd, "priceNote", 160),
    priceConfirmed: bool(fd, "priceConfirmed"),
    detailsConfirmed: bool(fd, "detailsConfirmed"),
    published: bool(fd, "published"),
    sort: intOrNull(fd, "sort", 0, 9999) ?? 0,
  };
}

export async function createRoom(fd: FormData) {
  await requireUser();
  await run("/admin/rooms/new", "Chambre créée.", () => {
    const newId = repo.insertRoom(roomFromForm(fd));
    return `/admin/rooms/${newId}`;
  });
}

export async function saveRoom(fd: FormData) {
  await requireUser();
  const roomId = id(fd);
  await run(`/admin/rooms/${roomId}`, "Chambre enregistrée.", () => {
    if (!repo.getRoom(roomId)) throw new FormError("Chambre introuvable.");
    repo.updateRoom(roomId, roomFromForm(fd, roomId));
  });
}

export async function removeRoom(fd: FormData) {
  await requireUser();
  const roomId = id(fd);
  await run("/admin/rooms", "Chambre supprimée. Ses photos restent dans la photothèque.", () => repo.deleteRoom(roomId));
}

/* ─────────────── Photos ─────────────── */

const category = (fd: FormData): PhotoCategory => {
  const c = str(fd, "category", 20) as PhotoCategory;
  if (!PHOTO_CATEGORIES.includes(c)) throw new FormError("Catégorie invalide.");
  return c;
};
const roomRef = (fd: FormData) => {
  const r = intOrNull(fd, "roomId", 1);
  if (r != null && !repo.getRoom(r)) throw new FormError("Chambre introuvable.");
  return r;
};

/** Called once per file by the upload widget; returns a result instead of redirecting. */
export async function uploadPhoto(fd: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUser();
  try {
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) throw new FormError("Aucun fichier reçu.");
    if (file.size > MAX_UPLOAD_BYTES) throw new FormError(`${file.name} : 10 Mo maximum.`);
    const img = await processImage(Buffer.from(await file.arrayBuffer()));
    const alt = l10n(fd, "alt", 200);
    repo.insertPhoto({
      ...img,
      category: category(fd),
      alt: { fr: alt.fr || file.name.replace(/\.[^.]+$/, "").slice(0, 200), ar: alt.ar },
      roomId: roomRef(fd),
      inGallery: bool(fd, "inGallery"),
      sort: 100,
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof FormError || e instanceof ImageError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Erreur inattendue pendant le traitement de l’image." };
  }
}

export async function savePhoto(fd: FormData) {
  await requireUser();
  const photoId = id(fd);
  const back = str(fd, "back", 100).startsWith("/admin") ? str(fd, "back", 100) : "/admin/photos";
  await run(back, "Photo mise à jour.", () => {
    if (!repo.getPhoto(photoId)) throw new FormError("Photo introuvable.");
    repo.updatePhoto(photoId, {
      category: category(fd),
      alt: l10n(fd, "alt", 200),
      roomId: roomRef(fd),
      inGallery: bool(fd, "inGallery"),
      sort: intOrNull(fd, "sort", 0, 9999) ?? 0,
    });
  });
}

export async function removePhoto(fd: FormData) {
  await requireUser();
  const photoId = id(fd);
  await run("/admin/photos", "Photo supprimée.", async () => {
    const p = repo.getPhoto(photoId);
    if (!p) throw new FormError("Photo introuvable.");
    const s = repo.getSettings();
    repo.saveSettings({
      ...s,
      heroPhotoIds: s.heroPhotoIds.filter((x) => x !== photoId),
      aboutPhotoId: s.aboutPhotoId === photoId ? null : s.aboutPhotoId,
    });
    repo.deletePhotoRow(photoId);
    await deleteImageFiles(p.fileKey);
  });
}

/* ─────────────── Facilities ─────────────── */

function facilityFromForm(fd: FormData): repo.FacilityInput {
  const name = l10n(fd, "name", 80);
  if (!name.fr) throw new FormError("Le nom (français) est obligatoire.");
  return {
    icon: str(fd, "icon", 20) || "star",
    name,
    description: l10n(fd, "description", 300),
    confirmed: bool(fd, "confirmed"),
    published: bool(fd, "published"),
    sort: intOrNull(fd, "sort", 0, 9999) ?? 0,
  };
}
export async function createFacility(fd: FormData) {
  await requireUser();
  await run("/admin/facilities", "Service ajouté.", () => repo.insertFacility(facilityFromForm(fd)));
}
export async function saveFacility(fd: FormData) {
  await requireUser();
  const fid = id(fd);
  await run("/admin/facilities", "Service enregistré.", () => repo.updateFacility(fid, facilityFromForm(fd)));
}
export async function removeFacility(fd: FormData) {
  await requireUser();
  const fid = id(fd);
  await run("/admin/facilities", "Service supprimé.", () => repo.deleteFacility(fid));
}

/* ─────────────── Restaurant & salon ─────────────── */

export async function saveRestaurant(fd: FormData) {
  await requireUser();
  await run("/admin/restaurant", "Restaurant enregistré.", () => {
    const count = Math.min(Number(fd.get("menuCount")) || 0, 60);
    const menu = [];
    for (let i = 0; i < count; i++) {
      if (bool(fd, `menu${i}_delete`)) continue;
      const name = l10n(fd, `menu${i}_name`, 120);
      if (!name.fr && !name.ar) continue;
      menu.push({ name, description: l10n(fd, `menu${i}_description`, 300), priceDzd: intOrNull(fd, `menu${i}_price`, 0, 1_000_000) });
    }
    repo.saveRestaurant({
      description: l10n(fd, "description", 3000),
      hours: l10n(fd, "hours", 300),
      breakfastHours: l10n(fd, "breakfastHours", 300),
      menu,
      confirmed: bool(fd, "confirmed"),
    });
  });
}

export async function saveSalon(fd: FormData) {
  await requireUser();
  await run("/admin/salon", "Salon enregistré.", () => {
    const fr = lines(fd, "services_fr");
    const ar = lines(fd, "services_ar");
    const services = Array.from({ length: Math.max(fr.length, ar.length) }, (_, i) => ({ fr: fr[i] ?? "", ar: ar[i] ?? "" }));
    repo.saveSalon({
      description: l10n(fd, "description", 3000),
      services,
      capacity: l10n(fd, "capacity", 120),
      confirmed: bool(fd, "confirmed"),
    });
  });
}

/* ─────────────── Settings (contact, home page) ─────────────── */

export async function saveSettings(fd: FormData) {
  await requireUser();
  await run("/admin/settings", "Paramètres enregistrés.", () => {
    const s = repo.getSettings();
    const phones = lines(fd, "phones", 5);
    for (const p of phones) if (!phoneSchema.safeParse(p).success) throw new FormError(`Numéro invalide : ${p}`);
    const email = str(fd, "email", 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FormError("Adresse e-mail invalide.");
    const whatsapp = str(fd, "whatsapp", 30).replace(/\D/g, "");
    if (whatsapp && (whatsapp.length < 9 || whatsapp.length > 15 || whatsapp.startsWith("0")))
      throw new FormError("WhatsApp : format international sans + ni 0 initial, ex. 213550123456.");
    const mapsUrl = str(fd, "mapsUrl", 300);
    if (mapsUrl && !/^https:\/\/(maps\.app\.goo\.gl|(www\.)?google\.[a-z.]+\/maps|goo\.gl\/maps)\//.test(mapsUrl))
      throw new FormError("Le lien de carte doit être un lien Google Maps (https://…).");
    const coord = (name: string, lim: number) => {
      const raw = str(fd, name, 30).replace(",", ".");
      if (!raw) return null;
      const n = Number(raw);
      if (!Number.isFinite(n) || Math.abs(n) > lim) throw new FormError("Coordonnées GPS invalides.");
      return n;
    };
    const time = (name: string) => {
      const v = str(fd, name, 5);
      if (v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new FormError("Heure invalide (format HH:MM).");
      return v;
    };
    const heroPhotoIds = fd.getAll("heroPhotoIds").map(Number).filter((n) => Number.isInteger(n) && repo.getPhoto(n)).slice(0, 6);
    const about = intOrNull(fd, "aboutPhotoId", 1);
    repo.saveSettings({
      ...s,
      hotelName: { fr: str(fd, "hotelName_fr", 80) || s.hotelName.fr, ar: str(fd, "hotelName_ar", 80) || s.hotelName.ar },
      tagline: l10n(fd, "tagline", 300),
      intro: l10n(fd, "intro", 2000),
      address: l10n(fd, "address", 200),
      phones,
      email,
      whatsapp,
      mapsUrl,
      mapLat: coord("mapLat", 90),
      mapLng: coord("mapLng", 180),
      checkIn: time("checkIn"),
      checkOut: time("checkOut"),
      heroPhotoIds,
      aboutPhotoId: about && repo.getPhoto(about) ? about : null,
      contactConfirmed: bool(fd, "contactConfirmed"),
      whatsappConfirmed: bool(fd, "whatsappConfirmed"),
    });
  });
}

/* ─────────────── Booking requests & messages ─────────────── */

export async function updateBookingStatus(fd: FormData) {
  await requireUser();
  const bid = id(fd);
  const back = str(fd, "back", 120).startsWith("/admin/bookings") ? str(fd, "back", 120) : "/admin/bookings";
  await run(back, "Demande mise à jour.", () => {
    const status = str(fd, "status", 20) as BookingStatus;
    if (!BOOKING_STATUSES.includes(status)) throw new FormError("Statut invalide.");
    if (!repo.getBooking(bid)) throw new FormError("Demande introuvable.");
    repo.updateBooking(bid, status, str(fd, "staffNote", 2000));
  });
}

export async function removeBooking(fd: FormData) {
  await requireUser();
  const bid = id(fd);
  await run("/admin/bookings", "Demande supprimée.", () => repo.deleteBooking(bid));
}

export async function updateMessage(fd: FormData) {
  await requireUser();
  const mid = id(fd);
  await run("/admin/messages", "Message mis à jour.", () => {
    const status = str(fd, "status", 20);
    if (status !== "new" && status !== "read" && status !== "archived") throw new FormError("Statut invalide.");
    repo.setMessageStatus(mid, status);
  });
}

export async function removeMessage(fd: FormData) {
  await requireUser();
  const mid = id(fd);
  await run("/admin/messages", "Message supprimé.", () => repo.deleteMessage(mid));
}
