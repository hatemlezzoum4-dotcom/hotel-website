/** Widths generated for every uploaded photo. Shared by the server (generation) and the UI (srcset). */
export const VARIANT_WIDTHS = [480, 960, 1600] as const;

export function variantWidths(originalWidth: number): number[] {
  const out: number[] = VARIANT_WIDTHS.filter((w) => w < originalWidth);
  out.push(Math.min(originalWidth, VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1]));
  return [...new Set(out)];
}

export const mediaUrl = (fileKey: string, width: number) => `/media/${fileKey}-${width}.webp`;

export function srcSet(fileKey: string, originalWidth: number) {
  return variantWidths(originalWidth)
    .map((w) => `${mediaUrl(fileKey, w)} ${w}w`)
    .join(", ");
}

export const FILE_KEY_RE = /^[a-f0-9]{24}$/;
