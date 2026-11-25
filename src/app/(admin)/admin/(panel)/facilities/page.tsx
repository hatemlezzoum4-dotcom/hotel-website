import { createFacility, removeFacility, saveFacility } from "../../_actions/content";
import { ConfirmButton, SubmitButton } from "@/components/admin/buttons";
import { Badge, Bilingual, Card, Check, Field, Flash, PageHeader } from "@/components/admin/ui";
import Icon from "@/components/ui/Icon";
import { requireUser } from "@/lib/server/auth";
import { listFacilities } from "@/lib/server/repo";
import type { Facility } from "@/lib/types";

export const metadata = { title: "Services" };

const ICONS = ["bell", "utensils", "coffee", "buffet", "sofa", "parking", "plane", "tray", "wifi", "snow", "star", "users", "bed", "clock"];

function FacilityFields({ f }: { f?: Facility }) {
  return (
    <div className="space-y-4">
      <Bilingual label="Nom" name="name" value={f?.name ?? { fr: "", ar: "" }} required maxLength={80} />
      <Bilingual label="Description courte" name="description" value={f?.description ?? { fr: "", ar: "" }} maxLength={300} />
      <div className="flex flex-wrap items-end gap-6">
        <label className="field">
          <span className="field-label !text-[0.7rem]">Icône</span>
          <select name="icon" defaultValue={f?.icon ?? "star"} className="input !min-h-[2.75rem] !w-40 !py-2">
            {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <div className="w-32"><Field label="Ordre" name="sort" type="number" min={0} max={9999} defaultValue={f?.sort ?? 0} /></div>
        <Check label="Publié" name="published" defaultChecked={f ? f.published : true} />
        <Check label="Confirmé par l’hôtel" name="confirmed" defaultChecked={f?.confirmed} />
      </div>
    </div>
  );
}

export default async function FacilitiesAdmin({ searchParams }: PageProps<"/admin/facilities">) {
  await requireUser();
  const sp = await searchParams;
  const list = listFacilities();
  return (
    <>
      <PageHeader title="Équipements et services" text="Affichés sur la page d’accueil. Ne publiez que des services réellement proposés ; décochez « Confirmé » tant que l’hôtel ne l’a pas validé." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="space-y-4">
        {list.map((f) => (
          <details key={f.id} className="group rounded-sm border border-ivory-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
              <Icon name={f.icon} className="text-2xl text-gold-600" />
              <span className="flex-1 font-medium text-forest-900">{f.name.fr} <span className="text-muted" dir="rtl">{f.name.ar}</span></span>
              {!f.published && <Badge tone="grey">Masqué</Badge>}
              <Badge tone={f.confirmed ? "green" : "gold"}>{f.confirmed ? "Confirmé" : "À confirmer"}</Badge>
              <span className="text-sm text-gold-700 group-open:hidden">Modifier</span>
            </summary>
            <div className="border-t border-ivory-200 p-5">
              <form action={saveFacility} className="space-y-4">
                <input type="hidden" name="id" value={f.id} />
                <FacilityFields f={f} />
                <SubmitButton>Enregistrer</SubmitButton>
              </form>
              <form action={removeFacility} className="mt-4 text-end">
                <input type="hidden" name="id" value={f.id} />
                <ConfirmButton message={`Supprimer « ${f.name.fr} » ?`}>Supprimer</ConfirmButton>
              </form>
            </div>
          </details>
        ))}
      </div>
      <Card title="Ajouter un service" className="mt-8">
        <form action={createFacility} className="space-y-4">
          <FacilityFields />
          <SubmitButton>Ajouter</SubmitButton>
        </form>
      </Card>
    </>
  );
}
