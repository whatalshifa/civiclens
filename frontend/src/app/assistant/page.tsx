import type { Metadata } from "next";
import Link from "next/link";

import { Assistant } from "@/components/assistant/Assistant";
import { api, replaySample } from "@/lib/api";
import type { AssistantEvent, AssistantInfo } from "@/lib/types";

export const metadata: Metadata = {
  title: "Rights assistant",
  description:
    "Ask about your rights in plain words. The assistant searches the Constitution and key Acts, reads the sections that apply, and cites every one.",
};

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const { sample } = await searchParams;
  const info = await api<AssistantInfo>("/api/assistant", { cache: false });
  const chosen = typeof sample === "string" ? info.samples.find((s) => s.id === sample) : undefined;
  // A sample's page shows its finished answer straight away, without JavaScript too.
  const initial: AssistantEvent[] | undefined = chosen ? await replaySample(chosen.id) : undefined;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
      <div className="min-w-0">
        <p className="eyebrow">Rights assistant{info.ai_enabled ? "" : " · demo"}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          Ask what the law says about your situation
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          The assistant searches the CivicLens law library, reads the sections that apply, and answers in plain words.
          Every claim links to the section it comes from, and you can see each step it took.
        </p>
        <div className="mt-8">
          <Assistant info={info} initial={initial} initialSample={chosen?.id} />
        </div>
      </div>

      <aside className="space-y-4 text-sm lg:pt-24">
        <div className="card p-5">
          <h2 className="font-semibold">How it keeps answers honest</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-muted marker:text-muted">
            <li>It may only state law from sections it has read in the library during this answer.</li>
            <li>
              Each citation is checked against what it read. A citation it didn&apos;t check is removed before you see
              the answer.
            </li>
            <li>It stays out of politics: no opinions on parties, politicians or governments.</li>
          </ul>
        </div>
        <div className="rounded-none bg-sunken p-5 text-muted">
          <p>
            <span className="font-semibold text-foreground">Not legal advice.</span> In an emergency, call{" "}
            <a href="tel:112" className="link">
              112
            </a>
            . For free legal help, call the Legal Services Authority helpline{" "}
            <a href="tel:15100" className="link">
              15100
            </a>
            .
          </p>
          <p className="mt-3">
            CivicLens doesn&apos;t store your question. Need a government record?{" "}
            <Link href="/rti" className="link">
              Draft an RTI application
            </Link>
            .
          </p>
        </div>
      </aside>
    </div>
  );
}
