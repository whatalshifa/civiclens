import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Logo } from "@/components/Logo";
import { NavProgress } from "@/components/NavProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * The frame around every page of the service (not the landing page): the dark service header, the
 * navigation bar, the beta notice and breadcrumbs, and the shared footer. The logo goes to the
 * service's home, /services; "About" goes back to the landing page.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="bg-header text-white print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[3.75rem] sm:px-6">
          <Link
            href="/services"
            aria-label="CivicLens services home"
            className="rounded-sm text-white hover:underline focus-visible:outline-white"
          >
            <Logo inverse />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="text-[0.9375rem] font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-white"
            >
              About
            </Link>
            <ThemeToggle className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-white/90 hover:bg-white/10 hover:text-white focus-visible:outline-white" />
          </div>
        </div>
        <div className="h-1.5 bg-header-stripe" />
      </header>
      <SiteNav />
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 print:hidden">
        <p className="flex items-start gap-3 border-b border-line py-2.5 text-sm">
          <strong className="mt-px shrink-0 bg-accent px-1.5 py-0.5 text-[0.75rem] leading-tight font-bold tracking-wide text-background uppercase">
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
        <Breadcrumbs />
      </div>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-20 sm:px-6 sm:pt-10 sm:pb-24">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
