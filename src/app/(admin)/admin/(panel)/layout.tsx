import AdminNav from "@/components/admin/AdminNav";
import { requireUser } from "@/lib/server/auth";
import { countBookingsByStatus, countNewMessages } from "@/lib/server/repo";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = [
    { href: "/admin", label: "Tableau de bord", icon: "star" },
    { href: "/admin/bookings", label: "Demandes de réservation", icon: "calendar", badge: countBookingsByStatus().new },
    { href: "/admin/messages", label: "Messages", icon: "mail", badge: countNewMessages() },
    { href: "/admin/rooms", label: "Chambres et tarifs", icon: "bed" },
    { href: "/admin/photos", label: "Photos", icon: "expand" },
    { href: "/admin/restaurant", label: "Restaurant", icon: "utensils" },
    { href: "/admin/salon", label: "Salon", icon: "sofa" },
    { href: "/admin/facilities", label: "Services", icon: "bell" },
    { href: "/admin/settings", label: "Coordonnées et accueil", icon: "pin" },
    { href: "/admin/account", label: user.role === "admin" ? "Comptes et sécurité" : "Mon compte", icon: "users" },
  ];
  return (
    <div className="lg:flex">
      <AdminNav items={items} user={{ name: user.name, role: user.role }} />
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
