import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Runtime-only location: excluded from build file tracing.
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

/**
 * Ordered, append-only list of schema migrations.
 * Never edit an existing entry once deployed: add a new one instead.
 */
const MIGRATIONS: string[] = [
  /* 1 — initial schema */ `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','editor')) DEFAULT 'editor',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);
  CREATE TABLE rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  );
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL DEFAULT '',
    category_fr TEXT NOT NULL DEFAULT '',
    category_ar TEXT NOT NULL DEFAULT '',
    description_fr TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    capacity INTEGER,
    amenities_fr TEXT NOT NULL DEFAULT '[]',
    amenities_ar TEXT NOT NULL DEFAULT '[]',
    price_dzd INTEGER,
    price_note_fr TEXT NOT NULL DEFAULT '',
    price_note_ar TEXT NOT NULL DEFAULT '',
    price_confirmed INTEGER NOT NULL DEFAULT 0,
    details_confirmed INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_key TEXT NOT NULL UNIQUE,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    blur TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('rooms','hotel','restaurant','salon','facilities')),
    alt_fr TEXT NOT NULL DEFAULT '',
    alt_ar TEXT NOT NULL DEFAULT '',
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    in_gallery INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX photos_category ON photos(category);
  CREATE INDEX photos_room ON photos(room_id);
  CREATE TABLE facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    icon TEXT NOT NULL DEFAULT 'star',
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL DEFAULT '',
    description_fr TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    confirmed INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE booking_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    arrival TEXT NOT NULL,
    departure TEXT NOT NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    room_label TEXT NOT NULL DEFAULT '',
    guests INTEGER NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    locale TEXT NOT NULL DEFAULT 'fr',
    status TEXT NOT NULL DEFAULT 'new'
      CHECK (status IN ('new','contacted','confirmed','declined','cancelled')),
    staff_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX booking_status ON booking_requests(status, created_at);
  CREATE TABLE contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    reply_to TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'fr',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
];

function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

function open(): Database.Database {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "hotel.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

// Reuse a single connection across hot reloads in development.
const g = globalThis as unknown as { __hotelDb?: Database.Database };
export const db: Database.Database = g.__hotelDb ?? (g.__hotelDb = open());
