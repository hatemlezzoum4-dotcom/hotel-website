import { Bilingual, Card, Check, Field } from "./ui";
import { SubmitButton } from "./buttons";
import type { Room } from "@/lib/types";

const empty = { fr: "", ar: "" };

export default function RoomForm({ room, action }: { room?: Room; action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-6">
      {room && <input type="hidden" name="id" value={room.id} />}
      <Card title="Présentation">
        <div className="space-y-5">
          <Bilingual label="Nom de la chambre" name="name" value={room?.name ?? empty} required maxLength={120} />
          <Bilingual label="Catégorie" name="category" value={room?.category ?? empty} hint="Ex. : Standard, Supérieure, Suite…" maxLength={80} />
          <Bilingual label="Description" name="description" value={room?.description ?? empty} textarea rows={5} maxLength={3000} />
          <Bilingual
            label="Équipements (un par ligne)"
            name="amenities"
            value={{ fr: room?.amenities.fr.join("\n") ?? "", ar: room?.amenities.ar.join("\n") ?? "" }}
            textarea
            rows={5}
            hint="N’indiquez que les équipements réellement présents."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Capacité (personnes)" name="capacity" type="number" min={1} max={50} defaultValue={room?.capacity} hint="Vide = « À confirmer »" />
            <Field label="Identifiant d’URL" name="slug" defaultValue={room?.slug} hint="Généré depuis le nom si vide" maxLength={80} />
            <Field label="Ordre d’affichage" name="sort" type="number" min={0} max={9999} defaultValue={room?.sort ?? 0} />
          </div>
          <Check label="Description, capacité et équipements confirmés par l’hôtel" name="detailsConfirmed" defaultChecked={room?.detailsConfirmed} />
        </div>
      </Card>
      <Card title="Tarif">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Prix par nuit (DZD)" name="priceDzd" type="number" min={0} max={10000000} defaultValue={room?.priceDzd} hint="Vide = « Tarif sur demande »" />
          </div>
          <Bilingual label="Précision tarifaire" name="priceNote" value={room?.priceNote ?? empty} hint="Ex. : Petit-déjeuner inclus" maxLength={160} />
          <Check label="Tarif confirmé par l’hôtel" name="priceConfirmed" defaultChecked={room?.priceConfirmed}
            hint="Sinon le site affiche « Tarif indicatif · à confirmer »." />
        </div>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Check label="Publier sur le site" name="published" defaultChecked={room ? room.published : true} />
          <SubmitButton>{room ? "Enregistrer les modifications" : "Créer la chambre"}</SubmitButton>
        </div>
      </Card>
    </form>
  );
}
