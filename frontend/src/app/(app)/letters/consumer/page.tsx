import type { Metadata } from "next";
import Link from "next/link";

import { IconDown } from "@/components/icons";
import { FreeHelp } from "@/components/FreeHelp";
import { ConsumerDrafter } from "@/components/letters/ConsumerDrafter";
import { todayInIndia } from "@/lib/letters";

export const metadata: Metadata = {
  title: "Draft a consumer complaint",
  description:
    "A faulty product or a bad service? Draft a written complaint to the seller under the Consumer Protection Act, 2019, in English or Hindi. Free, and nothing you type leaves your browser.",
};

const CPA = "/laws/consumer-protection-act-2019";

export default function ConsumerPage() {
  return (
    <div>
      <div className="max-w-3xl print:hidden">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/letters" className="hover:text-foreground">
            Letters
          </Link>{" "}
          / Consumer complaint
        </nav>
        <h1 className="mt-2 page-title">Draft a consumer complaint</h1>
        <p className="lede">
          Write to the seller or service provider first, and give them a fair time to put it right. If they don&apos;t,
          this letter is your proof that you tried, when you take the case to the Consumer Commission.
        </p>
      </div>

      <div className="mt-8">
        <ConsumerDrafter today={todayInIndia()} />
      </div>

      {/* How to send it and what comes next: folded, one tap away, under the form that matters first. */}
      <section className="mt-8 grid items-start gap-3 lg:grid-cols-2 lg:gap-6 print:hidden" aria-label="Sending it and what happens next">
        <details className="group border-2 border-rule bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 hover:bg-sunken [&::-webkit-details-marker]:hidden">
            <IconDown className="h-3.5 w-3.5 shrink-0 text-accent transition-transform group-open:rotate-180" />
            <h2 className="text-lg font-semibold">Sending it</h2>
          </summary>
          <div className="px-4 pb-5">
            <ul className="mt-1 list-disc space-y-3 pl-5 text-[0.9375rem] text-muted marker:text-muted">
              <li>Send it by registered post or email, and keep the receipt or the sent email.</li>
              <li>Keep copies of the bill, warranty card, photos, chats and complaint numbers.</li>
              <li>
                The National Consumer Helpline (1915) can take the complaint up with the company for free, before you go
                to the Commission.
              </li>
            </ul>
          </div>
        </details>
        <details className="group border-2 border-rule bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 hover:bg-sunken [&::-webkit-details-marker]:hidden">
            <IconDown className="h-3.5 w-3.5 shrink-0 text-accent transition-transform group-open:rotate-180" />
            <h2 className="text-lg font-semibold">If they don&apos;t put it right</h2>
          </summary>
          <div className="px-4 pb-5">
            <ul className="mt-1 list-disc space-y-3 pl-5 text-[0.9375rem] text-muted marker:text-muted">
              <li>
                File a complaint with the District Consumer Commission, online through{" "}
                <a href="https://edaakhil.nic.in" className="link" target="_blank" rel="noopener noreferrer">
                  e-Daakhil
                </a>{" "}
                or on paper. You don&apos;t need a lawyer{" "}
                <Link href={`${CPA}#s-35`} className="link whitespace-nowrap">
                  (Section 35)
                </Link>
                .
              </li>
              <li>
                File within two years of the problem{" "}
                <Link href={`${CPA}#s-69`} className="link whitespace-nowrap">
                  (Section 69)
                </Link>
                .
              </li>
              <li>
                Which Commission hears it depends on the amount you paid{" "}
                <Link href={`${CPA}#s-34`} className="link whitespace-nowrap">
                  (Section 34)
                </Link>
                .
              </li>
            </ul>
          </div>
        </details>
      </section>

      <FreeHelp topics={["consumer"]} className="mt-8" />
    </div>
  );
}
