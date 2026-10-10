import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/Logo";
import { NavProgress } from "@/components/NavProgress";
import { THEME_SCRIPT, ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

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
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f14" },
  ],
};

const NAV: { href: string; label: string; wide?: boolean }[] = [
  { href: "/", label: "Representatives" },
  { href: "/seats", label: "Seats", wide: true },
  { href: "/laws", label: "Laws" },
  { href: "/assistant", label: "Ask" },
  { href: "/rti", label: "RTI" },
  { href: "/about", label: "About", wide: true },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${GeistSans.variable} h-full antialiased`} suppressHydrationWarning>
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
        <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur print:hidden">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
            <Link href="/" aria-label="CivicLens home">
              <Logo />
            </Link>
            <nav aria-label="Main" className="flex items-center gap-0.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`btn btn-ghost btn-sm ${item.href === "/" || item.wide ? "hidden sm:inline-flex" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-line print:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl">
              CivicLens is independent and nonpartisan. It is not a government website and does not give legal advice.
              Every fact links to its official source; please check there before relying on it.
            </p>
            <div className="flex gap-4">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/about#sources" className="hover:text-foreground">
                Sources
              </Link>
              <Link href="/accuracy" className="hover:text-foreground">
                Accuracy
              </Link>
              <a href="https://github.com/whatalshifa/civiclens" className="hover:text-foreground">
                Source code
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
