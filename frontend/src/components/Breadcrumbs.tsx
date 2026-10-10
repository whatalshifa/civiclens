"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** The parent pages of each section, after GOV.UK breadcrumbs: they name where you are, not the page itself. */
const PARENTS: { match: RegExp; trail: { href: string; label: string }[] }[] = [
  { match: /^\/(pin|find)(\/|$)/, trail: [{ href: "/", label: "Find your MP and MLA" }] },
  { match: /^\/seats\/.+/, trail: [{ href: "/seats", label: "Seats and MPs" }] },
  { match: /^\/laws\/.+/, trail: [{ href: "/laws", label: "Law library" }] },
  { match: /^\/accuracy$/, trail: [{ href: "/assistant", label: "Rights assistant" }] },
  { match: /^\/rti\/.+/, trail: [{ href: "/letters", label: "Letters and RTI" }, { href: "/rti", label: "RTI application" }] },
  { match: /^\/(rti|letters\/.+)$/, trail: [{ href: "/letters", label: "Letters and RTI" }] },
];

export function Breadcrumbs() {
  const path = usePathname();
  if (path === "/") return null;
  const trail = [{ href: "/", label: "Home" }, ...(PARENTS.find((p) => p.match.test(path))?.trail ?? [])];
  return (
    <nav aria-label="Breadcrumb" className="mt-3 print:hidden">
      <ol className="flex flex-wrap items-center gap-y-1 text-sm">
        {trail.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center">
            {i > 0 && <ChevronRight aria-hidden className="mx-1.5 h-3.5 w-3.5 text-muted" />}
            <Link href={crumb.href} className="text-foreground underline underline-offset-[3px] hover:decoration-2">
              {crumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
