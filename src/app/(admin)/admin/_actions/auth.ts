"use server";
import { redirect } from "next/navigation";
import {
  authenticate,
  currentToken,
  endSession,
  hashPassword,
  passwordProblems,
  requireUser,
  revokeUserSessions,
  startSession,
} from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { verifyPassword } from "@/lib/server/password";
import { clientIp, hit, isLimited, reset } from "@/lib/server/rate-limit";
import { str } from "@/lib/server/form";

export type LoginState = { error?: string; email?: string };

const LOGIN_WINDOW = 15 * 60;

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = str(fd, "email", 160).toLowerCase();
  const password = String(fd.get("password") ?? "").slice(0, 200);
  const ip = await clientIp();
  if (!email || !password) return { error: "Saisissez votre e-mail et votre mot de passe.", email };

  // Lock-out after repeated failures, per account and per IP address.
  if (isLimited("login-email", email, 5) || isLimited("login-ip", ip, 20)) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes.", email };
  }
  const user = await authenticate(email, password);
  if (!user) {
    hit("login-email", email, 5, LOGIN_WINDOW);
    hit("login-ip", ip, 20, LOGIN_WINDOW);
    return { error: "Identifiants incorrects ou compte désactivé.", email };
  }
  reset("login-email", email);
  await startSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

function back(path: string, key: "ok" | "error", msg: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(msg)}`);
}

export async function changePassword(fd: FormData) {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
  if (!(await verifyPassword(current, row.password_hash))) back("/admin/account", "error", "Mot de passe actuel incorrect.");
  if (next !== confirm) back("/admin/account", "error", "Les deux nouveaux mots de passe ne correspondent pas.");
  const problem = passwordProblems(next);
  if (problem) back("/admin/account", "error", problem);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(next), user.id);
  // Sign out every other device that used the old password.
  revokeUserSessions(user.id, await currentToken());
  back("/admin/account", "ok", "Mot de passe modifié. Les autres sessions ont été déconnectées.");
}

export async function createUser(fd: FormData) {
  await requireUser("admin");
  const email = str(fd, "email", 160).toLowerCase();
  const name = str(fd, "name", 80);
  const role = str(fd, "role", 10) === "admin" ? "admin" : "editor";
  const password = String(fd.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) back("/admin/account", "error", "Nom et e-mail valides obligatoires.");
  const problem = passwordProblems(password);
  if (problem) back("/admin/account", "error", problem);
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) back("/admin/account", "error", "Cet e-mail a déjà un compte.");
  db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)").run(email, name, await hashPassword(password), role);
  back("/admin/account", "ok", `Compte créé pour ${email}. Communiquez-lui le mot de passe en main propre.`);
}

export async function setUserActive(fd: FormData) {
  const me = await requireUser("admin");
  const uid = Number(fd.get("id"));
  const active = fd.get("active") === "1";
  if (uid === me.id) back("/admin/account", "error", "Vous ne pouvez pas désactiver votre propre compte.");
  if (!active) {
    const admins = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id != ?").get(uid) as { n: number };
    if (admins.n === 0) back("/admin/account", "error", "Il doit rester au moins un administrateur actif.");
  }
  db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, uid);
  if (!active) revokeUserSessions(uid);
  back("/admin/account", "ok", active ? "Compte réactivé." : "Compte désactivé et déconnecté.");
}

export async function resetUserPassword(fd: FormData) {
  const me = await requireUser("admin");
  const uid = Number(fd.get("id"));
  if (uid === me.id) back("/admin/account", "error", "Utilisez le formulaire « Mon mot de passe ».");
  const password = String(fd.get("password") ?? "");
  const problem = passwordProblems(password);
  if (problem) back("/admin/account", "error", problem);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), uid);
  revokeUserSessions(uid);
  back("/admin/account", "ok", "Mot de passe réinitialisé ; l’utilisateur a été déconnecté.");
}
