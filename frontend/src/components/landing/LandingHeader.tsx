import Link from "next/link";

import { BarTop, tabClass } from "@/components/Bar";
import { IconArrow } from "@/components/icons";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { formatDate } from "@/lib/format";

const LINKS = [
  { href: "#rights", label: "Your rights" },
  { href: "#letters", label: "Letters" },
  { href: "#neutral", label: "How we work" },
  { href: "#data", label: "Open data" },
];

/**
 * The landing page's bar: the same solid dark-teal bar as the service, with this page's sections as
 * tabs (the overview tab cut out in the page colour), then the amber notice strip.
 */
export function LandingHeader({ updated }: { updated?: string }) {
  return (
    <header className="bg-header text-header-ink print:hidden">
      <BarTop href="/" label="CivicLens home">
        <ThemeSwitch className="max-[350px]:hidden" />
        <Link href="/services" className="btn btn-signal h-10 px-2.5 sm:px-4">
          Open<span className="max-sm:sr-only"> the app</span>
          <IconArrow className="h-4 w-4" />
        </Link>
      </BarTop>
      <nav aria-label="On this page" className="hidden bg-header-deep md:block">
        <ul className="mx-auto flex max-w-6xl px-4 sm:px-6">
          <li>
            <a href="#main" aria-current="page" className={tabClass(true)}>
              Overview
            </a>
          </li>
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={tabClass(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="relative bg-signal text-signal-ink">
        <div aria-hidden className="hatch absolute inset-y-0 left-0 w-3 opacity-90 sm:w-5" />
        <p className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 pr-4 pl-7 text-[0.875rem] sm:px-6 sm:pl-10 lg:pl-6">
          <strong className="caps text-[0.8125rem]">Notice</strong>
          <span>Independent and nonpartisan. Not a government website.</span>
          {updated && (
            <span className="font-mono text-[0.8125rem] max-sm:hidden">
              Record updated <time dateTime={updated}>{formatDate(updated)}</time>
            </span>
          )}
        </p>
      </div>
    </header>
  );
}
