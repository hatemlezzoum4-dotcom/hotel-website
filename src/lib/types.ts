export const LOCALES = ["fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** A piece of text available in both site languages. */
export type L10n = { fr: string; ar: string };

export const PHOTO_CATEGORIES = ["hotel", "rooms", "restaurant", "salon", "facilities"] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export type Photo = {
  id: number;
  fileKey: string;
  width: number;
  height: number;
  blur: string;
  category: PhotoCategory;
  alt: L10n;
  roomId: number | null;
  inGallery: boolean;
  sort: number;
};

export type Room = {
  id: number;
  slug: string;
  name: L10n;
  category: L10n;
  description: L10n;
  capacity: number | null;
  amenities: { fr: string[]; ar: string[] };
  priceDzd: number | null;
  priceNote: L10n;
  priceConfirmed: boolean;
  detailsConfirmed: boolean;
  published: boolean;
  sort: number;
  photos: Photo[];
};

export type Facility = {
  id: number;
  icon: string;
  name: L10n;
  description: L10n;
  confirmed: boolean;
  published: boolean;
  sort: number;
};

export type HotelSettings = {
  hotelName: L10n;
  tagline: L10n;
  intro: L10n;
  address: L10n;
  phones: string[];
  email: string;
  /** International format, digits only, e.g. 213555000000. Empty = not configured. */
  whatsapp: string;
  mapsUrl: string;
  mapLat: number | null;
  mapLng: number | null;
  checkIn: string;
  checkOut: string;
  heroPhotoIds: number[];
  aboutPhotoId: number | null;
  /** Whether management has confirmed the contact block (address, phones, email). */
  contactConfirmed: boolean;
  whatsappConfirmed: boolean;
};

export type MenuItem = { name: L10n; description: L10n; priceDzd: number | null };

export type RestaurantInfo = {
  description: L10n;
  hours: L10n;
  breakfastHours: L10n;
  menu: MenuItem[];
  /** Hours and menu are only displayed once management confirms them. */
  confirmed: boolean;
};

export type SalonInfo = {
  description: L10n;
  services: L10n[];
  capacity: L10n;
  confirmed: boolean;
};

export const BOOKING_STATUSES = ["new", "contacted", "confirmed", "declined", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingRequest = {
  id: number;
  ref: string;
  fullName: string;
  phone: string;
  arrival: string;
  departure: string;
  roomId: number | null;
  roomLabel: string;
  guests: number;
  message: string;
  locale: Locale;
  status: BookingStatus;
  staffNote: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactMessage = {
  id: number;
  fullName: string;
  replyTo: string;
  subject: string;
  message: string;
  locale: Locale;
  status: "new" | "read" | "archived";
  createdAt: string;
};
