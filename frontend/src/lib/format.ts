const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "2024-06-04" -> "4 June 2024". Dates from the API have no time, so read them as UTC. */
export function formatDate(iso: string): string {
  return DATE.format(new Date(`${iso}T00:00:00Z`));
}

export const HOUSE_NAMES = {
  lok_sabha: { body: "Lok Sabha", role: "Member of Parliament", short: "MP" },
  vidhan_sabha: { body: "Vidhan Sabha", role: "Member of the Legislative Assembly", short: "MLA" },
} as const;

/** Six digits, not starting with 0. Spaces are allowed while typing ("110 001"). */
export function cleanPin(value: string): string | null {
  const pin = value.replace(/\s/g, "");
  return /^[1-9][0-9]{5}$/.test(pin) ? pin : null;
}

/** "Andaman and Nicobar Islands" -> "andaman-and-nicobar-islands", for page anchors. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const INDIAN = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** Rupees the way Indian budgets write them: 14,70,00,000 -> "₹14.7 crore", 5,00,000 -> "₹5 lakh". */
export function formatRupees(rupees: number): string {
  if (rupees >= 1e7) return `₹${INDIAN.format(rupees / 1e7)} crore`;
  if (rupees >= 1e5) return `₹${INDIAN.format(rupees / 1e5)} lakh`;
  return `₹${INDIAN.format(rupees)}`;
}

/** 54.37 -> "54%". */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * What the find box was given: a PIN code, a place or seat name to search for, or nothing usable.
 * A name needs at least two letters, which is also the shortest search the API accepts.
 */
export function readFindQuery(value: string): { pin: string } | { name: string } | null {
  const pin = cleanPin(value);
  if (pin) return { pin };
  const name = value.trim().replace(/\s+/g, " ").slice(0, 60);
  return (name.match(/\p{L}/gu) ?? []).length >= 2 ? { name } : null;
}
