import Link from "next/link";

import { RTI_RULES, type Jurisdiction } from "@/lib/rti-states";

/** The fee, the portal and who hears appeals, for the government the application goes to. */
export function RtiRuleCard({ jurisdiction }: { jurisdiction: Jurisdiction }) {
  const rule = RTI_RULES[jurisdiction];
  return (
    <div className="rounded-xl bg-accent-soft p-4 text-sm" aria-live="polite">
      <p>
        <span className="font-semibold">Fee: ₹{rule.fee}</span>, under the {rule.rules}. Fees change, so check the
        amount on the office&apos;s notice board or website before paying. People below the poverty line pay nothing.
      </p>
      <p className="mt-2">
        {rule.portal ? (
          <>
            You can also file online at{" "}
            <a href={rule.portal.url} className="link" target="_blank" rel="noopener noreferrer">
              {rule.portal.label}
            </a>
            , if the office is listed there. Otherwise send this letter by registered post or hand it in for a receipt.
          </>
        ) : (
          <>Send it by registered post, or hand it in at the office and ask for a dated receipt.</>
        )}
      </p>
      <p className="mt-2 text-muted">
        Second appeals go to the {rule.commission}.{" "}
        <Link href="/laws/rti-act-2005#s-19" className="link">
          Section 19
        </Link>
      </p>
    </div>
  );
}
