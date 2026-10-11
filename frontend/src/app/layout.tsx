import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";

import { THEME_SCRIPT } from "@/components/ThemeSwitch";
import "./globals.css";

// Archivo, with its width axis: condensed and heavy for headings, tabs and buttons, like public
// signage; normal width for reading. JetBrains Mono is only for numbers and data.
const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
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
