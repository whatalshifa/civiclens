/** The CivicLens mark: a lens over three pillars, for looking closely at public institutions. */
export function LogoMark({ className = "h-8 w-8", inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      {!inverse && <rect width="32" height="32" rx="6" className="fill-teal-800" />}
      <circle cx="14.5" cy="14.5" r="7.5" fill="none" stroke="white" strokeWidth="2.2" />
      <path d="M20 20l5.5 5.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11 11.6h7" stroke="#99f6e4" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 13.5v4M14.5 13.5v4M17 13.5v4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** `inverse` is the white logotype for the dark service header, in the manner of a government crest bar. */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className={inverse ? "h-8 w-8" : "h-7 w-7"} inverse={inverse} />
      <span className={`leading-none font-bold tracking-[-0.01em] ${inverse ? "text-[1.375rem]" : "text-lg"}`}>
        CivicLens
      </span>
    </span>
  );
}
