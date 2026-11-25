import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";

/** Best-effort client IP (first X-Forwarded-For hop when behind a reverse proxy). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

const keyOf = (scope: string, id: string) =>
  scope + ":" + crypto.createHash("sha256").update(id).digest("hex").slice(0, 32);

/**
 * Fixed-window counter stored in SQLite (survives restarts, works across workers).
 * Returns false when the caller has exceeded `limit` hits within `windowSec`.
 */
export function hit(scope: string, id: string, limit: number, windowSec: number): boolean {
  const key = keyOf(scope, id);
  const now = Date.now();
  return db.transaction(() => {
    const row = db.prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?").get(key) as
      | { count: number; reset_at: number }
      | undefined;
    if (!row || row.reset_at <= now) {
      db.prepare("INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)").run(key, now + windowSec * 1000);
      return true;
    }
    db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
    return row.count + 1 <= limit;
  })();
}

export function isLimited(scope: string, id: string, limit: number): boolean {
  const row = db.prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?").get(keyOf(scope, id)) as
    | { count: number; reset_at: number }
    | undefined;
  return !!row && row.reset_at > Date.now() && row.count >= limit;
}

export function reset(scope: string, id: string) {
  db.prepare("DELETE FROM rate_limits WHERE key = ?").run(keyOf(scope, id));
}

export function purgeExpired() {
  db.prepare("DELETE FROM rate_limits WHERE reset_at <= ?").run(Date.now());
}
