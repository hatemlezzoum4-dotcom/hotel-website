import { saveSalon } from "../../_actions/content";
import { SubmitButton } from "@/components/admin/buttons";
import { Bilingual, Card, Check, Flash, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/server/auth";
import { getSalon } from "@/lib/server/repo";

export const metadata = { title: "Salon" };

export default async function SalonAdmin({ searchParams }: PageProps<"/admin/salon">) {
  await requireUser();
  const sp = await searchParams;
  const s = getSalon();
  return (
    <>
      <PageHeader title="Salon" text="Description, services et capacité du salon. Les photos se gèrent dans la photothèque (catégorie « Salon »)." />
      <Flash ok={sp.ok} error={sp.error} />
      <form action={saveSalon} className="space-y-6">
        <Card>
          <div className="space-y-5">
            <Bilingual label="Description" name="description" value={s.description} textarea rows={4} maxLength={3000} />
            <Bilingual label="Services proposés (un par ligne, même ordre en FR et AR)" name="services"
              value={{ fr: s.services.map((x) => x.fr).join("\n"), ar: s.services.map((x) => x.ar).join("\n") }} textarea rows={5} />
            <Bilingual label="Capacité" name="capacity" value={s.capacity} hint="Ex. : jusqu’à 40 personnes" maxLength={120} />
          </div>
        </Card>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Check label="Informations confirmées par l’hôtel" name="confirmed" defaultChecked={s.confirmed} />
            <SubmitButton>Enregistrer</SubmitButton>
          </div>
        </Card>
      </form>
    </>
  );
}
