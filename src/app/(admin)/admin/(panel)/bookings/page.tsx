import Link from "next/link";
import { removeBooking, updateBookingStatus } from "../../_actions/content";
import { ConfirmButton, SubmitButton } from "@/components/admin/buttons";
import { BOOKING_LABELS, Badge, Card, Flash, PageHeader } from "@/components/admin/ui";
import Icon from "@/components/ui/Icon";
import { formatDate, nightsBetween, telHref } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { countBookingsByStatus, listBookings } from "@/lib/server/repo";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";
import { guestWaNumber } from "@/lib/whatsapp";

export const metadata = { title: "Demandes de réservation" };

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireUser();
  const sp = await searchParams;
  const status = BOOKING_STATUSES.includes(sp.status as BookingStatus) ? (sp.status as BookingStatus) : undefined;
  const list = listBookings(status);
  const counts = countBookingsByStatus();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const back = status ? `/admin/bookings?status=${status}` : "/admin/bookings";

  return (
    <>
      <PageHeader
        title="Demandes de réservation"
        text="Demandes envoyées depuis le site. Elles ne sont pas des réservations : vérifiez la disponibilité, contactez le client, puis mettez à jour le statut."
      />
      <Flash ok={sp.ok} error={sp.error} />
      <nav aria-label="Filtrer par statut" className="mb-6 flex flex-wrap gap-2">
        {[["", `Toutes (${total})`], ...BOOKING_STATUSES.map((s) => [s, `${BOOKING_LABELS[s][0]} (${counts[s]})`])].map(([k, label]) => (
          <Link
            key={k}
            href={k ? `/admin/bookings?status=${k}` : "/admin/bookings"}
            aria-current={(status ?? "") === k ? "page" : undefined}
            className="rounded-full border border-ivory-300 bg-white px-4 py-1.5 text-sm aria-[current=page]:border-forest-900 aria-[current=page]:bg-forest-900 aria-[current=page]:text-ivory-50"
          >
            {label}
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <Card><p className="text-muted">Aucune demande dans cette catégorie.</p></Card>
      ) : (
        <div className="space-y-4">
          {list.map((b) => {
            const wa = guestWaNumber(b.phone);
            const n = nightsBetween(b.arrival, b.departure);
            return (
              <Card key={b.id} className="scroll-mt-6">
                <div id={`b${b.id}`} className="grid gap-6 lg:grid-cols-5">
                  <div className="lg:col-span-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl text-forest-900">{b.fullName}</h2>
                      <Badge tone={BOOKING_LABELS[b.status][1]}>{BOOKING_LABELS[b.status][0]}</Badge>
                      <span className="text-sm text-muted">{b.ref} · reçue le {formatDate(b.createdAt.slice(0, 10))} à {b.createdAt.slice(11, 16)} UTC · {b.locale === "ar" ? "arabe" : "français"}</span>
                    </div>
                    <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div><dt className="inline text-muted">Arrivée : </dt><dd className="inline font-medium">{formatDate(b.arrival)}</dd></div>
                      <div><dt className="inline text-muted">Départ : </dt><dd className="inline font-medium">{formatDate(b.departure)} ({n} nuit{n > 1 ? "s" : ""})</dd></div>
                      <div><dt className="inline text-muted">Chambre : </dt><dd className="inline font-medium">{b.roomLabel}</dd></div>
                      <div><dt className="inline text-muted">Personnes : </dt><dd className="inline font-medium">{b.guests}</dd></div>
                      <div className="sm:col-span-2"><dt className="inline text-muted">Téléphone : </dt><dd className="inline font-medium">{b.phone}</dd></div>
                    </dl>
                    {b.message && <p className="mt-4 whitespace-pre-line border-s-2 border-gold-400 bg-ivory-100 px-4 py-3 text-sm">{b.message}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a href={telHref(b.phone)} className="btn btn-outline !min-h-[2.5rem] !px-4"><Icon name="phone" />Appeler</a>
                      {wa && (
                        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour ${b.fullName}, Hôtel El Sahel au sujet de votre demande ${b.ref}.`)}`}
                          target="_blank" rel="noopener noreferrer" className="btn btn-wa !min-h-[2.5rem] !px-4">
                          <Icon name="whatsapp" />WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                  <form action={updateBookingStatus} className="grid content-start gap-3 lg:col-span-2">
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="back" value={back} />
                    <label className="field">
                      <span className="field-label !text-[0.7rem]">Statut</span>
                      <select name="status" defaultValue={b.status} className="input !min-h-[2.75rem] !py-2">
                        {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_LABELS[s][0]}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label !text-[0.7rem]">Note interne</span>
                      <textarea name="staffNote" defaultValue={b.staffNote} rows={2} maxLength={2000} className="input !min-h-0 !py-2 text-sm" placeholder="Ex. : chambre 204 proposée, rappel demain…" />
                    </label>
                    <div className="flex items-center justify-between gap-3">
                      <SubmitButton>Mettre à jour</SubmitButton>
                    </div>
                  </form>
                </div>
                <form action={removeBooking} className="mt-4 border-t border-ivory-200 pt-3 text-end">
                  <input type="hidden" name="id" value={b.id} />
                  <ConfirmButton message={`Supprimer définitivement la demande ${b.ref} ?`}>Supprimer</ConfirmButton>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
