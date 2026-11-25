import { removeMessage, updateMessage } from "../../_actions/content";
import { ConfirmButton, SubmitButton } from "@/components/admin/buttons";
import { Badge, Card, Flash, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { listMessages } from "@/lib/server/repo";

export const metadata = { title: "Messages" };

const LABEL = { new: ["Nouveau", "gold"], read: ["Lu", "green"], archived: ["Archivé", "grey"] } as const;

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireUser();
  const sp = await searchParams;
  const list = listMessages();
  return (
    <>
      <PageHeader title="Messages" text="Messages envoyés depuis le formulaire de la page Contact." />
      <Flash ok={sp.ok} error={sp.error} />
      {list.length === 0 ? (
        <Card><p className="text-muted">Aucun message reçu.</p></Card>
      ) : (
        <div className="space-y-4">
          {list.map((m) => {
            const isEmail = m.replyTo.includes("@");
            return (
              <Card key={m.id} className={m.status === "archived" ? "opacity-70" : ""}>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl text-forest-900">{m.fullName}</h2>
                  <Badge tone={LABEL[m.status][1]}>{LABEL[m.status][0]}</Badge>
                  <span className="text-sm text-muted">{formatDate(m.createdAt.slice(0, 10))} · {m.locale === "ar" ? "arabe" : "français"}</span>
                </div>
                <p className="mt-1 text-sm">
                  Répondre à : <a className="text-gold-700 hover:underline" href={isEmail ? `mailto:${m.replyTo}?subject=${encodeURIComponent("Re: " + (m.subject || "Hôtel El Sahel"))}` : `tel:${m.replyTo.replace(/[^\d+]/g, "")}`}>{m.replyTo}</a>
                </p>
                {m.subject && <p className="mt-3 font-medium">{m.subject}</p>}
                <p className="mt-2 whitespace-pre-line text-sm">{m.message}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ivory-200 pt-3">
                  <form action={updateMessage} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <select name="status" defaultValue={m.status} aria-label="Statut" className="input !min-h-[2.4rem] !w-auto !py-1.5 text-sm">
                      <option value="new">Nouveau</option><option value="read">Lu</option><option value="archived">Archivé</option>
                    </select>
                    <SubmitButton className="btn btn-outline !min-h-[2.4rem] !px-4">OK</SubmitButton>
                  </form>
                  <form action={removeMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmButton message="Supprimer définitivement ce message ?">Supprimer</ConfirmButton>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
