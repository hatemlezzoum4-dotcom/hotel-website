# Hôtel El Sahel — Douéra, Algérie

Bilingual (French / Arabic RTL) website and management area for Hôtel El Sahel.

- **Public site**: home, rooms & rates, restaurant & buffet, salon, gallery, booking request, contact, privacy. URLs: `/fr/…` and `/ar/…`.
- **Admin area** (`/admin`): booking requests, contact messages, rooms & prices, photo library, restaurant, salon, services, contact details, home-page content and user accounts.

## Business rules built into the site

- **No invented information.** Anything missing shows a visible *« À confirmer » / « يُؤكَّد لاحقًا »* marker.
- Every room, the contact block, WhatsApp, the restaurant, the salon and each service has a **"confirmed by the hotel"** switch in the admin area. Until it is ticked, the public site labels the information as unconfirmed. The restaurant's hours and menu are not shown at all until confirmed.
- Booking is a **request, never a reservation**. The form is validated on the server and logged in the admin area with status *Nouvelle*. It then opens WhatsApp with a formatted message in the guest's language. No screen claims that availability has been checked.
- The admin dashboard lists everything still awaiting confirmation (*À confirmer avec l'hôtel*).

### Content seeded from the previous demo (all marked unconfirmed)

| Item | Value | Source noted in the demo |
|---|---|---|
| Address | 01 rue Mohamed Lazzouni, Douéra | Public listing |
| Phones | +213 28 50 66 50 · 023 14 46 40 | Public listing |
| E-mail | elsahelhotel@gmail.com | Public listing |
| WhatsApp | 21328506650 (main line) | **Must be verified as a WhatsApp number** |
| Map | 36.6695298, 2.9415437 | Google Maps |
| Single room | 4 500 DZD, breakfast included | Hotel's website |
| Double room | 7 000 DZD, breakfast included | Hotel's website |
| Twin room | price unknown | — |
| Photos | 13 real photos (`seed-assets/`) | Google Maps. **Replace with the hotel's originals** |

The restaurant prices, parking, airport shuttle and room service listed by third-party directories are **not** published. The three services exist in the admin area as hidden entries.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript) and **Tailwind CSS 4**
- **SQLite** (`better-sqlite3`): a single file, with versioned migrations in `src/lib/server/db.ts`
- **sharp**: uploads are decoded, resized to WebP (480/960/1600 px), stripped of EXIF/GPS, with a blur placeholder
- **zod** validation on every form; **bcrypt** passwords; database-backed sessions
- Self-hosted fonts (Cormorant Garamond, Jost, Amiri, IBM Plex Sans Arabic), so pages make no Google Fonts requests

## Getting started

```bash
npm install
cp .env.example .env            # set SITE_URL
npm run db:seed                 # creates data/hotel.db and imports the 13 photos
npm run admin:create -- --email direction@exemple.dz --name "Direction"   # asks for a password
npm run dev                     # http://localhost:3000
```

There are **no default credentials**. Accounts are created with `admin:create`, or by an administrator in *Comptes et sécurité*.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm run db:seed` | Seed an empty database (`-- --force` resets content but keeps users, requests and messages) |
| `npm run admin:create -- --email … --name …` | Create an admin, or reset an admin's password |
| `npm run db:backup [-- /path]` | Consistent backup of the database and photos (safe while running) |
| `npm run test:e2e` | Browser test suite (see below) |

## Deployment

1. Node.js ≥ 20.9 on a VPS (or any host with a **persistent disk**; serverless hosts are unsuitable for SQLite).
2. Set `SITE_URL=https://www.your-domain.dz` and `DATA_DIR=/var/lib/elsahel` (a persistent, backed-up folder).
3. Run `npm ci && npm run build && npm run db:seed && npm run admin:create -- …`, then `npm start` under systemd or pm2.
4. Put **HTTPS** in front (nginx or Caddy). Admin cookies are `Secure` in production, so login only works over HTTPS (or on `localhost`).
5. Schedule `npm run db:backup -- /backup/location` daily (cron).

## Security

- Sessions: a 256-bit random token in an `httpOnly`, `SameSite=Lax`, `Secure` cookie. Only its SHA-256 hash is stored, and it expires after 12 hours. The session is checked against the database on **every admin page and every server action**, not only in the proxy.
- Logins are locked after 5 failures per account or 20 per IP within 15 minutes. Changing a password revokes the user's other sessions, and deactivating a user signs them out.
- Two roles: **Administrateur** (also manages accounts) and **Éditeur**.
- Public forms are validated on the server with zod, protected by a honeypot field, and rate-limited to 5 per 10 minutes per IP.
- Uploads are limited to 10 MB and re-encoded by sharp, so non-images are rejected. Files are served only through a strict filename pattern.
- Security headers include a Content-Security-Policy, `X-Frame-Options: DENY` and `nosniff`. `/admin` is `noindex` and `no-store`.

## Tests

`scripts/e2e.mjs` drives Chromium through 27 checks:
- every page in both languages, `lang`/`dir`, a single `h1`, canonical URLs
- broken internal links and images, the localised 404
- gallery lightbox, booking validation and the WhatsApp message content (FR and AR), contact form
- no horizontal overflow at 390 px, mobile menu
- admin access control (including a forged cookie), login, booking status changes, room CRUD, photo upload and deletion, rejection of non-image uploads, restaurant confirmation rule, settings validation, logout
- no browser console errors

It **modifies data**, so run it against a copy:

```bash
cp -r data /tmp/e2e-data && DATA_DIR=/tmp/e2e-data npm start &
BASE_URL=http://localhost:3000 ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run test:e2e
```

## Project structure

```
src/
  app/(site)/[locale]/      public pages (+ booking/contact server actions)
  app/(admin)/admin/        login, (panel)/ protected pages, _actions/ server actions
  app/media/[file]/         serves processed images
  components/site|admin|ui/ reusable components
  lib/i18n/                 fr.ts / ar.ts interface texts
  lib/server/               db, repositories, auth, rate limiting, image processing
  proxy.ts                  language redirects and early admin gate
scripts/                    seed, create-admin, backup, e2e
seed-assets/                original photos from the previous demo
legacy/                     previous single-file demo (kept for reference)
```

Interface texts live in `src/lib/i18n/`. All hotel content (rooms, prices, photos, contact details and more) is edited from `/admin`, with no code changes.
