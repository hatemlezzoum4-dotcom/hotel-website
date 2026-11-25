import Link from "next/link";
import { createRoom } from "../../../_actions/content";
import RoomForm from "@/components/admin/RoomForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/server/auth";

export const metadata = { title: "Nouvelle chambre" };

export default async function NewRoom({ searchParams }: PageProps<"/admin/rooms/new">) {
  await requireUser();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Nouvelle chambre" action={<Link href="/admin/rooms" className="link-lux">← Retour</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <RoomForm action={createRoom} />
    </>
  );
}
