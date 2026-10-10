"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

/** Each item and the paths that count as being in its section, for the active state. */
const NAV: { href: string; label: string; match: string[] }[] = [
  { href: "/", label: "Representatives", match: ["/pin", "/find"] },
  { href: "/seats", label: "Seats", match: ["/seats"] },
  { href: "/laws", label: "Laws", match: ["/laws"] },
  { href: "/assistant", label: "Ask", match: ["/assistant", "/accuracy"] },
  { href: "/letters", label: "Letters", match: ["/letters", "/rti"] },
  { href: "/about", label: "About", match: ["/about", "/data"] },
];

function isActive(item: (typeof NAV)[number], path: string) {
  if (item.href === "/" && path === "/") return true;
  return item.match.some((m) => path === m || path.startsWith(`${m}/`));
}

/**
 * The main navigation. Wide screens show every item in the header; phones get a menu button that
 * opens a panel listing every item, so nothing is hidden.
 */
export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <nav aria-label="Main" className="flex items-center gap-1 self-stretch">
      <ul className="hidden items-stretch gap-1 self-stretch md:flex">
        {NAV.map((item) => {
          const active = isActive(item, path);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px flex items-center border-b-[3px] px-3 text-[0.9375rem] font-medium transition-colors ${
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:border-line hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="ml-1 flex items-center">
        <ThemeToggle />
      </div>
      <button
        ref={button}
        type="button"
        className="btn btn-ghost h-10 gap-1.5 px-3 text-foreground md:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        Menu
      </button>
      <div
        ref={panel}
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-background shadow-[0_8px_16px_-12px_rgb(0_0_0/0.25)] md:hidden"
      >
        <ul className="mx-auto max-w-6xl px-4 py-2">
          {NAV.map((item) => {
            const active = isActive(item, path);
            return (
              <li key={item.href} className="border-b border-line last:border-b-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`-mx-4 flex h-12 items-center border-l-4 px-4 text-base font-medium ${
                    active ? "border-accent text-foreground" : "border-transparent text-foreground hover:bg-sunken"
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
