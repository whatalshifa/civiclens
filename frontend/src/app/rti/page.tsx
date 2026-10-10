import type { Metadata } from "next";
import Link from "next/link";

import { FreeHelp } from "@/components/FreeHelp";
import { RtiDrafter } from "@/components/rti/RtiDrafter";
import { todayInIndia } from "@/lib/letters";

export const metadata: Metadata = {
  title: "Draft an RTI application",
  description:
    "Fill in a short form and get a ready-to-send application under the Right to Information Act, 2005, in English or Hindi. Free, and nothing you type leaves your browser.",
};

const RTI = "/laws/rti-act-2005";

const NEXT_STEPS: {
  when: string;
  what: string;
  ref: string;
  label: string;
  draft?: { href: string; label: string };
}[] = [
  {
    when: "Within 30 days",
    what: "The office must reply, or reject the request with reasons.",
    ref: "s-7",
    label: "Section 7",
  },
  {
    when: "Within 48 hours",
    what: "If the information concerns someone's life or liberty.",
    ref: "s-7",
    label: "Section 7",
  },
  {
    when: "30 days after no reply",
    what: "File a first appeal with the officer senior to the PIO, in the same office.",
    ref: "s-19",
    label: "Section 19",
    draft: { href: "/rti/appeal", label: "Draft the appeal" },
  },
  {
    when: "Within 90 days of that",
    what: "File a second appeal with the Central or State Information Commission.",
    ref: "s-19",
    label: "Section 19",
  },
];

export default async function RtiPage({ searchParams }: PageProps<"/rti">) {
  const params = await searchParams;
  const authority = typeof params.authority === "string" ? params.authority.slice(0, 200) : "";
  const information = typeof params.info === "string" ? params.info.slice(0, 3000) : "";

  return (
    <div>
      <div className="max-w-3xl print:hidden">
        <h1 className="page-title">Draft an RTI application</h1>
        <p className="lede">
          Any citizen can ask a government office for its records and information, and it must answer within 30 days.
          Fill in the form and your application is written as you type, in English or Hindi, ready to print and send.
        </p>
        {authority && (
          <p className="note-accent mt-5">
            The rights assistant filled in the office and the questions. Check them, then add your own details.
          </p>
        )}
        <noscript>
          <p className="note mt-5">
            The letter below updates as you type when JavaScript is on. Without it, you can copy the template and fill
            in the blanks by hand.
          </p>
        </noscript>
      </div>

      <div className="mt-12">
        <RtiDrafter authority={authority} information={information} today={todayInIndia()} />
      </div>

      <section className="mt-20 grid gap-10 border-t border-line pt-12 lg:grid-cols-2 lg:gap-16 print:hidden" aria-label="Sending it and what happens next">
        <div>
          <h2 className="text-xl font-semibold">Sending it</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-[0.9375rem] text-muted marker:text-muted">
            <li>
              <span className="text-foreground">Central government offices</span> (ministries, railways, banks owned by
              the government, central universities): you can file online at{" "}
              <a href="https://rtionline.gov.in" className="link" rel="noopener">
                rtionline.gov.in
              </a>{" "}
              and pay the ₹10 fee there.
            </li>
            <li>
              <span className="text-foreground">State and local offices</span>: post it to the office&apos;s Public
              Information Officer by registered post, or hand it in and ask for a dated receipt. Many states also have
              their own RTI portal. Each state sets its own fee: pick the state in the form to see it.
            </li>
            <li>
              You don&apos;t have to give any reason for asking{" "}
              <Link href={`${RTI}#s-6`} className="link">
                (Section 6)
              </Link>
              . People below the poverty line pay no fee{" "}
              <Link href={`${RTI}#s-7`} className="link">
                (Section 7)
              </Link>
              .
            </li>
            <li>Keep a copy of the application and the proof that you sent it. You will need both for an appeal.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">What happens next</h2>
          <ol className="mt-4 space-y-4">
            {NEXT_STEPS.map((step) => (
              <li key={step.when} className="grid grid-cols-[8.5rem_1fr] gap-3 text-sm">
                <span className="font-semibold">{step.when}</span>
                <span className="text-muted">
                  {step.what}{" "}
                  <Link href={`${RTI}#${step.ref}`} className="link whitespace-nowrap">
                    {step.label}
                  </Link>
                  {step.draft && (
                    <>
                      {". "}
                      <Link href={step.draft.href} className="link whitespace-nowrap">
                        {step.draft.label}
                      </Link>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted">
            Some information can be withheld, such as matters of national security or someone else&apos;s private
            details{" "}
            <Link href={`${RTI}#s-8`} className="link">
              (Section 8)
            </Link>
            . An official who refuses without good reason can be fined{" "}
            <Link href={`${RTI}#s-20`} className="link">
              (Section 20)
            </Link>
            .
          </p>
        </div>
      </section>

      <FreeHelp className="mt-12" />
    </div>
  );
}
