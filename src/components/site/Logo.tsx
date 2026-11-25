export default function Logo({ name, place, className = "" }: { name: string; place: string; className?: string }) {
  return (
    <span className={"flex items-center gap-3 " + className}>
      <svg viewBox="0 0 44 44" className="h-10 w-10 shrink-0 text-gold-400" aria-hidden="true">
        <path d="M22 2 42 22 22 42 2 22Z" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M22 7 37 22 22 37 7 22Z" fill="none" stroke="currentColor" strokeWidth="0.6" opacity=".6" />
        <text x="22" y="26.5" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="13" fill="currentColor" letterSpacing="1">
          ES
        </text>
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] tracking-wide">{name}</span>
        <span className="mt-1 text-[0.62rem] uppercase tracking-[0.3em] text-gold-300/90 rtl:tracking-normal rtl:text-[0.75rem]">
          {place}
        </span>
      </span>
    </span>
  );
}
