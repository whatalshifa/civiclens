import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Public_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/Logo";
import { NavProgress } from "@/components/NavProgress";
import { SiteNav } from "@/components/SiteNav";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1211" },
  ],
};

const FOOTER: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Find",
    links: [
      { href: "/", label: "Your representatives" },
      { href: "/seats", label: "Every Lok Sabha seat" },
      { href: "/laws", label: "Law library" },
      { href: "/laws/old-to-new", label: "Old to new sections" },
    ],
  },
  {
    heading: "Act",
    links: [
      { href: "/assistant", label: "Rights assistant" },
      { href: "/rti", label: "RTI application" },
      { href: "/letters", label: "Letters" },
    ],
  },
  {
    heading: "CivicLens",
    links: [
      { href: "/about", label: "About" },
      { href: "/about#sources", label: "Sources" },
      { href: "/accuracy", label: "Accuracy" },
      { href: "/data", label: "Open data" },
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
        <header className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur print:hidden">
          <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" aria-label="CivicLens home" className="rounded-lg">
              <Logo />
            </Link>
            <SiteNav />
          </div>
        </header>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-20 sm:px-6 sm:pt-14 sm:pb-24">
          {children}
        </main>
        <footer className="border-t border-line bg-sunken print:hidden">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div className="max-w-xs">
              <Logo />
              <p className="mt-3 text-sm text-muted">
                Who represents you, and what the law says, from official records. Independent and nonpartisan.
              </p>
            </div>
            {FOOTER.map((column) => (
              <div key={column.heading}>
                <h2 className="text-sm font-semibold">{column.heading}</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted hover:text-foreground hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:justify-between sm:gap-6 sm:px-6">
              <p className="max-w-2xl">
                CivicLens is not a government website and does not give legal advice. Every fact links to its official
                source; please check there before relying on it.
              </p>
              <a href="https://github.com/whatalshifa/civiclens" className="shrink-0 hover:text-foreground hover:underline">
                Source code on GitHub
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
