import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// A valid bcrypt hash used to keep login timing constant when the e-mail is unknown.
export const DUMMY_HASH = "$2b$12$i8UGABHq8YVGeQKC4WYpQeHkHsA/WMDTqJj7/Xr/ug.JTSncIOlde";

export function passwordProblems(pw: string): string | null {
  if (pw.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
  if (pw.length > 200) return "Mot de passe trop long.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Utilisez au moins une lettre et un chiffre.";
  return null;
}
