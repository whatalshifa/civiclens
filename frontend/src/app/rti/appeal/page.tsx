import type { Metadata } from "next";
import Link from "next/link";

import { FreeHelp } from "@/components/FreeHelp";
import { AppealDrafter } from "@/components/rti/AppealDrafter";
import { todayInIndia } from "@/lib/letters";

export const metadata: Metadata = {
  title: "Draft an RTI first appeal",
  description:
    "No reply to your RTI application, or an unfair one? Draft a first appeal under Section 19(1) of the RTI Act, 2005, in English or Hindi. Free, and nothing you type leaves your browser.",
};

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
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">Draft an RTI first appeal</h1>
        <p className="mt-4 text-muted">
          If the office didn&apos;t reply within 30 days, refused without a good reason, or gave you incomplete
          information, you can appeal to the officer senior to the Public Information Officer, in the same office. Do it
          within 30 days of the reply, or of the day the reply was due{" "}
          <Link href={`${RTI}#s-19`} className="link">
            (Section 19)
          </Link>
          .
        </p>
      </div>

      <div className="mt-10">
        <AppealDrafter today={todayInIndia()} />
      </div>

      <section className="mt-16 grid gap-6 lg:grid-cols-2 print:hidden" aria-label="Sending it and what happens next">
        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Sending it</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-muted marker:text-muted">
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
        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">What happens next</h2>
          <ol className="mt-4 space-y-4 text-sm">
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
      </section>

      <FreeHelp className="mt-6" />
    </div>
  );
}
