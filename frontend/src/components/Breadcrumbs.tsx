"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconRight } from "@/components/icons";

/** The parent pages of each section: they name where you are, not the page itself. */
const PARENTS: { match: RegExp; trail: { href: string; label: string }[] }[] = [
  { match: /^\/(pin|find)(\/|$)/, trail: [{ href: "/services#find", label: "Find your MP and MLA" }] },
  { match: /^\/seats\/.+/, trail: [{ href: "/seats", label: "Seats and MPs" }] },
  { match: /^\/laws\/.+/, trail: [{ href: "/laws", label: "Law library" }] },
  { match: /^\/accuracy$/, trail: [{ href: "/assistant", label: "Rights assistant" }] },
  { match: /^\/rti\/.+/, trail: [{ href: "/letters", label: "Letters and RTI" }, { href: "/rti", label: "RTI application" }] },
  { match: /^\/(rti|letters\/.+)$/, trail: [{ href: "/letters", label: "Letters and RTI" }] },
];

export function Breadcrumbs() {
  const path = usePathname();
  if (path === "/services") return null;
  const trail = [{ href: "/services", label: "Home" }, ...(PARENTS.find((p) => p.match.test(path))?.trail ?? [])];
  return (
    <nav aria-label="Breadcrumb" className="print:hidden">
      <ol className="flex flex-wrap items-center gap-y-1 text-sm font-semibold">
        {trail.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center">
            {i > 0 && <IconRight className="mx-2 h-2.5 w-2.5 text-accent" />}
            <Link href={crumb.href} className="text-foreground underline decoration-2 underline-offset-[3px] hover:text-accent">
              {crumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
