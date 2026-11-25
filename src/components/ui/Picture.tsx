import { mediaUrl, srcSet, variantWidths } from "@/lib/media";
import type { Photo } from "@/lib/types";

type Props = {
  photo: Photo;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Fill the parent (absolute, object-cover). */
  fill?: boolean;
};

/** Responsive WebP image with srcset and an inline blurred preview while loading. */
export default function Picture({ photo, alt, sizes, className = "", priority, fill }: Props) {
  const widths = variantWidths(photo.width);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(photo.fileKey, widths[Math.min(1, widths.length - 1)])}
      srcSet={srcSet(photo.fileKey, photo.width)}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={{ backgroundImage: `url(${photo.blur})`, backgroundSize: "cover", backgroundPosition: "center" }}
      className={(fill ? "absolute inset-0 h-full w-full object-cover " : "") + className}
    />
  );
}
