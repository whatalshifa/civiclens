/** The CivicLens mark: a lens over three pillars, for looking closely at public institutions. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="2" className="fill-teal-800" />
      <circle cx="14.5" cy="14.5" r="7.5" fill="none" stroke="white" strokeWidth="2.2" />
      <path d="M20 20l5.5 5.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11 11.6h7" stroke="#99f6e4" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 13.5v4M14.5 13.5v4M17 13.5v4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2 sm:gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.15rem] leading-none sm:text-[1.4rem] font-extrabold tracking-tight uppercase [font-stretch:75%]">
        Civic<span className="text-accent">Lens</span>
      </span>
    </span>
  );
}
