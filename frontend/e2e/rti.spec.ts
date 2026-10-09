import { expect, test } from "@playwright/test";

test("the letter is written as the form is filled in", async ({ page }) => {
  await page.goto("/rti");
  const letter = page.getByRole("article", { name: "Letter preview" });
  await expect(page.getByText(/Still to fill in: the office you are writing to/)).toBeVisible();

  await page.getByLabel(/Public authority/).fill("Pune Municipal Corporation");
  await page
    .getByLabel("Information you are asking for")
    .fill("- Copies of the road repair contract\n2. The amount paid so far");
  await page.getByLabel("Your name").fill("Asha Kulkarni");
  await page.getByLabel("Your address").fill("12 Shivaji Nagar, Pune 411005");
  await expect(page.getByText(/Still to fill in/)).toHaveCount(0);

  await expect(letter).toContainText("The Public Information Officer\nPune Municipal Corporation");
  await expect(letter).toContainText("1. Copies of the road repair contract\n2. The amount paid so far");
  await expect(letter).toContainText("Rs. 10 by Indian Postal Order");
  await expect(letter).toContainText("Asha Kulkarni");

  await page.getByLabel("Exempt: I hold a BPL card").check();
  await expect(letter).toContainText("proviso to Section 7(5)");
  await expect(letter).toContainText("Enclosure: Copy of BPL card");

  await page.getByLabel(/life or liberty/).check();
  await expect(letter).toContainText("within 48 hours");

  await page.getByRole("radio", { name: "हिंदी" }).click();
  await expect(page.getByRole("radio", { name: "हिंदी" })).toHaveAttribute("aria-checked", "true");
  await expect(letter).toContainText("लोक सूचना अधिकारी");
  await expect(letter).toContainText("48 घंटे");
});

test("the letter downloads as a text file", async ({ page }) => {
  await page.goto("/rti?authority=Pune%20Municipal%20Corporation&info=Copies%20of%20the%20contract");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("rti-application.txt");
});

test("nothing typed in the form is sent anywhere", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" || request.url().includes("Kulkarni")) sent.push(request.url());
  });
  await page.goto("/rti");
  await page.getByLabel("Your name").fill("Asha Kulkarni");
  await page.getByLabel("Your address").fill("12 Shivaji Nagar");
  await page.waitForTimeout(300);
  expect(sent).toEqual([]);
});
