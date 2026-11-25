"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/site/Logo";
import { logout } from "@/app/(admin)/admin/_actions/auth";

type Item = { href: string; label: string; icon: string; badge?: number };

export default function AdminNav({ items, user }: { items: Item[]; user: { name: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (h: string) => (h === "/admin" ? pathname === h : pathname === h || pathname.startsWith(h + "/"));

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-forest-950 px-4 py-3 text-ivory-50 lg:hidden">
        <Logo name="El Sahel" place="Gestion" />
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-nav" aria-label="Menu" className="grid h-11 w-11 place-items-center text-2xl">
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      <aside
        id="admin-nav"
        className={
          "pattern-lux fixed inset-y-0 start-0 z-50 flex w-72 flex-col text-ivory-100 transition-transform duration-300 lg:sticky lg:top-0 lg:h-[100svh] lg:translate-x-0 " +
          (open ? "translate-x-0 shadow-2xl" : "-translate-x-full")
        }
      >
        <div className="px-6 py-7">
          <Link href="/admin"><Logo name="El Sahel" place="Espace gestion" /></Link>
        </div>
        <nav aria-label="Administration" className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-0.5">
            {items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={active(i.href) ? "page" : undefined}
                  className={
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 transition-colors " +
                    (active(i.href) ? "bg-ivory-50/10 text-gold-300 shadow-[inset_3px_0_0_#c2a15a]" : "text-ivory-100/80 hover:bg-ivory-50/5 hover:text-ivory-50")
                  }
                >
                  <Icon name={i.icon} className="text-lg text-gold-400" />
                  <span className="flex-1">{i.label}</span>
                  {!!i.badge && <span className="rounded-full bg-gold-500 px-2 text-xs font-semibold text-forest-950">{i.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-ivory-50/10 px-6 py-5 text-sm">
          <p className="text-ivory-50">{user.name}</p>
          <p className="text-ivory-100/60">{user.role === "admin" ? "Administrateur" : "Éditeur"}</p>
          <div className="mt-3 flex items-center justify-between">
            <a href="/fr" target="_blank" rel="noopener" className="text-gold-300 hover:text-gold-200">Voir le site ↗</a>
            <form action={logout}>
              <button type="submit" className="text-ivory-100/80 hover:text-ivory-50">Déconnexion</button>
            </form>
          </div>
        </div>
      </aside>
      {open && <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-40 bg-forest-950/50 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
