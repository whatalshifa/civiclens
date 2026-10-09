/**
 * Builds an RTI application from the drafter's form, following section 6 of the RTI Act, 2005:
 * addressed to the Public Information Officer, the information asked for, no reason given
 * (section 6(2) says none is needed), contact details, and the fee or the BPL exemption
 * (proviso to section 7(5)). It runs in the browser only: what people type never leaves it.
 */

export type Language = "en" | "hi";
export type Format = "copies" | "email" | "inspection";
export type FeeMode = "ipo" | "dd" | "stamp" | "cash" | "online" | "bpl";

export type RtiDraft = {
  language: Language;
  authority: string;
  authorityAddress: string;
  information: string; // one item per line
  period: string;
  format: Format;
  lifeOrLiberty: boolean;
  feeMode: FeeMode;
  feeReference: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  place: string;
  date: string; // yyyy-mm-dd
};

export const EMPTY_DRAFT: RtiDraft = {
  language: "en",
  authority: "",
  authorityAddress: "",
  information: "",
  period: "",
  format: "copies",
  lifeOrLiberty: false,
  feeMode: "ipo",
  feeReference: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  place: "",
  date: "",
};

export const FEE_MODES: Record<FeeMode, { en: string; hi: string }> = {
  ipo: { en: "Indian Postal Order", hi: "भारतीय पोस्टल ऑर्डर" },
  dd: { en: "Demand draft", hi: "डिमांड ड्राफ्ट" },
  stamp: { en: "Court fee stamp", hi: "कोर्ट फीस स्टाम्प" },
  cash: { en: "Cash, against a receipt", hi: "नकद (रसीद सहित)" },
  online: { en: "Online payment", hi: "ऑनलाइन भुगतान" },
  bpl: { en: "Exempt: I hold a BPL card", hi: "छूट: मेरे पास BPL कार्ड है" },
};

// "I have paid the application fee of Rs. 10 ..."
const FEE_PHRASES: Record<FeeMode, string> = {
  ipo: " by Indian Postal Order",
  dd: " by demand draft",
  stamp: " as a court fee stamp",
  cash: " in cash, against a receipt",
  online: " online",
  bpl: "",
};

export const FORMATS: Record<Format, { en: string; hi: string }> = {
  copies: {
    en: "Certified copies, by post",
    hi: "डाक द्वारा प्रमाणित प्रतियाँ",
  },
  email: {
    en: "By email, as electronic copies",
    hi: "ईमेल द्वारा इलेक्ट्रॉनिक प्रतियाँ",
  },
  inspection: {
    en: "Inspect the records in person",
    hi: "अभिलेखों का स्वयं निरीक्षण",
  },
};

export function items(information: string): string[] {
  return information
    .split("\n")
    .map((line) => line.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim())
    .filter(Boolean);
}

/** What still has to be filled in before the letter can be sent. Empty means ready. */
export function missing(d: RtiDraft): string[] {
  const out: string[] = [];
  if (!d.authority.trim()) out.push("the office you are writing to");
  if (items(d.information).length === 0) out.push("the information you want");
  if (!d.name.trim()) out.push("your name");
  if (!d.address.trim()) out.push("your address");
  return out;
}

