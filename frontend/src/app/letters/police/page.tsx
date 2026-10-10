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
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          Police won&apos;t register your FIR?
        </h1>
        <p className="mt-4 text-muted">
          For a cognizable offence (a serious one, like theft, assault or fraud), the police must register an FIR. If
          the station refuses, you can send the details in writing to the Superintendent of Police, who can order an
          investigation{" "}
          <Link href={`${BNSS}#s-173`} className="link">
            (Section 173)
          </Link>
          .
        </p>
        <p className="mt-4 rounded-sm bg-accent-soft p-3 text-sm">
          <strong>If anyone is in danger now, call 112.</strong> You can report an FIR at any police station, even if it
          happened elsewhere (a &quot;zero FIR&quot;), and many states let you file one online.
        </p>
      </div>

      <div className="mt-10">
        <PoliceDrafter today={todayInIndia()} />
      </div>

      <section className="mt-16 grid gap-6 lg:grid-cols-2 print:hidden" aria-label="Sending it and what happens next">
        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Sending it</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-muted marker:text-muted">
            <li>Send it by registered post, as the law expects, and keep the postal receipt.</li>
            <li>Stick to facts you know. A false complaint is itself an offence.</li>
            <li>Keep copies of everything you send.</li>
          </ul>
        </div>
        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">If the SP doesn&apos;t act</h2>
          <p className="mt-4 text-sm text-muted">
            You can apply to the Judicial Magistrate, who can order the police to investigate (Section 175(3) of the
            BNSS). This needs a sworn affidavit, so free legal aid is worth calling first.
          </p>
        </div>
      </section>

      <FreeHelp topics={["police", "women", "cyber"]} className="mt-6" />
    </div>
  );
}
