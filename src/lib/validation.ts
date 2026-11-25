import { z } from "zod";
import { nightsBetween, todayInAlgiers } from "./format";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (s: string) => ISO_DATE.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));

/** Removes control characters (keeps line breaks) and trims. */
export const clean = (s: string) => s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim();

export const phoneSchema = z
  .string()
  .transform(clean)
  .refine((v) => /^\+?[\d\s().-]{8,22}$/.test(v), "phone")
  .refine((v) => {
    const digits = v.replace(/\D/g, "").length;
    return digits >= 9 && digits <= 15;
  }, "phone");

export const MAX_NIGHTS = 60;

export const bookingSchema = z
  .object({
    fullName: z.string().transform(clean).pipe(z.string().min(2, "name").max(80, "name")),
    phone: phoneSchema,
    arrival: z.string().refine(isRealDate, "arrival"),
    departure: z.string().refine(isRealDate, "departure"),
    room: z.string().max(80).regex(/^[a-z0-9-]*$/, "room"),
    guests: z.coerce.number({ message: "guests" }).int("guests").min(1, "guests").max(20, "guests"),
    message: z.string().transform(clean).pipe(z.string().max(1000, "message")),
    consent: z.literal("on", { message: "consent" }),
  })
  .superRefine((v, ctx) => {
    if (v.arrival < todayInAlgiers()) ctx.addIssue({ code: "custom", path: ["arrival"], message: "arrival" });
    const n = nightsBetween(v.arrival, v.departure);
    if (!(n >= 1 && n <= MAX_NIGHTS)) ctx.addIssue({ code: "custom", path: ["departure"], message: "departure" });
  });

export const contactSchema = z.object({
  fullName: z.string().transform(clean).pipe(z.string().min(2, "name").max(80, "name")),
  replyTo: z
    .string()
    .transform(clean)
    .refine(
      (v) => z.email().safeParse(v).success || phoneSchema.safeParse(v).success,
      "replyTo",
    ),
  subject: z.string().transform(clean).pipe(z.string().max(120, "message")),
  message: z.string().transform(clean).pipe(z.string().min(10, "messageRequired").max(2000, "messageRequired")),
  consent: z.literal("on", { message: "consent" }),
});

/** Maps zod issues to { field: errorKey } using the issue message as a dictionary key. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
