/**
 * Where an RTI application goes and what it costs. Each state makes its own RTI rules under
 * section 27 of the Act, and central government offices follow the RTI Rules, 2012. Fees and
 * portals change, so the drafter always tells people to confirm the fee with the office.
 *
 * Only portals that are run by the government itself are listed. A state without one here is
 * not a state without a portal: it means we haven't checked one yet, and the page says
 * "send it by post or by hand", which works everywhere.
 */

export type Jurisdiction =
  | "central"
  | "bihar"
  | "delhi"
  | "gujarat"
  | "himachal-pradesh"
  | "karnataka"
  | "kerala"
  | "maharashtra"
  | "punjab"
  | "tamil-nadu"
  | "telangana"
  | "uttar-pradesh"
  | "west-bengal";

export type RtiRule = {
  name: string;
  /** Application fee in rupees. */
  fee: number;
  /** The rules the fee comes from. */
  rules: string;
  /** Who hears the second appeal. */
  commission: string;
  portal?: { url: string; label: string };
};

const state = (name: string, fee = 10, portal?: RtiRule["portal"]): RtiRule => ({
  name,
  fee,
  rules: `${name} Right to Information Rules`,
  commission: `${name} State Information Commission`,
  portal,
});

export const RTI_RULES: Record<Jurisdiction, RtiRule> = {
  central: {
    name: "Central government",
    fee: 10,
    rules: "Right to Information Rules, 2012",
    commission: "Central Information Commission",
    portal: { url: "https://rtionline.gov.in", label: "rtionline.gov.in" },
  },
  bihar: state("Bihar"),
  // The Government of NCT of Delhi has its own rules, but second appeals go to the Central
  // Information Commission: Delhi has no State Information Commission.
  delhi: {
    ...state("Delhi", 10, { url: "https://rtionline.delhi.gov.in", label: "rtionline.delhi.gov.in" }),
    rules: "Delhi Right to Information Rules",
    commission: "Central Information Commission",
  },
  gujarat: state("Gujarat", 20),
  "himachal-pradesh": state("Himachal Pradesh"),
  karnataka: state("Karnataka"),
  kerala: state("Kerala"),
  maharashtra: state("Maharashtra", 10, {
    url: "https://rtionline.maharashtra.gov.in",
    label: "rtionline.maharashtra.gov.in",
  }),
  punjab: state("Punjab"),
  "tamil-nadu": state("Tamil Nadu"),
  telangana: state("Telangana"),
  "uttar-pradesh": state("Uttar Pradesh", 10, { url: "https://rtionline.up.gov.in", label: "rtionline.up.gov.in" }),
  "west-bengal": state("West Bengal"),
};

export const JURISDICTIONS = Object.keys(RTI_RULES) as Jurisdiction[];

export function isJurisdiction(value: unknown): value is Jurisdiction {
  return typeof value === "string" && value in RTI_RULES;
}
