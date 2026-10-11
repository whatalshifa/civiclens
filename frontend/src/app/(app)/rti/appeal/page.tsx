import type { Metadata } from "next";
import Link from "next/link";

import { IconDown } from "@/components/icons";
import { FreeHelp } from "@/components/FreeHelp";
import { AppealDrafter } from "@/components/rti/AppealDrafter";
import { todayInIndia } from "@/lib/letters";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Draft an RTI first appeal",
  description:
    "No reply to your RTI application, or an unfair one? Draft a first appeal under Section 19(1) of the RTI Act, 2005, in English or Hindi. Free, and nothing you type leaves your browser.",
  path: "/rti/appeal",
});

const RTI = "/laws/rti-act-2005";

export default function AppealPage() {
  return (
    <div>
      <div className="max-w-3xl print:hidden">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/rti" className="hover:text-foreground">
            RTI application
          </Link>{" "}
          / First appeal
        </nav>
        <h1 className="mt-2 page-title">Draft an RTI first appeal</h1>
        <p className="lede">
          If the office didn&apos;t reply within 30 days, refused without a good reason, or gave you incomplete
          information, you can appeal to the officer senior to the Public Information Officer, in the same office. Do it
          within 30 days of the reply, or of the day the reply was due{" "}
          <Link href={`${RTI}#s-19`} className="link">
            (Section 19)
          </Link>
          .
        </p>
      </div>

      <div className="mt-8">
        <AppealDrafter today={todayInIndia()} />
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
              <li>
                The PIO&apos;s reply should name the First Appellate Authority. If it doesn&apos;t, address it as above
                and send it to the same office.
              </li>
              <li>
                Most governments charge no fee for a first appeal. Central government appeals can be filed online at{" "}
                <a href="https://rtionline.gov.in" className="link" target="_blank" rel="noopener noreferrer">
                  rtionline.gov.in
                </a>
                .
              </li>
              <li>Send it by registered post or hand it in for a dated receipt, and keep a copy.</li>
              <li>
                Late? Explain why in &quot;Anything else&quot;: the authority can accept a late appeal for a good reason.
              </li>
            </ul>
          </div>
        </details>
        <details className="group border-2 border-rule bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 hover:bg-sunken [&::-webkit-details-marker]:hidden">
            <IconDown className="h-3.5 w-3.5 shrink-0 text-accent transition-transform group-open:rotate-180" />
            <h2 className="text-lg font-semibold">What happens next</h2>
          </summary>
          <div className="px-4 pb-5">
            <ol className="mt-1 space-y-4 text-sm">
              <li className="grid grid-cols-[8.5rem_1fr] gap-3">
                <span className="font-semibold">Within 30 days</span>
                <span className="text-muted">
                  The appeal should be decided, or within 45 days with reasons written down.{" "}
                  <Link href={`${RTI}#s-19`} className="link whitespace-nowrap">
                    Section 19
                  </Link>
                </span>
              </li>
              <li className="grid grid-cols-[8.5rem_1fr] gap-3">
                <span className="font-semibold">Within 90 days of that</span>
                <span className="text-muted">
                  If you are still not satisfied, file a second appeal with the Central or State Information Commission.
                  It can also fine an officer who refused without reason{" "}
                  <Link href={`${RTI}#s-20`} className="link whitespace-nowrap">
                    (Section 20)
                  </Link>
                  .
                </span>
              </li>
            </ol>
          </div>
        </details>
      </section>

      <FreeHelp className="mt-8" />
    </div>
  );
}
