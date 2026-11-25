/**
 * Creates (or resets the password of) an administrator account.
 *
 *   npm run admin:create -- --email direction@hotel.dz --name "Direction"
 *
 * The password is read from the ADMIN_PASSWORD environment variable, or asked interactively
 * (input hidden). There are no default credentials.
 */
import readline from "node:readline";
import { db } from "../src/lib/server/db";
import { hashPassword, passwordProblems } from "../src/lib/server/password";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    out._writeToOutput = (s: string) => {
      if (!muted || s.includes("\n")) out.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || "Administrateur";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage : npm run admin:create -- --email adresse@exemple.dz --name "Nom"');
    process.exit(1);
  }
  const password = process.env.ADMIN_PASSWORD || (await askHidden("Mot de passe (12 caractères minimum) : "));
  const problem = passwordProblems(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  const hash = await hashPassword(password);
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (existing) {
    db.prepare("UPDATE users SET password_hash = ?, role = 'admin', active = 1 WHERE id = ?").run(hash, existing.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
    console.log(`Mot de passe réinitialisé pour ${email} (sessions existantes révoquées).`);
  } else {
    db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')").run(email, name, hash);
    console.log(`Compte administrateur créé : ${email}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
