import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: { default: "Gestion · Hôtel El Sahel", template: "%s · Gestion Hôtel El Sahel" },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="bg-ivory-100 text-[0.95rem]">{children}</body>
    </html>
  );
}
