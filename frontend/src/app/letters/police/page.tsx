import type { Metadata } from "next";
import Link from "next/link";

import { FreeHelp } from "@/components/FreeHelp";
import { PoliceDrafter } from "@/components/letters/PoliceDrafter";
import { todayInIndia } from "@/lib/letters";

export const metadata: Metadata = {
  title: "Police won't register your FIR? Draft a complaint to the SP",
  description:
    "If a police station refuses to register an FIR, draft a written complaint to the Superintendent of Police under Section 173(4) of the BNSS, in English or Hindi. Free, and nothing you type leaves your browser.",
};

const BNSS = "/laws/bnss-2023";

export default function PolicePage() {
  return (
    <div>
      <div className="max-w-3xl print:hidden">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/letters" className="hover:text-foreground">
            Letters
          </Link>{" "}
          / Police complaint
        </nav>
        <h1 className="mt-2 page-title">
          Police won&apos;t register your FIR?
        </h1>
        <p className="lede">
          For a cognizable offence (a serious one, like theft, assault or fraud), the police must register an FIR. If
          the station refuses, you can send the details in writing to the Superintendent of Police, who can order an
          investigation{" "}
          <Link href={`${BNSS}#s-173`} className="link">
            (Section 173)
          </Link>
          .
        </p>
        <p className="note-accent mt-5">
          <strong>If anyone is in danger now, call 112.</strong> You can report an FIR at any police station, even if it
          happened elsewhere (a &quot;zero FIR&quot;), and many states let you file one online.
        </p>
      </div>

      <div className="mt-12">
        <PoliceDrafter today={todayInIndia()} />
      </div>

      <section className="mt-20 grid gap-10 border-t border-line pt-12 lg:grid-cols-2 lg:gap-16 print:hidden" aria-label="Sending it and what happens next">
        <div>
          <h2 className="text-xl font-semibold">Sending it</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-[0.9375rem] text-muted marker:text-muted">
            <li>Send it by registered post, as the law expects, and keep the postal receipt.</li>
            <li>Stick to facts you know. A false complaint is itself an offence.</li>
            <li>Keep copies of everything you send.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">If the SP doesn&apos;t act</h2>
          <p className="mt-4 text-sm text-muted">
            You can apply to the Judicial Magistrate, who can order the police to investigate (Section 175(3) of the
            BNSS). This needs a sworn affidavit, so free legal aid is worth calling first.
          </p>
        </div>
      </section>

      <FreeHelp topics={["police", "women", "cyber"]} className="mt-12" />
    </div>
  );
}
