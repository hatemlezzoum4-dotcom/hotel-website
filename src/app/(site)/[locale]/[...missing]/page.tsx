import { notFound } from "next/navigation";

/** Unknown URLs under /fr or /ar render the localised 404 page. */
export default function Missing() {
  notFound();
}
