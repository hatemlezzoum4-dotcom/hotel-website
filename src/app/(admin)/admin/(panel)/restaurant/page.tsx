import { saveRestaurant } from "../../_actions/content";
import { SubmitButton } from "@/components/admin/buttons";
import { Bilingual, Card, Check, Field, Flash, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/server/auth";
import { getRestaurant } from "@/lib/server/repo";

export const metadata = { title: "Restaurant" };

export default async function RestaurantAdmin({ searchParams }: PageProps<"/admin/restaurant">) {
  await requireUser();
  const sp = await searchParams;
  const r = getRestaurant();
  const blank = { name: { fr: "", ar: "" }, description: { fr: "", ar: "" }, priceDzd: null };
  const rows = [...r.menu, blank, blank, blank];
  return (
    <>
      <PageHeader title="Restaurant et buffet" text="Les horaires et la carte ne sont affichés sur le site qu’une fois la case « confirmé » cochée." />
      <Flash ok={sp.ok} error={sp.error} />
      <form action={saveRestaurant} className="space-y-6">
        <input type="hidden" name="menuCount" value={rows.length} />
        <Card title="Présentation et horaires">
          <div className="space-y-5">
            <Bilingual label="Description" name="description" value={r.description} textarea rows={4} maxLength={3000} />
            <Bilingual label="Horaires du restaurant" name="hours" value={r.hours} hint="Ex. : Déjeuner 12h–15h · Dîner 19h–22h" maxLength={300} />
            <Bilingual label="Horaires du petit-déjeuner" name="breakfastHours" value={r.breakfastHours} maxLength={300} />
          </div>
        </Card>
        <Card title="Carte / menus">
          <p className="mb-4 text-sm text-muted">Laissez une ligne vide pour l’ignorer. Trois lignes vides sont proposées à chaque enregistrement.</p>
          <div className="space-y-6">
            {rows.map((m, i) => (
              <fieldset key={i} className="space-y-3 border-t border-ivory-200 pt-4 first:border-0 first:pt-0">
                <legend className="sr-only">Plat {i + 1}</legend>
                <Bilingual label={`Plat ${i + 1}`} name={`menu${i}_name`} value={m.name} maxLength={120} />
                <Bilingual label="Description" name={`menu${i}_description`} value={m.description} maxLength={300} />
                <div className="flex flex-wrap items-end gap-6">
                  <div className="w-48"><Field label="Prix (DZD)" name={`menu${i}_price`} type="number" min={0} defaultValue={m.priceDzd} /></div>
                  {i < r.menu.length && <Check label="Retirer ce plat" name={`menu${i}_delete`} />}
                </div>
              </fieldset>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Check label="Horaires et carte confirmés par l’hôtel" name="confirmed" defaultChecked={r.confirmed} hint="Décoché : le site affiche « À confirmer » à la place." />
            <SubmitButton>Enregistrer</SubmitButton>
          </div>
        </Card>
      </form>
    </>
  );
}
