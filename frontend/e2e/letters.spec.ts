import { readFile } from "node:fs/promises";

import { expect, type Page, test } from "@playwright/test";

const letter = (page: Page) => page.getByRole("article", { name: "Letter preview" });

function daysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

test("the RTI fee and portal follow the state", async ({ page }) => {
  await page.goto("/rti");
  const government = page.getByLabel("Which government runs the office");
  await expect(page.getByText("Fee: ₹10")).toBeVisible();
  await expect(page.getByRole("link", { name: "rtionline.gov.in" }).first()).toBeVisible();

  await government.selectOption({ label: "Gujarat" });
  await expect(page.getByText("Fee: ₹20")).toBeVisible();
  await expect(page.getByText("Gujarat State Information Commission")).toBeVisible();
  await expect(letter(page)).toContainText("application fee of Rs. 20 by Indian Postal Order");
  await page.getByRole("radio", { name: "हिंदी" }).click();
  await expect(letter(page)).toContainText("₹20 का आवेदन शुल्क");

  await government.selectOption({ label: "Maharashtra" });
  await expect(page.getByRole("link", { name: "rtionline.maharashtra.gov.in" })).toBeVisible();

  await government.selectOption({ label: "Delhi" });
  await expect(page.getByText("Second appeals go to the Central Information Commission")).toBeVisible();
});

test("a sent application gives a reminder and fills in the first appeal", async ({ page }) => {
  await page.goto("/rti");
  await page.getByLabel(/Public authority/).fill("Pune Municipal Corporation");
  await page.getByLabel("Information you are asking for").fill("Copies of the road repair contract");
  await page.getByLabel("Your name").fill("Asha Kulkarni");
  await page.getByLabel("Your address").fill("12 Shivaji Nagar, Pune 411005");

  await page.getByLabel("I sent it on").fill(daysAgo(40));
  await page.getByRole("button", { name: "Save in this browser" }).click();
  await expect(page.getByText("The reply is due by")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add a reminder to my calendar" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("rti-reply-due.ics");
  const ics = await readFile((await file.path())!, "utf8");
  expect(ics).toContain("BEGIN:VEVENT");
  expect(ics).toContain(`DTSTART;VALUE=DATE:${daysAgo(10).replace(/-/g, "")}`);
  expect(ics.split("\r\n").every((line) => Buffer.byteLength(line) <= 75)).toBe(true);

  await page.getByRole("link", { name: "Draft the first appeal" }).click();
  await expect(page).toHaveURL(/\/rti\/appeal$/);
  await expect(letter(page)).toContainText("The First Appellate Authority");
  await page.getByRole("button", { name: "Fill in from it" }).click();
  await expect(page.getByLabel("Public authority you applied to")).toHaveValue("Pune Municipal Corporation");
  // Sent 40 days ago with no reply date: the reply is overdue, so "no reply" is ticked.
  await expect(page.getByLabel(/No reply within 30 days/)).toBeChecked();
  await expect(letter(page)).toContainText("deemed to have been refused");
  await expect(letter(page)).toContainText("free of charge as Section 7(6)");
  await expect(letter(page)).toContainText("1. Copies of the road repair contract");
  await expect(page.getByText(/Still to fill in/)).toHaveCount(0);

  await page.getByLabel("Date of the reply, if one came").fill(daysAgo(5));
  await expect(letter(page)).toContainText("3. Copy of the reply from the Public Information Officer");
  await page.getByRole("radio", { name: "हिंदी" }).click();
  await expect(letter(page)).toContainText("प्रथम अपीलीय अधिकारी");

  await page.goto("/rti");
  await page.getByRole("button", { name: "Forget it" }).click();
  await expect(page.getByRole("button", { name: "Save in this browser" })).toBeVisible();
  await page.goto("/rti/appeal");
  await expect(page.getByRole("button", { name: "Fill in from it" })).toHaveCount(0);
});

test("the consumer complaint cites the right section", async ({ page }) => {
  await page.goto("/letters");
  await page.getByRole("link", { name: /Consumer complaint/ }).click();
  await expect(page.getByText(/Still to fill in: the business/)).toBeVisible();

  await page.getByLabel("Seller or service provider").fill("QuickFix Appliances");
  await page.getByLabel("What it was").fill("a washing machine repair");
  await page.getByLabel(/A service/).check();
  await page.getByLabel("Amount paid (₹)").fill("2,500");
  await page.getByLabel("What went wrong").fill("The machine stopped again the next day\nThree calls, no visit");
  await page.getByLabel("Compensation for the loss").check();
  await page.getByLabel("Compensation asked (₹)").fill("1000");
  await page.getByLabel("Your name").fill("Asha Kulkarni");
  await page.getByLabel("Your address").fill("12 Shivaji Nagar, Pune 411005");
  await expect(page.getByText(/Still to fill in/)).toHaveCount(0);

  await expect(letter(page)).toContainText("paid Rs. 2500");
  await expect(letter(page)).toContainText("deficiency in service within the meaning of Section 2(11)");
  await expect(letter(page)).toContainText("refund the full amount I paid, and pay compensation");
  await expect(letter(page)).toContainText("(Rs. 1000), within 15 days");
  await expect(letter(page)).toContainText("Section 35");
  await expect(page.getByRole("link", { name: "1915" })).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBe("consumer-complaint.txt");
});

test("the police complaint goes to the SP under section 173(4)", async ({ page }) => {
  await page.goto("/letters/police");
  await page.getByLabel("District").fill("Pune Rural");
  await page.getByLabel("Police station that refused").fill("Baramati");
  await page.getByLabel("What happened").fill("My motorcycle was stolen from outside my house.");
  await page.getByLabel("Your name").fill("Asha Kulkarni");
  await page.getByLabel("Your address").fill("12 Shivaji Nagar, Pune 411005");

  await expect(letter(page)).toContainText("The Superintendent of Police\nPune Rural district");
  await expect(letter(page)).toContainText("went to Baramati police station");
  await expect(letter(page)).toContainText("as Section 173(4) allows");
  await expect(letter(page)).toContainText("The people responsible: not known to me");
  await page.getByRole("radio", { name: "हिंदी" }).click();
  await expect(letter(page)).toContainText("पुलिस अधीक्षक");
  await expect(page.getByRole("link", { name: "112", exact: true })).toBeVisible();
});

test("free help shows on the law pages", async ({ page }) => {
  await page.goto("/laws/consumer-protection-act-2019");
  const help = page.getByRole("region", { name: "Get free help from a real person" });
  await expect(help).toContainText("Tele-Law");
  await expect(help).toContainText("1915");
  await page.goto("/laws/rti-act-2005");
  await expect(page.getByRole("region", { name: "Get free help from a real person" })).not.toContainText("1915");
});

test("nothing typed in the letters is sent anywhere", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" || request.url().includes("Kulkarni")) sent.push(request.url());
  });
  for (const path of ["/rti/appeal", "/letters/consumer", "/letters/police"]) {
    await page.goto(path);
    await page.getByLabel("Your name").fill("Asha Kulkarni");
    await page.getByLabel("Your address").fill("12 Shivaji Nagar");
  }
  await page.waitForTimeout(300);
  expect(sent).toEqual([]);
});
