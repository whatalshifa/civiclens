import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";

import { THEME_SCRIPT } from "@/components/ThemeSwitch";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/metadata";
import "./globals.css";

// Archivo, with its width axis: condensed and heavy for headings, tabs and buttons, like public
// signage; normal width for reading. JetBrains Mono is only for numbers and data.
const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

// Pages are rendered per request from the API's data (cached for an hour in lib/api.ts), never at
// build time, so building doesn't need the API to be running.
export const dynamic = "force-dynamic";

const TITLE = "CivicLens: know who represents you and what your rights are";
const DESCRIPTION =
  "Find your MP and MLA by constituency or PIN code, and read the laws that protect you in plain language. Strictly nonpartisan: every fact links to its official source.";

// The defaults for every page. Pages set their own title, description and canonical address
// through pageMetadata() (lib/metadata.ts); the canonical isn't set here, or every page would
// inherit the home page's.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · CivicLens" },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b3a36" },
    { media: "(prefers-color-scheme: dark)", color: "#0b2a27" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
