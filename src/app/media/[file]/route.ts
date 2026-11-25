import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/server/db";

// Only "<24 hex chars>-<width>.webp" can ever be served: no path traversal possible.
const NAME_RE = /^[a-f0-9]{24}-\d{2,4}\.webp$/;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!NAME_RE.test(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        // File names are random and never reused, so they can be cached forever.
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(data.byteLength),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
