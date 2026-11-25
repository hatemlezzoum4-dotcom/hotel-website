"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadPhoto } from "@/app/(admin)/admin/_actions/content";

type Row = { name: string; state: "waiting" | "uploading" | "done" | "error"; error?: string };
const CATS = [["hotel", "L’hôtel"], ["rooms", "Chambres"], ["restaurant", "Restaurant"], ["salon", "Salon"], ["facilities", "Espaces"]];

/** Uploads files one at a time (each under the 10 MB server limit) and shows per-file progress. */
export default function PhotoUploader({ rooms }: { rooms: { id: number; name: string }[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const files = Array.from((form.elements.namedItem("files") as HTMLInputElement).files ?? []);
    if (!files.length) return;
    setBusy(true);
    const list: Row[] = files.map((f) => ({ name: f.name, state: "waiting" }));
    setRows([...list]);
    for (let i = 0; i < files.length; i++) {
      list[i] = { ...list[i], state: "uploading" };
      setRows([...list]);
      const fd = new FormData(form);
      fd.delete("files");
      fd.set("file", files[i]);
      try {
        const r = await uploadPhoto(fd);
        list[i] = r.ok ? { ...list[i], state: "done" } : { ...list[i], state: "error", error: r.error };
      } catch {
        list[i] = { ...list[i], state: "error", error: "Envoi impossible (fichier trop lourd ou connexion interrompue)." };
      }
      setRows([...list]);
    }
    setBusy(false);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="field">
        <span className="field-label !text-[0.7rem]">Fichiers (JPEG, PNG, WebP, HEIC · 10 Mo max. chacun)</span>
        <input name="files" type="file" multiple required accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
          className="input !min-h-0 !py-2 text-sm file:me-4 file:border-0 file:bg-forest-900 file:px-4 file:py-2 file:text-ivory-50" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span className="field-label !text-[0.7rem]">Catégorie</span>
          <select name="category" className="input !min-h-[2.75rem] !py-2" defaultValue="hotel">
            {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label !text-[0.7rem]">Chambre (facultatif)</span>
          <select name="roomId" className="input !min-h-[2.75rem] !py-2" defaultValue="">
            <option value="">—</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label !text-[0.7rem]">Description · Français</span>
          <input name="alt_fr" maxLength={200} className="input !min-h-[2.75rem] !py-2" placeholder="Décrit la photo (accessibilité, SEO)" />
        </label>
        <label className="field">
          <span className="field-label !text-[0.7rem]">Description · العربية</span>
          <input name="alt_ar" dir="rtl" maxLength={200} className="input !min-h-[2.75rem] !py-2" />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="inGallery" defaultChecked className="h-4 w-4 accent-forest-800" /> Afficher dans la galerie
      </label>
      <p className="text-xs text-muted">Les photos sont automatiquement redimensionnées, converties en WebP et débarrassées de leurs métadonnées (GPS, appareil).</p>
      <button type="submit" disabled={busy} className="btn btn-forest !min-h-[2.75rem] justify-self-start">{busy ? "Envoi en cours…" : "Téléverser"}</button>
      {rows.length > 0 && (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {rows.map((r, i) => (
            <li key={i} className={r.state === "error" ? "text-[#a23a2a]" : r.state === "done" ? "text-forest-700" : "text-muted"}>
              {r.state === "done" ? "✓" : r.state === "error" ? "✕" : r.state === "uploading" ? "…" : "·"} {r.name}
              {r.error && ` — ${r.error}`}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
