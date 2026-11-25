/**
 * Consistent online backup of the database + uploaded photos (safe while the site is running).
 *
 *   npm run db:backup                 → ./backups/<date>/
 *   npm run db:backup -- /mnt/backup  → /mnt/backup/<date>/
 */
import fs from "node:fs";
import path from "node:path";
import { db, DATA_DIR, UPLOAD_DIR } from "../src/lib/server/db";

async function main() {
  const root = path.resolve(process.argv[2] || "./backups");
  const dest = path.join(root, new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19));
  fs.mkdirSync(path.join(dest, "uploads"), { recursive: true });
  await db.backup(path.join(dest, "hotel.db"));
  for (const f of fs.readdirSync(UPLOAD_DIR)) fs.copyFileSync(path.join(UPLOAD_DIR, f), path.join(dest, "uploads", f));
  console.log(`Sauvegarde de ${DATA_DIR} terminée : ${dest}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
