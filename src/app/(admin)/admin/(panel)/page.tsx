import Link from "next/link";
import { BOOKING_LABELS, Badge, Card, Flash, PageHeader } from "@/components/admin/ui";
import { formatDate, nightsBetween } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import * as repo from "@/lib/server/repo";

export const metadata = { title: "Tableau de bord" };

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const sp = await searchParams;
  const counts = repo.countBookingsByStatus();
  const s = repo.getSettings();
  const rooms = repo.listRooms();
  const r = repo.getRestaurant();
  const salon = repo.getSalon();
  const facilities = repo.listFacilities({ publishedOnly: true });
  const recent = repo.listBookings("new").slice(0, 6);
  const photos = repo.listPhotos().length;

  const todo: [boolean, string, string][] = [
    [s.contactConfirmed, "Adresse, téléphones et e-mail", "/admin/settings"],
    [s.whatsappConfirmed && !!s.whatsapp, "Numéro WhatsApp de réception des demandes", "/admin/settings"],
    [!!(s.checkIn && s.checkOut), "Heures d’arrivée et de départ", "/admin/settings"],
    ...rooms.map((x): [boolean, string, string] => [x.priceConfirmed && x.priceDzd != null, `Tarif : ${x.name.fr}`, `/admin/rooms/${x.id}`]),
    ...rooms.map((x): [boolean, string, string] => [x.detailsConfirmed && !!x.capacity && !!x.description.fr, `Description, capacité, équipements : ${x.name.fr}`, `/admin/rooms/${x.id}`]),
    ...rooms.map((x): [boolean, string, string] => [x.photos.length > 0, `Photos : ${x.name.fr}`, "/admin/photos"]),
    [r.confirmed, "Horaires et carte du restaurant", "/admin/restaurant"],
    [salon.confirmed, "Description et services du salon", "/admin/salon"],
    [facilities.every((f) => f.confirmed), "Liste des services affichés", "/admin/facilities"],
  ];
  const pending = todo.filter((t) => !t[0]);

  const stat = (label: string, n: number, href: string, tone = "text-forest-900") => (
    <Link href={href} className="rounded-sm border border-ivory-200 bg-white p-5 transition-shadow hover:shadow-lg">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={"mt-2 font-display text-4xl " + tone}>{n}</p>
    </Link>
  );

  return (
    <>
      <PageHeader title={`Bonjour, ${user.name}`} text="Vue d’ensemble des demandes reçues et des informations restant à valider avant la mise en ligne." />
      {sp.denied && <Flash error="Cette section est réservée aux administrateurs." />}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Nouvelles demandes", counts.new, "/admin/bookings?status=new", "text-gold-700")}
        {stat("Clients contactés", counts.contacted, "/admin/bookings?status=contacted")}
        {stat("Messages non lus", repo.countNewMessages(), "/admin/messages")}
        {stat("Photos en ligne", photos, "/admin/photos")}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        <Card title="Dernières demandes à traiter" className="xl:col-span-3">
          {recent.length === 0 ? (
            <p className="text-muted">Aucune nouvelle demande pour le moment.</p>
          ) : (
            <ul className="divide-y divide-ivory-200">
              {recent.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-forest-900">{b.fullName} <span className="text-sm text-muted">· {b.ref}</span></p>
                    <p className="text-sm text-muted">
                      {formatDate(b.arrival)} → {formatDate(b.departure)} ({nightsBetween(b.arrival, b.departure)} n.) · {b.roomLabel} · {b.guests} pers.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={BOOKING_LABELS[b.status][1]}>{BOOKING_LABELS[b.status][0]}</Badge>
                    <Link href={`/admin/bookings#b${b.id}`} className="text-sm text-gold-700 hover:underline">Traiter</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/bookings" className="link-lux mt-5">Toutes les demandes</Link>
        </Card>

        <Card title={`À confirmer avec l’hôtel (${pending.length})`} className="xl:col-span-2">
          {pending.length === 0 ? (
            <p className="text-forest-700">Toutes les informations publiées sont confirmées.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pending.map(([, label, href]) => (
                <li key={label} className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />{label}</span>
                  <Link href={href} className="shrink-0 text-gold-700 hover:underline">Modifier</Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 text-xs text-muted">
            Tant qu’une information n’est pas confirmée, le site public l’affiche avec la mention « À confirmer ».
          </p>
        </Card>
      </div>
    </>
  );
}
