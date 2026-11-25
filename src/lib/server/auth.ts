import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { DUMMY_HASH, verifyPassword } from "./password";
export { hashPassword, passwordProblems } from "./password";

export const SESSION_COOKIE = "es_admin_session";
const SESSION_HOURS = 12;

export type AdminUser = { id: number; email: string; name: string; role: "admin" | "editor" };

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function authenticate(email: string, password: string): Promise<AdminUser | null> {
  const row = db
    .prepare("SELECT id, email, name, role, password_hash, active FROM users WHERE email = ?")
    .get(email.trim()) as (AdminUser & { password_hash: string; active: number }) | undefined;
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok || !row.active) return null;
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(row.id);
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function startSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000);
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    sha256(token),
    userId,
    expires.toISOString().replace("T", " ").slice(0, 19),
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIES,
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** Returns the signed-in user, validated against the database on every request. */
export const currentUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.active = 1`,
    )
    .get(sha256(token)) as AdminUser | undefined;
  return row ?? null;
});

/** Call at the top of every admin page AND every admin server action. */
export async function requireUser(role?: "admin"): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (role === "admin" && user.role !== "admin") redirect("/admin?denied=1");
  return user;
}

export function revokeUserSessions(userId: number, exceptToken?: string) {
  if (exceptToken) {
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").run(userId, sha256(exceptToken));
  } else {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  }
}

export async function currentToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
