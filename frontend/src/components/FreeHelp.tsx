/**
 * Where to get free help from a real person: government helplines and free legal aid. CivicLens
 * gives information and drafts, not legal advice, so every answer and letter points here too.
 */

export type HelpTopic = "legal" | "consumer" | "women" | "cyber" | "police";

type Line = { name: string; number?: string; what: string; site: { url: string; label: string } };

const LINES: Record<HelpTopic | "aid", Line> = {
  legal: {
    name: "Tele-Law",
    number: "14454",
    what: "Free advice from a lawyer over the phone or video, through Common Service Centres.",
    site: { url: "https://www.tele-law.in", label: "tele-law.in" },
  },
  aid: {
    name: "Free legal aid",
    number: "15100",
    what: "Your District Legal Services Authority can give you a lawyer for free if you are a woman, a child, from a Scheduled Caste or Tribe, in custody, or below the income limit (Legal Services Authorities Act, 1987, section 12).",
    site: { url: "https://nalsa.gov.in", label: "nalsa.gov.in" },
  },
  consumer: {
    name: "National Consumer Helpline",
    number: "1915",
    what: "Help settling a complaint with a seller before you go to the Consumer Commission. File a case online on e-Daakhil.",
    site: { url: "https://consumerhelpline.gov.in", label: "consumerhelpline.gov.in" },
  },
  women: {
    name: "Women Helpline",
    number: "181",
    what: "For women facing violence at home or outside, round the clock.",
    site: { url: "https://wcd.gov.in", label: "wcd.gov.in" },
  },
  cyber: {
    name: "Cyber crime helpline",
    number: "1930",
    what: "Call at once if you lose money to online fraud. Report other cyber crime online.",
    site: { url: "https://cybercrime.gov.in", label: "cybercrime.gov.in" },
  },
  police: {
    name: "Emergency",
    number: "112",
    what: "Police, fire and ambulance, if anyone is in danger now.",
    site: { url: "https://112.gov.in", label: "112.gov.in" },
  },
};

/** The topics each Act in the library touches, for the act pages. */
export const ACT_HELP: Record<string, HelpTopic[]> = {
  "consumer-protection-act-2019": ["consumer"],
  "bnss-2023": ["police", "cyber"],
  "dv-act-2005": ["women", "police"],
};

export function FreeHelp({ topics = [], className = "" }: { topics?: HelpTopic[]; className?: string }) {
  const shown: Line[] = [LINES.legal, LINES.aid, ...topics.filter((t) => t !== "legal").map((t) => LINES[t])];
  return (
    <section
      aria-labelledby="free-help"
      className={`@container border-t-[6px] border-rule bg-sunken p-5 sm:p-6 print:hidden ${className}`}
    >
      {/* Laid out by its own width, since it sits in full-width pages and in narrow columns alike. */}
      <div className="gap-x-8 @3xl:grid @3xl:grid-cols-[14rem_minmax(0,1fr)]">
        <div>
          <h2 id="free-help" className="section-title">
            Get free help from a real person
          </h2>
          <p className="mt-1 text-[0.9375rem] text-muted">
            CivicLens explains the law and drafts letters. It is not legal advice. These services are free.
          </p>
        </div>
        <ul className="mt-4 grid gap-x-6 gap-y-3 @lg:grid-cols-2 @3xl:mt-1 @5xl:grid-cols-3">
          {shown.map((line) => (
            <li key={line.name} className="border-l-4 border-accent pl-3 text-sm">
              <p className="font-bold">
                {line.name}
                {line.number && (
                  <>
                    {": "}
                    <a href={`tel:${line.number}`} className="link font-mono text-base tabular-nums">
                      {line.number}
                    </a>
                  </>
                )}
                <span className="font-normal text-muted"> · </span>
                <a href={line.site.url} className="link font-normal" target="_blank" rel="noopener noreferrer">
                  {line.site.label}
                </a>
              </p>
              <p className="mt-0.5 leading-snug text-muted">{line.what}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
