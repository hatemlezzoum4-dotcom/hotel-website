import Link from "next/link";
import { notFound } from "next/navigation";
import { removeRoom, saveRoom } from "../../../_actions/content";
import { ConfirmButton } from "@/components/admin/buttons";
import RoomForm from "@/components/admin/RoomForm";
import { Card, Flash, PageHeader } from "@/components/admin/ui";
import { mediaUrl } from "@/lib/media";
import { requireUser } from "@/lib/server/auth";
import { getRoom } from "@/lib/server/repo";

export const metadata = { title: "Modifier une chambre" };

export default async function EditRoom({ params, searchParams }: PageProps<"/admin/rooms/[id]">) {
  await requireUser();
  const room = getRoom(Number((await params).id));
  if (!room) notFound();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title={room.name.fr}
        action={<div className="flex gap-6"><a href={`/fr/rooms#${room.slug}`} target="_blank" rel="noopener" className="link-lux">Voir sur le site ↗</a><Link href="/admin/rooms" className="link-lux">← Retour</Link></div>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><RoomForm room={room} action={saveRoom} /></div>
        <div className="space-y-6">
          <Card title="Photos de la chambre">
            {room.photos.length ? (
              <div className="grid grid-cols-2 gap-2">
                {room.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={mediaUrl(p.fileKey, 480)} alt={p.alt.fr} className="aspect-[4/3] w-full object-cover" />
                ))}
              </div>
            ) : <p className="text-sm text-muted">Aucune photo associée.</p>}
            <p className="mt-4 text-sm text-muted">Pour ajouter ou retirer une photo, ouvrez la photothèque et choisissez cette chambre dans le champ « Chambre ».</p>
            <Link href="/admin/photos" className="link-lux mt-4">Photothèque</Link>
          </Card>
          <Card title="Supprimer">
            <p className="text-sm text-muted">La chambre disparaît du site. Ses photos et les demandes passées sont conservées.</p>
            <form action={removeRoom} className="mt-4">
              <input type="hidden" name="id" value={room.id} />
              <ConfirmButton message={`Supprimer « ${room.name.fr} » ?`} className="btn !min-h-[2.5rem] border border-[#b4412f] text-[#a23a2a]">Supprimer la chambre</ConfirmButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
