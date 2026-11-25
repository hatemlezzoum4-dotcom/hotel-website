import Icon from "@/components/ui/Icon";
import { waLink } from "@/lib/whatsapp";

export default function WhatsAppFloat({ number, label, text }: { number: string; label: string; text: string }) {
  const href = waLink(number, text);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group fixed bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f7a4d] text-3xl text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,.45)] transition-transform duration-500 hover:scale-105 ltr:right-5 rtl:left-5"
    >
      <span className="absolute inset-0 rounded-full border border-[#1f7a4d] opacity-60 motion-safe:animate-ping [animation-duration:3s]" aria-hidden="true" />
      <Icon name="whatsapp" />
    </a>
  );
}
