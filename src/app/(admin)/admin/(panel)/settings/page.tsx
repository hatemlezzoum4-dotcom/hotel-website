import { saveSettings } from "../../_actions/content";
import { SubmitButton } from "@/components/admin/buttons";
import { Bilingual, Card, Check, Field, Flash, PageHeader } from "@/components/admin/ui";
import { mediaUrl } from "@/lib/media";
import { requireUser } from "@/lib/server/auth";
import { getSettings, listPhotos } from "@/lib/server/repo";

export const metadata = { title: "Coordonnées et accueil" };

export default async function SettingsAdmin({ searchParams }: PageProps<"/admin/settings">) {
  await requireUser();
  const sp = await searchParams;
  const s = getSettings();
  const photos = listPhotos();
  return (
    <>
      <PageHeader title="Coordonnées et page d’accueil" text="Ces informations apparaissent dans l’en-tête, le pied de page, la page Contact et les messages WhatsApp." />
      <Flash ok={sp.ok} error={sp.error} />
      <form action={saveSettings} className="space-y-6">
        <Card title="Coordonnées">
          <div className="space-y-5">
            <Bilingual label="Nom de l’hôtel" name="hotelName" value={s.hotelName} required maxLength={80} />
            <Bilingual label="Adresse" name="address" value={s.address} maxLength={200} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Téléphones (un par ligne)" name="phones" textarea rows={3} defaultValue={s.phones.join("\n")} />
              <Field label="E-mail" name="email" type="email" defaultValue={s.email} maxLength={120} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Heure d’arrivée (check-in)" name="checkIn" type="time" defaultValue={s.checkIn} />
              <Field label="Heure de départ (check-out)" name="checkOut" type="time" defaultValue={s.checkOut} />
            </div>
            <Check label="Adresse, téléphones et e-mail confirmés par l’hôtel" name="contactConfirmed" defaultChecked={s.contactConfirmed} />
          </div>
        </Card>

        <Card title="WhatsApp (réception des demandes de réservation)">
          <div className="space-y-5">
            <div className="max-w-md">
              <Field label="Numéro WhatsApp" name="whatsapp" defaultValue={s.whatsapp} maxLength={30}
                hint="Format international, chiffres uniquement : 213 suivi du numéro sans le 0. Ex. : 213550123456. Vide = boutons WhatsApp masqués." />
            </div>
            <Check label="Numéro vérifié : il est bien actif sur WhatsApp et consulté par la réception" name="whatsappConfirmed" defaultChecked={s.whatsappConfirmed} />
          </div>
        </Card>

        <Card title="Localisation">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Lien Google Maps" name="mapsUrl" type="url" defaultValue={s.mapsUrl} maxLength={300} />
            <Field label="Latitude" name="mapLat" defaultValue={s.mapLat} />
            <Field label="Longitude" name="mapLng" defaultValue={s.mapLng} />
          </div>
        </Card>

        <Card title="Page d’accueil">
          <div className="space-y-5">
            <Bilingual label="Phrase d’accroche (sous le titre)" name="tagline" value={s.tagline} maxLength={300} hint="Vide = texte par défaut du site." />
            <Bilingual label="Présentation de l’hôtel" name="intro" value={s.intro} textarea rows={4} maxLength={2000} />
            <fieldset>
              <legend className="field-label !text-[0.7rem]">Photos du diaporama d’accueil (6 max., dans l’ordre de la photothèque)</legend>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {photos.map((p) => (
                  <label key={p.id} className="relative block cursor-pointer">
                    <input type="checkbox" name="heroPhotoIds" value={p.id} defaultChecked={s.heroPhotoIds.includes(p.id)} className="peer absolute start-2 top-2 z-10 h-4 w-4 accent-gold-600" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(p.fileKey, 480)} alt={p.alt.fr} className="aspect-square w-full object-cover opacity-60 ring-gold-500 transition peer-checked:opacity-100 peer-checked:ring-4" />
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field max-w-md">
              <span className="field-label !text-[0.7rem]">Photo de la section « L’hôtel »</span>
              <select name="aboutPhotoId" defaultValue={s.aboutPhotoId ?? ""} className="input !min-h-[2.75rem] !py-2">
                <option value="">— Aucune</option>
                {photos.map((p) => <option key={p.id} value={p.id}>{p.alt.fr || `Photo ${p.id}`}</option>)}
              </select>
            </label>
          </div>
        </Card>
        <div className="flex justify-end"><SubmitButton>Enregistrer les paramètres</SubmitButton></div>
      </form>
    </>
  );
}
