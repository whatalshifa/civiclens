"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

/** Each item and the paths that count as being in its section, for the active state. */
const NAV: { href: string; label: string; match: string[] }[] = [
  { href: "/", label: "Find your MP and MLA", match: ["/pin", "/find"] },
  { href: "/seats", label: "Seats and MPs", match: ["/seats"] },
  { href: "/laws", label: "Law library", match: ["/laws"] },
  { href: "/assistant", label: "Rights assistant", match: ["/assistant", "/accuracy"] },
  { href: "/letters", label: "Letters and RTI", match: ["/letters", "/rti"] },
  { href: "/data", label: "Open data", match: ["/data"] },
];

function isActive(item: (typeof NAV)[number], path: string) {
  if (item.href === "/" && path === "/") return true;
  return item.match.some((m) => path === m || path.startsWith(`${m}/`));
}

/**
 * The service navigation bar under the dark header, after GOV.UK's service navigation: one row of
 * plain links on wide screens, the current section underlined. On a phone it folds into a "Menu"
 * button that opens the same links as a list in the page flow (not an overlay), so nothing is hidden.
 */
export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();

  // Close the phone menu after moving to another page.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [path]);

  return (
    <nav aria-label="Main" className="border-b border-line bg-servicebar print:hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <button
          type="button"
          className="flex h-12 items-center gap-1 text-[0.9375rem] font-bold text-accent underline underline-offset-4 md:hidden"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
        >
          Menu
          {open ? <ChevronUp aria-hidden className="h-4 w-4" /> : <ChevronDown aria-hidden className="h-4 w-4" />}
        </button>
        <ul
          id={listId}
          className={`${open ? "block" : "hidden"} pb-2 md:flex md:flex-wrap md:gap-x-7 md:pb-0`}
        >
          {NAV.map((item) => {
            const active = isActive(item, path);
            return (
              <li key={item.href} className="md:flex">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center border-l-4 pl-3 text-[0.9375rem] md:-mb-px md:h-[3.25rem] md:border-b-4 md:border-l-0 md:pl-0 ${
                    active
                      ? "border-accent font-bold text-foreground"
                      : "border-transparent font-medium text-accent underline-offset-4 hover:underline md:hover:border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
