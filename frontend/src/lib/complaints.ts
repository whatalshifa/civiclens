/**
 * Two more letters in the same pattern as the RTI drafter: a consumer complaint to a seller or
 * service provider (the written notice to send before going to the Consumer Commission), and a
 * complaint to the Superintendent of Police when a police station won't register an FIR
 * (section 173(4) of the BNSS). Both run in the browser only.
 */

import { blank, formatDate, items, type Language, lines, numbered } from "@/lib/letters";

// Consumer complaint

export type Remedy = "refund" | "replace" | "repair" | "compensate";

export type ConsumerDraft = {
  language: Language;
  business: string;
  businessAddress: string;
  kind: "goods" | "service";
  product: string;
  orderRef: string;
  boughtOn: string;
  amount: string;
  problem: string;
  remedies: Remedy[];
  compensation: string;
  days: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  place: string;
  date: string;
};

export const EMPTY_CONSUMER: ConsumerDraft = {
  language: "en",
  business: "",
  businessAddress: "",
  kind: "goods",
  product: "",
  orderRef: "",
  boughtOn: "",
  amount: "",
  problem: "",
  remedies: ["refund"],
  compensation: "",
  days: "15",
  name: "",
  address: "",
  phone: "",
  email: "",
  place: "",
  date: "",
};

export const REMEDIES: Record<Remedy, { label: string; en: string; hi: string }> = {
  refund: {
    label: "A full refund",
    en: "refund the full amount I paid",
    hi: "मेरे द्वारा चुकाई गई पूरी राशि वापस करें",
  },
  replace: { label: "A replacement", en: "replace it with one free of defects", hi: "इसके स्थान पर दोषरहित वस्तु दें" },
  repair: {
    label: "A repair, or the service done properly",
    en: "repair it, or provide the service properly, at no cost to me",
    hi: "बिना किसी शुल्क के इसकी मरम्मत करें, या सेवा ठीक से प्रदान करें",
  },
  compensate: {
    label: "Compensation for the loss",
    en: "pay compensation for the loss and inconvenience caused",
    hi: "हुई हानि और असुविधा के लिए क्षतिपूर्ति दें",
  },
};

export function consumerMissing(d: ConsumerDraft): string[] {
  const out: string[] = [];
  if (!d.business.trim()) out.push("the business");
  if (!d.product.trim()) out.push("what you bought");
  if (items(d.problem).length === 0) out.push("what went wrong");
  if (d.remedies.length === 0) out.push("what you want");
  if (!d.name.trim()) out.push("your name");
  if (!d.address.trim()) out.push("your address");
  return out;
}

function rupees(amount: string, language: Language): string {
  const n = amount.replace(/[^\d.]/g, "");
  if (!n) return "__________";
  return language === "hi" ? `₹${n}` : `Rs. ${n}`;
}

export function buildConsumer(d: ConsumerDraft): string {
  const problem = numbered(items(d.problem));
  const days = Number.parseInt(d.days, 10) > 0 ? Number.parseInt(d.days, 10) : 15;
  const asks = (Object.keys(REMEDIES) as Remedy[])
    .filter((r) => d.remedies.includes(r))
    .map((r) => {
      const text = REMEDIES[r][d.language];
      return r === "compensate" && d.compensation.trim() ? `${text} (${rupees(d.compensation, d.language)})` : text;
    });
  const contact = [d.phone.trim(), d.email.trim()].filter(Boolean);
  return d.language === "hi"
    ? consumerHindi(d, problem, asks, days, contact)
    : consumerEnglish(d, problem, asks, days, contact);
}

