import Link from "next/link";

import { Logo } from "@/components/Logo";

/**
 * The top of the solid dark-teal bar, shared by the landing page and the service: the emblem and
 * wordmark on the left, controls on the right. Tabs sit on a deeper strip below it (BarTabs).
 */
export function BarTop({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
      <Link href={href} aria-label={label} className="-m-1 p-1 focus-visible:outline-header-ink">
        <Logo tone="bar" />
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">{children}</div>
    </div>
  );
}

/** One tab on the deep strip. The current one is cut out of the bar in the page's own colour. */
export function tabClass(active: boolean) {
  return `caps flex h-12 items-center px-4 text-[0.875rem] whitespace-nowrap transition-colors ${
    active
      ? "border-t-4 border-signal bg-background text-foreground"
      : "border-t-4 border-transparent text-header-ink/90 hover:bg-white/10 hover:text-header-ink hover:underline underline-offset-4"
  }`;
}
