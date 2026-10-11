import Link from "next/link";

/**
 * Views of one page as tabs, in the manner of the bar's own tabs: condensed capitals on a heavy
 * rule, the current one a solid plate. Each tab is a plain link (`?tab=`), so it works without
 * JavaScript, can be shared, and the back button returns to the last view.
 */
export function Tabs({
  label,
  tabs,
  current,
  className = "",
}: {
  label: string;
  tabs: { href: string; label: string; count?: number | string; id?: string }[];
  current: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`border-b-4 border-rule ${className}`}>
      <ul className="-mb-1 flex flex-wrap gap-x-1">
        {tabs.map((tab) => {
          const active = (tab.id ?? tab.href) === current;
          return (
            <li key={tab.href} className="flex">
              <Link
                href={tab.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={`caps flex min-h-11 items-center gap-2 border-2 border-b-4 px-3 text-[0.875rem] sm:px-4 sm:text-[0.9375rem] ${
                  active
                    ? "border-rule bg-rule text-background"
                    : "border-transparent text-foreground underline-offset-4 hover:bg-sunken hover:underline"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`font-mono text-[0.75rem] font-medium tracking-normal tabular-nums ${active ? "" : "text-muted"}`}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
