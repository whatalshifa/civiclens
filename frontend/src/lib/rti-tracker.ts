/**
 * "I sent it on ...": remembers a sent RTI application in this browser only (localStorage), so the
 * first-appeal page can be filled in from it later, and makes a calendar reminder for the day the
 * reply is due. No account, and nothing leaves the browser.
 */

import type { Jurisdiction } from "@/lib/rti-states";

export type SentRti = {
  authority: string;
  authorityAddress: string;
  information: string;
  jurisdiction: Jurisdiction;
  lifeOrLiberty: boolean;
  name: string;
  address: string;
  phone: string;
  email: string;
  place: string;
  sentOn: string; // yyyy-mm-dd
};

const KEY = "civiclens:rti-sent";

export function loadSent(): SentRti | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SentRti;
    return typeof value?.sentOn === "string" && typeof value.authority === "string" ? value : null;
  } catch {
    return null;
  }
}

export function saveSent(value: SentRti): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function forgetSent(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget if storage is blocked.
  }
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/**
 * When the reply is due: 30 days after the office received it, or 48 hours when it concerns life
 * or liberty (section 7(1)). The day it was sent stands in for the day it was received, which errs
 * on the early side for a posted letter.
 */
export function replyDue(sentOn: string, lifeOrLiberty: boolean): string {
  return addDays(sentOn, lifeOrLiberty ? 2 : 30);
}

/** The last day for a first appeal when no reply came: 30 days after the reply was due (section 19(1)). */
export function appealBy(sentOn: string, lifeOrLiberty: boolean): string {
  return addDays(replyDue(sentOn, lifeOrLiberty), 30);
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/[,;]/g, (c) => `\\${c}`);
}

/** Wraps a line so no line passes 75 bytes even in Hindi, as the iCalendar format asks (RFC 5545, 3.1). */
function fold(line: string): string {
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 24) out.push((i ? " " : "") + line.slice(i, i + 24));
  return out.join("\r\n");
}

/** An all-day calendar event for the day the reply is due, with a reminder that morning. */
export function reminderIcs(sent: SentRti, siteUrl: string, now = new Date()): string {
  const due = replyDue(sent.sentOn, sent.lifeOrLiberty).replace(/-/g, "");
  const after = addDays(replyDue(sent.sentOn, sent.lifeOrLiberty), 1).replace(/-/g, "");
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const office = sent.authority.trim() || "the public authority";
  const description = [
    `Your RTI application to ${office} was sent on ${sent.sentOn}.`,
    "If you have no reply by today, or the reply is incomplete, you can file a first appeal within 30 days under Section 19(1) of the RTI Act.",
    `Draft it here: ${siteUrl}/rti/appeal`,
  ].join("\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CivicLens//RTI reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:rti-${due}-${stamp}@civiclens`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${due}`,
    `DTEND;VALUE=DATE:${after}`,
    fold(`SUMMARY:${escapeIcs(`RTI reply due from ${office}`)}`),
    fold(`DESCRIPTION:${escapeIcs(description)}`),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT9H",
    "DESCRIPTION:RTI reply due today",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
