import "server-only";
import sharp from "sharp";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "./db";
import { VARIANT_WIDTHS, variantWidths } from "@/lib/media";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 60_000_000;

export class ImageError extends Error {}

/**
 * Decodes an untrusted image, normalises orientation, strips all metadata (EXIF/GPS),
 * and writes optimised WebP variants. Anything sharp cannot decode is rejected.
 */
export async function processImage(input: Buffer) {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new ImageError("Image trop lourde (10 Mo maximum).");
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new ImageError("Fichier non reconnu comme une image valide.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "avif", "heif", "tiff"].includes(meta.format)) {
    throw new ImageError("Format non pris en charge (JPEG, PNG, WebP, AVIF ou HEIC).");
  }
  const base = sharp(input, { limitInputPixels: MAX_PIXELS }).rotate();
  const { info } = await base.clone().toBuffer({ resolveWithObject: true });
  const width = Math.min(info.width, VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1]);
  const height = Math.round((info.height * width) / info.width);

  const fileKey = crypto.randomBytes(12).toString("hex");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  for (const w of variantWidths(info.width)) {
    await base
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(path.join(UPLOAD_DIR, `${fileKey}-${w}.webp`));
  }
  const tiny = await base.clone().resize({ width: 16 }).blur(1).webp({ quality: 40 }).toBuffer();
  return { fileKey, width, height, blur: `data:image/webp;base64,${tiny.toString("base64")}` };
}

export async function deleteImageFiles(fileKey: string) {
  const files = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[]);
  await Promise.all(
    files.filter((f) => f.startsWith(fileKey + "-")).map((f) => fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => {})),
  );
}
