import type { Metadata } from "next";
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
        <p className="eyebrow">Letters</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Letters you can send</h1>
        <p className="mt-4 text-muted">
          Fill in a short form and the letter is written as you type, in English or Hindi, citing the law it relies on.
          Everything you type stays in your browser.
        </p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {LETTERS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="card block h-full p-5 transition-colors hover:bg-sunken sm:p-6">
              <h2 className="text-lg font-semibold">{l.title}</h2>
              <p className="mt-2 text-sm text-muted">{l.what}</p>
              <p className="mt-3 text-xs text-muted">{l.law}</p>
            </Link>
          </li>
        ))}
      </ul>
      <FreeHelp className="mt-10" />
    </div>
  );
}
