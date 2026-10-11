import { IconLock } from "@/components/icons";

/** A live render of a real page, framed like a screen on a public display: a dark title strip with its address. */
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
    <div className={`border-2 border-rule bg-surface shadow-[8px_8px_0_var(--shadow)] ${className}`}>
      <div className="flex h-10 items-center gap-3 bg-rule px-3 text-background">
        <span className="caps shrink-0 bg-signal px-1.5 py-0.5 text-[0.6875rem] leading-tight text-signal-ink">Live page</span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[0.75rem]">
          <IconLock className="h-3 w-3 shrink-0" />
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
