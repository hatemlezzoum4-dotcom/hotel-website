import Link from "next/link";
import { removePhoto, savePhoto } from "../../_actions/content";
import { ConfirmButton, SubmitButton } from "@/components/admin/buttons";
import PhotoUploader from "@/components/admin/PhotoUploader";
import { Badge, Card, Flash, PageHeader } from "@/components/admin/ui";
import { mediaUrl } from "@/lib/media";
import { requireUser } from "@/lib/server/auth";
import { getSettings, listPhotos, listRooms } from "@/lib/server/repo";
import { PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/types";

export const metadata = { title: "Photos" };

const CAT: Record<PhotoCategory, string> = { hotel: "L’hôtel", rooms: "Chambres", restaurant: "Restaurant", salon: "Salon", facilities: "Espaces" };

export default async function PhotosAdmin({ searchParams }: PageProps<"/admin/photos">) {
  await requireUser();
  const sp = await searchParams;
  const cat = PHOTO_CATEGORIES.includes(sp.cat as PhotoCategory) ? (sp.cat as PhotoCategory) : undefined;
  const photos = listPhotos(cat ? { category: cat } : {});
  const rooms = listRooms();
  const s = getSettings();
  const back = cat ? `/admin/photos?cat=${cat}` : "/admin/photos";
  const sel = "input !min-h-[2.4rem] !py-1.5 text-sm";

  return (
    <>
      <PageHeader title="Photothèque" text="Ajoutez les photos officielles de l’hôtel, classez-les par catégorie et associez-les aux chambres." />
      <Flash ok={sp.ok} error={sp.error} />
      <Card title="Ajouter des photos" className="mb-8">
        <PhotoUploader rooms={rooms.map((r) => ({ id: r.id, name: r.name.fr }))} />
      </Card>

      <nav aria-label="Catégories" className="mb-6 flex flex-wrap gap-2">
        {[["", "Toutes"], ...PHOTO_CATEGORIES.map((c) => [c, CAT[c]])].map(([k, l]) => (
          <Link key={k} href={k ? `/admin/photos?cat=${k}` : "/admin/photos"} aria-current={(cat ?? "") === k ? "page" : undefined}
            className="rounded-full border border-ivory-300 bg-white px-4 py-1.5 text-sm aria-[current=page]:border-forest-900 aria-[current=page]:bg-forest-900 aria-[current=page]:text-ivory-50">
            {l}
          </Link>
        ))}
      </nav>

      <ul id="photo-grid" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-sm border border-ivory-200 bg-white">
            <div className="relative aspect-[4/3] bg-forest-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(p.fileKey, 480)} alt={p.alt.fr} loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute start-2 top-2 flex flex-wrap gap-1">
                {s.heroPhotoIds.includes(p.id) && <Badge tone="gold">Accueil</Badge>}
                {!p.inGallery && <Badge tone="grey">Hors galerie</Badge>}
              </div>
            </div>
            <form action={savePhoto} className="grid gap-2 p-4">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value={back} />
              <div className="grid grid-cols-2 gap-2">
                <select name="category" defaultValue={p.category} aria-label="Catégorie" className={sel}>
                  {PHOTO_CATEGORIES.map((c) => <option key={c} value={c}>{CAT[c]}</option>)}
                </select>
                <select name="roomId" defaultValue={p.roomId ?? ""} aria-label="Chambre associée" className={sel}>
                  <option value="">— Aucune chambre</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name.fr}</option>)}
                </select>
              </div>
              <input name="alt_fr" defaultValue={p.alt.fr} maxLength={200} aria-label="Description en français" placeholder="Description (FR)" className={sel} />
              <input name="alt_ar" defaultValue={p.alt.ar} maxLength={200} dir="rtl" aria-label="Description en arabe" placeholder="الوصف (AR)" className={sel} />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inGallery" defaultChecked={p.inGallery} className="accent-forest-800" />Galerie</label>
                <label className="flex items-center gap-2 text-sm">Ordre<input name="sort" type="number" min={0} max={9999} defaultValue={p.sort} className={sel + " !w-20"} /></label>
              </div>
              <SubmitButton className="btn btn-outline !min-h-[2.4rem] !px-4">Enregistrer</SubmitButton>
            </form>
            <form action={removePhoto} className="border-t border-ivory-200 px-4 py-2 text-end">
              <input type="hidden" name="id" value={p.id} />
              <ConfirmButton message="Supprimer définitivement cette photo ?">Supprimer</ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
      {photos.length === 0 && <Card><p className="text-muted">Aucune photo dans cette catégorie.</p></Card>}
    </>
  );
}
