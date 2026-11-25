"use server";
import { revalidatePath } from "next/cache";
import { clientIp, hit } from "@/lib/server/rate-limit";
import { insertMessage } from "@/lib/server/repo";
import { isLocale } from "@/lib/types";
import { contactSchema, fieldErrors } from "@/lib/validation";

export type ContactState = { status: "error"; errors: Record<string, string> } | { status: "success" };

export async function submitContact(formData: FormData): Promise<ContactState> {
  const locale = String(formData.get("locale"));
  if (!isLocale(locale)) return { status: "error", errors: { form: "server" } };
  if (String(formData.get("website") ?? "")) return { status: "error", errors: { form: "generic" } };

  const parsed = contactSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    replyTo: formData.get("replyTo") ?? "",
    subject: formData.get("subject") ?? "",
    message: formData.get("message") ?? "",
    consent: formData.get("consent") ?? "",
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };
  if (!hit("contact", await clientIp(), 5, 600)) return { status: "error", errors: { form: "rate" } };

  try {
    insertMessage({ ...parsed.data, locale });
  } catch (e) {
    console.error("contact insert failed", e);
    return { status: "error", errors: { form: "server" } };
  }
  revalidatePath("/admin", "layout");
  return { status: "success" };
}
