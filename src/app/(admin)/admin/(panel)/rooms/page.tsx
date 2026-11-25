import Link from "next/link";
import { Badge, Card, Flash, PageHeader } from "@/components/admin/ui";
import { mediaUrl } from "@/lib/media";
import { formatDzd } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { listRooms } from "@/lib/server/repo";

export const metadata = { title: "Chambres" };

export default async function RoomsAdmin({ searchParams }: PageProps<"/admin/rooms">) {
  await requireUser();
  const sp = await searchParams;
  const rooms = listRooms();
  return (
    <>
      <PageHeader title="Chambres et tarifs" text="Ajoutez, modifiez ou supprimez les chambres affichées sur le site."
        action={<Link href="/admin/rooms/new" className="btn btn-gold !min-h-[2.75rem]">+ Nouvelle chambre</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-4">
        {rooms.length === 0 && <Card><p className="text-muted">Aucune chambre.</p></Card>}
        {rooms.map((r) => (
          <Link key={r.id} href={`/admin/rooms/${r.id}`} className="group flex items-center gap-5 rounded-sm border border-ivory-200 bg-white p-4 transition-shadow hover:shadow-lg">
            <div className="h-20 w-28 shrink-0 overflow-hidden bg-forest-900">
              {r.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(r.photos[0].fileKey, 480)} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl text-forest-900">{r.name.fr} <span className="text-base text-muted" dir="rtl">{r.name.ar}</span></p>
              <p className="mt-1 flex flex-wrap gap-2 text-sm">
                {r.priceDzd != null ? <span>{formatDzd(r.priceDzd, "fr")} / nuit</span> : <span className="text-muted">Tarif sur demande</span>}
                <Badge tone={r.priceConfirmed ? "green" : "gold"}>{r.priceConfirmed ? "Tarif confirmé" : "Tarif à confirmer"}</Badge>
                <Badge tone={r.detailsConfirmed ? "green" : "gold"}>{r.detailsConfirmed ? "Détails confirmés" : "Détails à confirmer"}</Badge>
                {!r.published && <Badge tone="grey">Non publiée</Badge>}
                <span className="text-muted">{r.photos.length} photo(s)</span>
              </p>
            </div>
            <span className="text-gold-700 group-hover:underline">Modifier</span>
          </Link>
        ))}
      </div>
    </>
  );
}
