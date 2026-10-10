import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "#rights", label: "Your rights" },
  { href: "#letters", label: "Letters" },
  { href: "#neutral", label: "How we work" },
  { href: "#data", label: "Open data" },
];

/** The landing page's own header: lighter than the service frame, with one way into the service. */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 print:hidden">
      <div className="mx-auto flex h-16 max-w-[75rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="CivicLens home" className="rounded-sm text-foreground">
          <Logo />
        </Link>
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[0.9375rem] font-medium">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-foreground/80 underline-offset-[6px] hover:text-foreground hover:underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <Link href="/services" className="btn btn-primary h-10 px-3.5 sm:px-4">
            Open the app
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </header>
  );
}