function consumerEnglish(d: ConsumerDraft, problem: string, asks: string[], days: number, contact: string[]): string {
  const ref = d.orderRef.trim() ? ` (order or invoice no. ${d.orderRef.trim()})` : "";
  const what = d.kind === "goods" ? "bought" : "paid for";
  const law =
    d.kind === "goods"
      ? "These are defects in the goods within the meaning of Section 2(10) of the Consumer Protection Act, 2019."
      : "This is a deficiency in service within the meaning of Section 2(11) of the Consumer Protection Act, 2019.";
  return lines(
    "To",
    blank(d.business),
    d.businessAddress.trim() || false,
    "",
    `Subject: Complaint about ${blank(d.product, "my purchase")}${ref}`,
    "",
    "Sir/Madam,",
    "",
    `On ${formatDate(d.boughtOn, "en")} I ${what} ${blank(d.product)} from you and paid ${rupees(d.amount, "en")}${ref}.`,
    "",
    "The problem:",
    problem,
    "",
    law,
    "",
    `I ask you to ${asks.length ? asks.join(", and ") : "____________________"}, within ${days} days of receiving this letter.`,
    "",
    `If this is not resolved within ${days} days, I will file a complaint before the District Consumer Disputes Redressal Commission under Section 35 of the Act, and ask for compensation and costs as well.`,
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
    "Enclosures: Copy of the bill or receipt, and photos or other proof of the problem",
  );
}

function consumerHindi(d: ConsumerDraft, problem: string, asks: string[], days: number, contact: string[]): string {
  const ref = d.orderRef.trim() ? ` (ऑर्डर/बिल संख्या ${d.orderRef.trim()})` : "";
  const law =
    d.kind === "goods"
      ? "उपभोक्ता संरक्षण अधिनियम, 2019 की धारा 2(10) के अर्थ में ये माल में त्रुटियाँ हैं।"
      : "उपभोक्ता संरक्षण अधिनियम, 2019 की धारा 2(11) के अर्थ में यह सेवा में कमी है।";
  return lines(
    "सेवा में,",
    blank(d.business),
    d.businessAddress.trim() || false,
    "",
    `विषय: ${blank(d.product, "मेरी खरीद")}${ref} के संबंध में शिकायत`,
    "",
    "महोदय/महोदया,",
    "",
    `मैंने ${formatDate(d.boughtOn, "hi")} को आपसे ${blank(d.product)} ${
      d.kind === "goods" ? "खरीदा" : "की सेवा ली"
    } और ${rupees(d.amount, "hi")} का भुगतान किया${ref}।`,
    "",
    "समस्या:",
    problem,
    "",
    law,
    "",
    `मेरा अनुरोध है कि यह पत्र मिलने के ${days} दिनों के भीतर आप ${asks.length ? asks.join(", और ") : "____________________"}।`,
    "",
    `यदि ${days} दिनों के भीतर इसका समाधान नहीं होता है, तो मैं अधिनियम की धारा 35 के अंतर्गत जिला उपभोक्ता विवाद प्रतितोष आयोग के समक्ष शिकायत दर्ज करूँगा/करूँगी, और क्षतिपूर्ति तथा खर्च की भी माँग करूँगा/करूँगी।`,
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
    "संलग्नक: बिल या रसीद की प्रति, और समस्या के फ़ोटो या अन्य प्रमाण",
  );
}

// Police complaint when an FIR is refused

export type PoliceDraft = {
  language: Language;
  district: string;
  station: string;
  wentOn: string;
  happenedOn: string;
  happenedAt: string;
  details: string;
  accused: string;
  witnesses: string;
  refusal: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  place: string;
  date: string;
};

export const EMPTY_POLICE: PoliceDraft = {
  language: "en",
  district: "",
  station: "",
  wentOn: "",
  happenedOn: "",
  happenedAt: "",
  details: "",
  accused: "",
  witnesses: "",
  refusal: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  place: "",
  date: "",
};

export function policeMissing(d: PoliceDraft): string[] {
  const out: string[] = [];
  if (!d.district.trim()) out.push("the district");
  if (!d.station.trim()) out.push("the police station");
  if (items(d.details).length === 0) out.push("what happened");
  if (!d.name.trim()) out.push("your name");
  if (!d.address.trim()) out.push("your address");
  return out;
}

export function buildPolice(d: PoliceDraft): string {
  const details = items(d.details).join("\n") || "____________________";
  const contact = [d.phone.trim(), d.email.trim()].filter(Boolean);
  return d.language === "hi" ? policeHindi(d, details, contact) : policeEnglish(d, details, contact);
}

