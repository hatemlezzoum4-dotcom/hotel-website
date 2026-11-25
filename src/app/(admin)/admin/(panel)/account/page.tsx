import { changePassword, createUser, resetUserPassword, setUserActive } from "../../_actions/auth";
import { SubmitButton } from "@/components/admin/buttons";
import { Badge, Card, Field, Flash, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export const metadata = { title: "Comptes et sécurité" };

type U = { id: number; email: string; name: string; role: string; active: number; last_login_at: string | null };

export default async function AccountPage({ searchParams }: PageProps<"/admin/account">) {
  const me = await requireUser();
  const sp = await searchParams;
  const users = me.role === "admin" ? (db.prepare("SELECT id, email, name, role, active, last_login_at FROM users ORDER BY name").all() as U[]) : [];
  const pw = "Au moins 12 caractères, avec lettres et chiffres.";
  return (
    <>
      <PageHeader title={me.role === "admin" ? "Comptes et sécurité" : "Mon compte"} text={`Connecté en tant que ${me.email}.`} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Mon mot de passe">
          <form action={changePassword} className="grid max-w-md gap-4">
            <Field label="Mot de passe actuel" name="current" type="password" required />
            <Field label="Nouveau mot de passe" name="next" type="password" required hint={pw} />
            <Field label="Confirmer le nouveau mot de passe" name="confirm" type="password" required />
            <div><SubmitButton>Changer le mot de passe</SubmitButton></div>
          </form>
        </Card>
        {me.role === "admin" && (
          <Card title="Ajouter un utilisateur">
            <form action={createUser} className="grid max-w-md gap-4">
              <Field label="Nom" name="name" required maxLength={80} />
              <Field label="E-mail" name="email" type="email" required maxLength={160} />
              <label className="field">
                <span className="field-label !text-[0.7rem]">Rôle</span>
                <select name="role" className="input !min-h-[2.75rem] !py-2" defaultValue="editor">
                  <option value="editor">Éditeur (contenu et demandes)</option>
                  <option value="admin">Administrateur (+ gestion des comptes)</option>
                </select>
              </label>
              <Field label="Mot de passe initial" name="password" type="password" required hint={pw} />
              <div><SubmitButton>Créer le compte</SubmitButton></div>
            </form>
          </Card>
        )}
      </div>
      {me.role === "admin" && (
        <Card title="Utilisateurs" className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-start text-xs uppercase tracking-wider text-muted">
                <tr><th className="py-2 text-start">Nom</th><th className="text-start">E-mail</th><th className="text-start">Rôle</th><th className="text-start">Dernière connexion</th><th className="text-start">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {users.map((u) => (
                  <tr key={u.id} className="align-top">
                    <td className="py-3 pe-4 font-medium">{u.name}{u.id === me.id && " (vous)"}</td>
                    <td className="py-3 pe-4">{u.email}</td>
                    <td className="py-3 pe-4"><Badge tone={u.role === "admin" ? "gold" : "blue"}>{u.role === "admin" ? "Administrateur" : "Éditeur"}</Badge> {!u.active && <Badge tone="grey">Désactivé</Badge>}</td>
                    <td className="py-3 pe-4 text-muted">{u.last_login_at ? `${u.last_login_at.slice(0, 16)} UTC` : "—"}</td>
                    <td className="py-3">
                      {u.id !== me.id && (
                        <div className="flex flex-wrap gap-3">
                          <form action={setUserActive}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                            <SubmitButton className="text-sm text-gold-700 hover:underline" pendingText="…">{u.active ? "Désactiver" : "Réactiver"}</SubmitButton>
                          </form>
                          <form action={resetUserPassword} className="flex gap-2">
                            <input type="hidden" name="id" value={u.id} />
                            <input name="password" type="password" required minLength={12} placeholder="Nouveau mot de passe" aria-label={`Nouveau mot de passe pour ${u.name}`} className="input !min-h-[2.2rem] !w-48 !py-1 text-sm" />
                            <SubmitButton className="text-sm text-gold-700 hover:underline" pendingText="…">Réinitialiser</SubmitButton>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
