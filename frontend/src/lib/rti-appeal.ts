/**
 * Builds a first appeal under section 19(1) of the RTI Act, 2005: to the officer senior to the
 * Public Information Officer, in the same office, within 30 days of the reply (or of the day the
 * reply was due). Like the application, it runs in the browser only.
 */

import { blank, formatDate, items, type Language, lines, numbered } from "@/lib/letters";
import { type Jurisdiction } from "@/lib/rti-states";

export type Ground = "noReply" | "refused" | "incomplete" | "fee";

export type AppealDraft = {
  language: Language;
  jurisdiction: Jurisdiction;
  authority: string;
  authorityAddress: string;
  applicationDate: string; // yyyy-mm-dd
  applicationRef: string;
  information: string;
  replyDate: string; // empty when no reply came
  grounds: Ground[];
  otherGrounds: string;
  hearing: boolean;
  name: string;
  address: string;
  phone: string;
  email: string;
  place: string;
  date: string;
};

export const EMPTY_APPEAL: AppealDraft = {
  language: "en",
  jurisdiction: "central",
  authority: "",
  authorityAddress: "",
  applicationDate: "",
  applicationRef: "",
  information: "",
  replyDate: "",
  grounds: [],
  otherGrounds: "",
  hearing: true,
  name: "",
  address: "",
  phone: "",
  email: "",
  place: "",
  date: "",
};

export const GROUNDS: Record<Ground, { title: string; detail: string; en: string; hi: string }> = {
  noReply: {
    title: "No reply within 30 days",
    detail: "Or within 48 hours, for life or liberty. Section 7(2) treats this as a refusal.",
    en: "No decision was communicated within the time allowed by Section 7(1) of the Act. Under Section 7(2), the request is therefore deemed to have been refused.",
    hi: "अधिनियम की धारा 7(1) में निर्धारित समय के भीतर कोई निर्णय सूचित नहीं किया गया। अतः धारा 7(2) के अंतर्गत यह अनुरोध अस्वीकृत माना जाता है।",
  },
  refused: {
    title: "Refused without a valid reason",
    detail: "Refusals must cite an exemption in Section 8 or 9.",
    en: "The request was refused without a valid reason. Refusal is allowed only on the grounds in Sections 8 and 9 of the Act, and Section 7(8) requires the reasons to be given.",
    hi: "अनुरोध को बिना किसी वैध कारण के अस्वीकार किया गया। अस्वीकृति केवल अधिनियम की धारा 8 और 9 के आधारों पर ही हो सकती है, और धारा 7(8) के अनुसार उसके कारण बताना आवश्यक है।",
  },
  incomplete: {
    title: "Incomplete or wrong information",
    detail: "Some items were not answered, or the answer is misleading.",
    en: "The information supplied is incomplete, misleading or does not answer what was asked.",
    hi: "दी गई सूचना अधूरी है, भ्रामक है, या जो पूछा गया था उसका उत्तर नहीं देती।",
  },
  fee: {
    title: "Asked for an unfair or late fee",
    detail: "Information given after the time limit must be free (Section 7(6)).",
    en: "I was asked to pay a further fee that is unreasonable, or that was demanded after the time limit had passed, when Section 7(6) of the Act requires the information to be supplied free of charge.",
    hi: "मुझसे अतिरिक्त शुल्क की माँग की गई जो अनुचित है, या समय-सीमा बीत जाने के बाद माँगा गया, जबकि अधिनियम की धारा 7(6) के अनुसार ऐसी सूचना निःशुल्क दी जानी चाहिए।",
  },
};

export function missing(d: AppealDraft): string[] {
  const out: string[] = [];
  if (!d.authority.trim()) out.push("the office");
  if (!d.applicationDate) out.push("the date of your application");
  if (items(d.information).length === 0) out.push("the information you asked for");
  if (d.grounds.length === 0 && !d.otherGrounds.trim()) out.push("why you are appealing");
  if (!d.name.trim()) out.push("your name");
  if (!d.address.trim()) out.push("your address");
  return out;
}

export function buildAppeal(d: AppealDraft): string {
  const list = numbered(items(d.information));
  const contact = [d.phone.trim(), d.email.trim()].filter(Boolean);
  const grounds = [
    ...(Object.keys(GROUNDS) as Ground[]).filter((g) => d.grounds.includes(g)).map((g) => GROUNDS[g][d.language]),
    ...items(d.otherGrounds),
  ];
  const groundList = grounds.length
    ? grounds.map((g, i) => `(${String.fromCharCode(97 + i)}) ${g}`).join("\n")
    : "____________________";
  const free = d.grounds.includes("noReply") || d.grounds.includes("fee");
  return d.language === "hi" ? hindi(d, list, groundList, contact, free) : english(d, list, groundList, contact, free);
}

