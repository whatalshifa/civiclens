import { Lock } from "lucide-react";

/** A plain browser window around a live render of a real page, with its address in the bar. */
export function BrowserFrame({
  path,
  label,
  children,
  className = "",
}: {
  path: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_60px_-24px_rgba(4,47,46,0.35)] ${className}`}>
      <div className="flex h-10 items-center gap-3 border-b border-line bg-sunken px-3.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 font-mono text-[0.75rem] text-muted">
          <Lock aria-hidden className="h-3 w-3 shrink-0" />
          <span className="truncate">civiclens{path}</span>
        </span>
      </div>
      <div role="region" aria-label={label} tabIndex={0} className="max-h-[34rem] overflow-y-auto overscroll-contain sm:max-h-[40rem]">
        {children}
        {/* A fade at the foot, so it's clear the page carries on below. */}
        <div aria-hidden className="pointer-events-none sticky bottom-0 -mt-16 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
