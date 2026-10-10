/** Small helpers shared by the letter builders (RTI application, first appeal, complaints). */

export type Language = "en" | "hi";

export function formatDate(iso: string, language: Language = "en"): string {
  if (!iso) return "__________";
  const [y, m, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day));
  return date.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const blank = (value: string, fallback = "____________________") => value.trim() || fallback;

export function lines(...parts: (string | false | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === "string").join("\n");
}

/** One item per line, with any numbering or bullets the person typed taken off. */
export function items(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim())
    .filter(Boolean);
}

export function numbered(list: string[]): string {
  return (list.length ? list : ["____________________"]).map((item, i) => `${i + 1}. ${item}`).join("\n");
}

/** Today's date in India as yyyy-mm-dd, the format a date input takes. */
export function todayInIndia(): string {
  // en-CA formats dates as yyyy-mm-dd.
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
