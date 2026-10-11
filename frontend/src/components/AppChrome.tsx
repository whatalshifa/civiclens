import Link from "next/link";
import { Suspense } from "react";

import { BarTop } from "@/components/Bar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NavProgress } from "@/components/NavProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ThemeSwitch } from "@/components/ThemeSwitch";

/**
 * The frame around every page of the service (not the landing page): the solid dark-teal bar with
 * the service's tabs on it, the beta line and breadcrumbs, and the data-portal footer. The emblem
 * goes to the service's home, /services; "About" goes back to the landing page.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="caps sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-signal focus:px-3 focus:py-2 focus:text-signal-ink"
      >
        Skip to content
      </a>
      <header className="bg-header text-header-ink print:hidden">
        <BarTop href="/services" label="CivicLens services home">
          <Link
            href="/"
            className="caps text-[0.9375rem] text-header-ink underline-offset-4 hover:underline focus-visible:outline-header-ink"
          >
            About
          </Link>
          <ThemeSwitch />
        </BarTop>
        <SiteNav />
      </header>
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 print:hidden">
        <p className="flex items-start gap-2.5 border-b-2 border-rule py-3 text-sm">
            <strong className="caps mt-px shrink-0 bg-signal px-1.5 py-0.5 text-[0.75rem] leading-tight text-signal-ink">
              Beta
            </strong>
            <span className="text-muted">
              An independent public-interest service, not a government website.{" "}
              <a href="https://github.com/whatalshifa/civiclens/issues" className="link">
                Report a mistake
              </a>{" "}
              and we&apos;ll check it against the official record.
            </span>
        </p>
        <div className="mt-4 empty:hidden">
          <Breadcrumbs />
        </div>
      </div>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-20 sm:px-6 sm:pt-10 sm:pb-24">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
