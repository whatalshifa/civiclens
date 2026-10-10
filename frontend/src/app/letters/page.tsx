import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { FreeHelp } from "@/components/FreeHelp";

export const metadata: Metadata = {
  title: "Letters you can send",
  description:
    "Free drafts of an RTI application, an RTI first appeal, a consumer complaint and a police complaint, in English or Hindi. Nothing you type leaves your browser.",
};

const LETTERS = [
  {
    href: "/rti",
    title: "RTI application",
    what: "Ask any government office for its records. It must reply within 30 days.",
    law: "RTI Act, 2005, Section 6",
  },
  {
    href: "/rti/appeal",
    title: "RTI first appeal",
    what: "No reply in 30 days, or a refusal without a good reason? Appeal to the senior officer.",
    law: "RTI Act, 2005, Section 19",
  },
  {
    href: "/letters/consumer",
    title: "Consumer complaint",
    what: "A faulty product or a bad service. Write to the seller before going to the Consumer Commission.",
    law: "Consumer Protection Act, 2019",
  },
  {
    href: "/letters/police",
    title: "Police complaint",
    what: "The police station won't register your FIR. Send the details to the Superintendent of Police.",
    law: "BNSS, 2023, Section 173(4)",
  },
];

export default function LettersPage() {
  return (
    <div>
      <div className="max-w-3xl">
        <h1 className="page-title">Letters you can send</h1>
        <p className="lede">
          Fill in a short form and the letter is written as you type, in English or Hindi, citing the law it relies on.
          Everything you type stays in your browser.
        </p>
      </div>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2">
        {LETTERS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="card-link group flex h-full flex-col p-6">
              <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold group-hover:text-accent">
                {l.title}
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </h2>
              <p className="mt-2 mb-4 text-[0.9375rem] text-muted">{l.what}</p>
              <p className="mt-auto text-[0.8125rem] text-muted">{l.law}</p>
            </Link>
          </li>
        ))}
      </ul>
      <FreeHelp className="mt-16" />
    </div>
  );
}