function english(d: AppealDraft, list: string, grounds: string, contact: string[], free: boolean): string {
  const ref = d.applicationRef.trim() ? ` (reference ${d.applicationRef.trim()})` : "";
  return lines(
    "To",
    "The First Appellate Authority",
    blank(d.authority),
    d.authorityAddress.trim() || false,
    "",
    "Subject: First appeal under Section 19(1) of the Right to Information Act, 2005",
    "",
    "Sir/Madam,",
    "",
    `1. Appellant: ${blank(d.name)}, ${blank(d.address)}`,
    `2. Application made to: The Public Information Officer, ${blank(d.authority)}`,
    `3. Date of the application: ${formatDate(d.applicationDate, "en")}${ref}`,
    `4. Reply from the Public Information Officer: ${d.replyDate ? `dated ${formatDate(d.replyDate, "en")}` : "none received"}`,
    "",
    "5. Information asked for:",
    list,
    "",
    "6. Grounds of appeal:",
    grounds,
    "",
    "7. Relief sought:",
    `I request that the Public Information Officer be directed to supply the complete information asked for${
      free ? ", free of charge as Section 7(6) of the Act requires" : ""
    }, within a time you set.`,
    d.hearing ? "I also request a hearing before this appeal is decided." : false,
    "",
    "I declare that the facts stated above are true to the best of my knowledge. This appeal is filed within the period allowed by Section 19(1) of the Act.",
    "",
    "Yours faithfully,",
    "",
    "",
    blank(d.name),
    blank(d.address),
    contact.length ? contact.join(" | ") : false,
    "",
    `Place: ${blank(d.place, "__________")}`,
    `Date: ${formatDate(d.date, "en")}`,
    "",
    "Enclosures:",
    "1. Copy of the RTI application",
    "2. Proof of sending it and of the fee paid",
    d.replyDate ? "3. Copy of the reply from the Public Information Officer" : false,
  );
}

function hindi(d: AppealDraft, list: string, grounds: string, contact: string[], free: boolean): string {
  const ref = d.applicationRef.trim() ? ` (संदर्भ ${d.applicationRef.trim()})` : "";
  return lines(
    "सेवा में,",
    "प्रथम अपीलीय अधिकारी",
    blank(d.authority),
    d.authorityAddress.trim() || false,
    "",
    "विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 19(1) के अंतर्गत प्रथम अपील",
    "",
    "महोदय/महोदया,",
    "",
    `1. अपीलकर्ता: ${blank(d.name)}, ${blank(d.address)}`,
    `2. आवेदन किसे दिया गया: लोक सूचना अधिकारी, ${blank(d.authority)}`,
    `3. आवेदन की तिथि: ${formatDate(d.applicationDate, "hi")}${ref}`,
    `4. लोक सूचना अधिकारी का उत्तर: ${d.replyDate ? `दिनांक ${formatDate(d.replyDate, "hi")}` : "कोई उत्तर प्राप्त नहीं हुआ"}`,
    "",
    "5. माँगी गई सूचना:",
    list,
    "",
    "6. अपील के आधार:",
    grounds,
    "",
    "7. माँगी गई राहत:",
    `अनुरोध है कि लोक सूचना अधिकारी को माँगी गई पूरी सूचना${
      free ? ", अधिनियम की धारा 7(6) के अनुसार निःशुल्क," : ""
    } आपके द्वारा निर्धारित समय के भीतर देने का निर्देश दिया जाए।`,
    d.hearing ? "अपील का निर्णय करने से पहले मुझे सुनवाई का अवसर देने का भी अनुरोध है।" : false,
    "",
    "मैं घोषणा करता/करती हूँ कि ऊपर दिए गए तथ्य मेरी जानकारी में सत्य हैं। यह अपील अधिनियम की धारा 19(1) में निर्धारित अवधि के भीतर प्रस्तुत की जा रही है।",
    "",
    "भवदीय/भवदीया,",
    "",
    "",
    blank(d.name),
    blank(d.address),
    contact.length ? contact.join(" | ") : false,
    "",
    `स्थान: ${blank(d.place, "__________")}`,
    `दिनांक: ${formatDate(d.date, "hi")}`,
    "",
    "संलग्नक:",
    "1. सूचना के अधिकार के आवेदन की प्रति",
    "2. आवेदन भेजने और शुल्क जमा करने का प्रमाण",
    d.replyDate ? "3. लोक सूचना अधिकारी के उत्तर की प्रति" : false,
  );
}
