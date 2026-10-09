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