function policeEnglish(d: PoliceDraft, details: string, contact: string[]): string {
  return lines(
    "To",
    "The Superintendent of Police",
    `${blank(d.district)} district`,
    "",
    "Subject: Complaint under Section 173(4) of the Bharatiya Nagarik Suraksha Sanhita, 2023, as the police station did not register an FIR",
    "",
    "Sir/Madam,",
    "",
    `1. On ${formatDate(d.happenedOn, "en")}, at ${blank(d.happenedAt)}, the following happened:`,
    details,
    "",
    d.accused.trim() ? `2. The people responsible: ${d.accused.trim()}` : "2. The people responsible: not known to me",
    d.witnesses.trim() ? `3. Witnesses: ${d.witnesses.trim()}` : "3. Witnesses: none named",
    "",
    `4. On ${formatDate(d.wentOn, "en")} I went to ${blank(d.station)} police station to report this, but the officer in charge did not register a First Information Report.${
      d.refusal.trim() ? ` ${d.refusal.trim()}` : ""
    }`,
    "",
    "5. These facts disclose a cognizable offence, which the officer in charge was required to record under Section 173(1) of the Sanhita.",
    "",
    "6. I therefore send you the substance of this information in writing, as Section 173(4) allows, and request that you investigate the case yourself or direct a police officer subordinate to you to investigate it, and that a copy of the FIR be given to me.",
    "",
    "The facts stated above are true to the best of my knowledge.",
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
    "Enclosures: Copies of any documents, photos or medical records about the incident",
  );
}

function policeHindi(d: PoliceDraft, details: string, contact: string[]): string {
  return lines(
    "सेवा में,",
    "पुलिस अधीक्षक",
    `जिला ${blank(d.district)}`,
    "",
    "विषय: भारतीय नागरिक सुरक्षा संहिता, 2023 की धारा 173(4) के अंतर्गत शिकायत, क्योंकि थाने ने प्रथम सूचना रिपोर्ट दर्ज नहीं की",
    "",
    "महोदय/महोदया,",
    "",
    `1. दिनांक ${formatDate(d.happenedOn, "hi")} को ${blank(d.happenedAt)} पर निम्नलिखित घटना हुई:`,
    details,
    "",
    d.accused.trim() ? `2. जिम्मेदार व्यक्ति: ${d.accused.trim()}` : "2. जिम्मेदार व्यक्ति: मुझे ज्ञात नहीं",
    d.witnesses.trim() ? `3. गवाह: ${d.witnesses.trim()}` : "3. गवाह: कोई नाम नहीं",
    "",
    `4. दिनांक ${formatDate(d.wentOn, "hi")} को मैं इसकी रिपोर्ट करने ${blank(d.station)} थाने गया/गई, परंतु थाना प्रभारी ने प्रथम सूचना रिपोर्ट दर्ज नहीं की।${
      d.refusal.trim() ? ` ${d.refusal.trim()}` : ""
    }`,
    "",
    "5. इन तथ्यों से एक संज्ञेय अपराध बनता है, जिसे संहिता की धारा 173(1) के अंतर्गत थाना प्रभारी द्वारा दर्ज किया जाना आवश्यक था।",
    "",
    "6. अतः धारा 173(4) के अनुसार मैं यह सूचना लिखित रूप में आपको भेज रहा/रही हूँ, और अनुरोध करता/करती हूँ कि आप स्वयं इस मामले का अन्वेषण करें या अपने अधीनस्थ किसी पुलिस अधिकारी को अन्वेषण का निर्देश दें, और प्रथम सूचना रिपोर्ट की एक प्रति मुझे दी जाए।",
    "",
    "ऊपर दिए गए तथ्य मेरी जानकारी में सत्य हैं।",
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
    "संलग्नक: घटना से संबंधित दस्तावेज़ों, फ़ोटो या चिकित्सा अभिलेखों की प्रतियाँ",
  );
}
