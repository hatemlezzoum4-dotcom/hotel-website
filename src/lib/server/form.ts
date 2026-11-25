import "server-only";
import { clean } from "@/lib/validation";

/** Small helpers to read admin FormData safely (length-capped, trimmed, typed). */
export const str = (fd: FormData, name: string, max = 2000) => clean(String(fd.get(name) ?? "")).slice(0, max);
export const l10n = (fd: FormData, name: string, max = 2000) => ({ fr: str(fd, `${name}_fr`, max), ar: str(fd, `${name}_ar`, max) });
export const bool = (fd: FormData, name: string) => fd.get(name) === "on";
export function intOrNull(fd: FormData, name: string, min = 0, max = 1_000_000_000): number | null {
  const raw = String(fd.get(name) ?? "").replace(/[\s ]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new FormError(`Valeur invalide pour « ${name} ».`);
  return n;
}
export const lines = (fd: FormData, name: string, maxItems = 40) =>
  str(fd, name, 5000).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, maxItems);
export const id = (fd: FormData, name = "id") => {
  const n = Number(fd.get(name));
  if (!Number.isInteger(n) || n <= 0) throw new FormError("Identifiant invalide.");
  return n;
};

export class FormError extends Error {}

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
