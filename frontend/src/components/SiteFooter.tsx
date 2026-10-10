import Link from "next/link";

import { LogoMark } from "@/components/Logo";

const FOOTER: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Your representatives",
    links: [
      { href: "/services", label: "Find your MP and MLA" },
      { href: "/seats", label: "Every Lok Sabha seat" },
    ],
  },
  {
    heading: "Know your rights",
    links: [
      { href: "/laws", label: "Law library" },
      { href: "/laws/old-to-new", label: "Old to new sections" },
      { href: "/assistant", label: "Rights assistant" },
    ],
  },
  {
    heading: "Take action",
    links: [
      { href: "/rti", label: "RTI application" },
      { href: "/letters", label: "Letters" },
    ],
  },
  {
    heading: "About and data",
    links: [
      { href: "/", label: "About CivicLens" },
      { href: "/data", label: "Open data" },
      { href: "/accuracy", label: "Accuracy" },
      { href: "/#sources", label: "Sources" },
    ],
  },
];

/** The same footer under the landing page and every page of the service. `wide` matches the landing page's width. */
export function SiteFooter({ wide = false }: { wide?: boolean }) {
  return (
    <footer className="border-t-4 border-accent bg-sunken print:hidden">
      <div className={`mx-auto px-4 pt-10 pb-8 sm:px-6 ${wide ? "max-w-[75rem] lg:px-8" : "max-w-6xl"}`}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-8">
          {FOOTER.map((column) => (
            <div key={column.heading}>
              <h2 className="border-b border-line pb-2 text-base font-bold">{column.heading}</h2>
              <ul className="mt-3 space-y-2 text-[0.9375rem]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-foreground underline underline-offset-[3px] hover:decoration-2">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="flex items-start gap-3">
            <LogoMark className="h-8 w-8 shrink-0" />
            <p className="max-w-2xl">
              CivicLens is an independent project, not a government website, and does not give legal advice. Every
              fact links to its official source; please check there before relying on it. Data is released under its
              sources&apos; terms; code under the MIT licence.
            </p>
          </div>
          <a
            href="https://github.com/whatalshifa/civiclens"
            className="shrink-0 text-foreground underline underline-offset-[3px] hover:decoration-2"
          >
            Source code on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
