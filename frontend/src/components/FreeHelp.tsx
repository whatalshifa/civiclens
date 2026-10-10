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
    <section aria-labelledby="free-help" className={`rounded-xl bg-sunken p-6 sm:p-8 print:hidden ${className}`}>
      <h2 id="free-help" className="text-lg font-semibold">
        Get free help from a real person
      </h2>
      <p className="mt-1 text-[0.9375rem] text-muted">
        CivicLens explains the law and drafts letters. It is not legal advice. These services are free.
      </p>
      <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {shown.map((line) => (
          <li key={line.name} className="text-sm">
            <p className="font-semibold">
              {line.name}
              {line.number && (
                <>
                  {": "}
                  <a href={`tel:${line.number}`} className="link tabular-nums">
                    {line.number}
                  </a>
                </>
              )}
            </p>
            <p className="mt-0.5 text-muted">{line.what}</p>
            <a href={line.site.url} className="link mt-0.5 inline-block" target="_blank" rel="noopener noreferrer">
              {line.site.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
