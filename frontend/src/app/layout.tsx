import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Public_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LogoMark, Logo } from "@/components/Logo";
import { NavProgress } from "@/components/NavProgress";
import { SiteNav } from "@/components/SiteNav";
import { THEME_SCRIPT, ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

// Public Sans was drawn for government websites, so it suits civic text: it sets everything,
// headings included. JetBrains Mono is only for PIN codes and section numbers.
const sans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

// Pages are rendered per request from the API's data (cached for an hour in lib/api.ts), never at
// build time, so building doesn't need the API to be running.
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Enter your PIN code to see your MP and MLA, and read the laws that protect you in plain language. Strictly nonpartisan: every fact links to its official source.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "CivicLens: know who represents you and what your rights are",
    template: "%s · CivicLens",
  },
  description: DESCRIPTION,
  applicationName: "CivicLens",
  openGraph: {
    type: "website",
    siteName: "CivicLens",
    title: "CivicLens: know who represents you and what your rights are",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b3a36" },
    { media: "(prefers-color-scheme: dark)", color: "#08221f" },
  ],
};

const FOOTER: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Your representatives",
    links: [
      { href: "/", label: "Find your MP and MLA" },
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
    heading: "Data",
    links: [
      { href: "/data", label: "Open data" },
      { href: "/accuracy", label: "Accuracy" },
      { href: "/about#sources", label: "Sources" },
    ],
  },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="bg-header text-white print:hidden">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[3.75rem] sm:px-6">
            <Link
              href="/"
              aria-label="CivicLens home"
              className="rounded-sm text-white hover:underline focus-visible:outline-white"
            >
              <Logo inverse />
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/about"
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
        <footer className="border-t-4 border-accent bg-sunken print:hidden">
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6">
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
                  CivicLens is not a government website and does not give legal advice. Every fact links to its
                  official source; please check there before relying on it. Data is released under its sources&apos;
                  terms; code under the MIT licence.
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
      </body>
    </html>
  );
}
