import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import Logo from "@/components/site/Logo";
import { currentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  return (
    <main className="pattern-lux grid min-h-[100svh] place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center text-ivory-50">
          <Logo name="Hôtel El Sahel" place="Espace gestion" />
        </div>
        <div className="bg-ivory-50 p-8 shadow-2xl md:p-10">
          <h1 className="font-display text-3xl text-forest-900">Connexion</h1>
          <p className="mt-2 text-sm text-muted">Accès réservé à la direction et au personnel autorisé de l’hôtel.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm">
          <a href="/fr" className="text-gold-300 hover:text-gold-200">← Retour au site</a>
        </p>
      </div>
    </main>
  );
}