function formatDate(iso: string, language: Language): string {
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

const blank = (value: string, fallback = "____________________") => value.trim() || fallback;

function lines(...parts: (string | false | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === "string").join("\n");
}

export function buildLetter(d: RtiDraft): string {
  const list = items(d.information);
  const numbered = (list.length ? list : ["____________________"]).map((item, i) => `${i + 1}. ${item}`).join("\n");
  const contact = [d.phone.trim(), d.email.trim()].filter(Boolean);
  return d.language === "hi" ? hindi(d, numbered, contact) : english(d, numbered, contact);
}

function english(d: RtiDraft, numbered: string, contact: string[]): string {
  const fee =
    d.feeMode === "bpl"
      ? "I belong to a Below Poverty Line family, so no fee is payable under the proviso to Section 7(5) of the Act. A copy of my BPL card is enclosed."
      : `I have paid the application fee of Rs. 10${FEE_PHRASES[d.feeMode]}${
          d.feeReference.trim() ? ` (${d.feeReference.trim()})` : ""
        }.`;
  const format = {
    copies: "I would like to receive this information as certified copies by post.",
    email: "I would like to receive this information by email, as electronic copies.",
    inspection:
      "I would like to inspect the relevant records in person, and to receive certified copies of the pages I select.",
  }[d.format];
  const enclosures = d.feeMode === "bpl" ? "Copy of BPL card" : `Proof of fee payment (${FEE_MODES[d.feeMode].en})`;

  return lines(
    "To",
    "The Public Information Officer",
    blank(d.authority),
    d.authorityAddress.trim() || false,
    "",
    "Subject: Application for information under Section 6(1) of the Right to Information Act, 2005",
    "",
    "Sir/Madam,",
    "",
    "Under the Right to Information Act, 2005, I request the following information:",
    "",
    numbered,
    "",
    d.period.trim() ? `Period the information should cover: ${d.period.trim()}` : false,
    d.period.trim() ? "" : false,
    format,
    "",
    d.lifeOrLiberty
      ? "This information concerns the life or liberty of a person. I therefore request that it be supplied within 48 hours, as required by the proviso to Section 7(1) of the Act."
      : false,
    d.lifeOrLiberty ? "" : false,
    fee,
    "",
    "If any of this information is held by another public authority, please transfer this application, or the relevant part of it, to that authority under Section 6(3) of the Act and inform me.",
    "",
    "I am a citizen of India.",
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
    `Enclosure: ${enclosures}`,
  );
}

function hindi(d: RtiDraft, numbered: string, contact: string[]): string {
  const fee =
    d.feeMode === "bpl"
      ? "मैं गरीबी रेखा से नीचे (BPL) के परिवार से हूँ, अतः अधिनियम की धारा 7(5) के परंतुक के अंतर्गत कोई शुल्क देय नहीं है। मेरे BPL कार्ड की प्रति संलग्न है।"
      : `मैंने ₹10 का आवेदन शुल्क ${FEE_MODES[d.feeMode].hi} द्वारा जमा किया है${
          d.feeReference.trim() ? ` (${d.feeReference.trim()})` : ""
        }।`;
  const format = {
    copies: "मैं यह सूचना डाक द्वारा प्रमाणित प्रतियों के रूप में प्राप्त करना चाहता/चाहती हूँ।",
    email: "मैं यह सूचना ईमेल द्वारा इलेक्ट्रॉनिक प्रतियों के रूप में प्राप्त करना चाहता/चाहती हूँ।",
    inspection:
      "मैं संबंधित अभिलेखों का स्वयं निरीक्षण करना चाहता/चाहती हूँ, और चुने गए पृष्ठों की प्रमाणित प्रतियाँ प्राप्त करना चाहता/चाहती हूँ।",
  }[d.format];
  const enclosures = d.feeMode === "bpl" ? "BPL कार्ड की प्रति" : `शुल्क भुगतान का प्रमाण (${FEE_MODES[d.feeMode].hi})`;

  return lines(
    "सेवा में,",
    "लोक सूचना अधिकारी",
    blank(d.authority),
    d.authorityAddress.trim() || false,
    "",
    "विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत सूचना हेतु आवेदन",
    "",
    "महोदय/महोदया,",
    "",
    "सूचना का अधिकार अधिनियम, 2005 के अंतर्गत मैं निम्नलिखित सूचना प्राप्त करना चाहता/चाहती हूँ:",
    "",
    numbered,
    "",
    d.period.trim() ? `सूचना की अवधि: ${d.period.trim()}` : false,
    d.period.trim() ? "" : false,
    format,
    "",
    d.lifeOrLiberty
      ? "यह सूचना किसी व्यक्ति के जीवन या स्वतंत्रता से संबंधित है। अतः अधिनियम की धारा 7(1) के परंतुक के अनुसार यह सूचना 48 घंटे के भीतर देने का अनुरोध है।"
      : false,
    d.lifeOrLiberty ? "" : false,
    fee,
    "",
    "यदि इसमें से कोई सूचना किसी अन्य लोक प्राधिकरण के पास है, तो कृपया अधिनियम की धारा 6(3) के अंतर्गत यह आवेदन, या उसका संबंधित भाग, उस प्राधिकरण को अंतरित करें और मुझे सूचित करें।",
    "",
    "मैं भारत का/की नागरिक हूँ।",
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
    `संलग्नक: ${enclosures}`,
  );
}
