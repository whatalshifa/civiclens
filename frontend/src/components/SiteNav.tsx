"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { tabClass } from "@/components/Bar";
import { IconDown, IconUp } from "@/components/icons";

/** Each item and the paths that count as being in its section, for the active tab. */
const NAV: { href: string; label: string; match: string[] }[] = [
  { href: "/services", label: "Find your MP and MLA", match: ["/services", "/pin", "/find"] },
  { href: "/seats", label: "Seats and MPs", match: ["/seats"] },
  { href: "/laws", label: "Law library", match: ["/laws"] },
  { href: "/assistant", label: "Rights assistant", match: ["/assistant", "/accuracy"] },
  { href: "/letters", label: "Letters and RTI", match: ["/letters", "/rti"] },
  { href: "/data", label: "Open data", match: ["/data"] },
];

function isActive(item: (typeof NAV)[number], path: string) {
  return item.match.some((m) => path === m || path.startsWith(`${m}/`));
}

/**
 * The service's tabs, on the deep strip at the foot of the bar. The current section's tab is cut
 * out of the bar in the page colour, so the page reads as hanging from it. On a phone the tabs fold
 * into a "Menu" button that opens the same links as a list in the page flow (not an overlay).
 */
export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();

  // Close the phone menu after moving to another page.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [path]);

  const current = NAV.find((item) => isActive(item, path));

  return (
    <nav aria-label="Main" className="bg-header-deep print:hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <button
          type="button"
          className="caps flex h-12 w-full items-center justify-between gap-2 text-[0.9375rem] text-header-ink md:hidden"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="flex items-center gap-2">
            {open ? <IconUp className="h-3.5 w-3.5 text-signal" /> : <IconDown className="h-3.5 w-3.5 text-signal" />}
            Menu
          </span>
          {current && <span aria-hidden className="truncate text-header-muted">{current.label}</span>}
        </button>
        <ul id={listId} className={`${open ? "block" : "hidden"} pb-3 md:flex md:pb-0`}>
          {NAV.map((item) => {
            const active = isActive(item, path);
            return (
              <li key={item.href} className="max-md:border-t max-md:border-white/15 md:flex">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${tabClass(active)} max-md:h-12 max-md:border-t-0 max-md:border-l-[6px] ${active ? "max-md:border-signal" : "max-md:border-transparent"}`}
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
