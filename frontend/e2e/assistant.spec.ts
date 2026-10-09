import { expect, test } from "@playwright/test";

test("a sample question unfolds step by step and ends in a cited answer", async ({ page }) => {
  await page.goto("/assistant");
  await page.getByRole("link", { name: /police arrested my brother/ }).click();

  const result = page.getByRole("region", { name: /police arrested my brother/ });
  await expect(result.getByText("Searching and reading the law")).toBeVisible();
  await expect(result.getByText("Read BNSS section 47")).toBeVisible();
  await expect(result.getByText("Sections this answer is based on")).toBeVisible();
  await expect(page).toHaveURL(/\/assistant\?sample=arrest$/);

  // Each citation links to the exact section it is based on.
  const first = result.getByRole("link", { name: /^Source 1: BNSS, Section 47/ }).first();
  await first.click();
  await expect(page).toHaveURL(/\/laws\/bnss-2023#s-47$/);
  await expect(page.locator("#s-47")).toBeInViewport();
});

test("a sample's address shows the finished answer straight away", async ({ page }) => {
  await page.goto("/assistant?sample=school-donation");
  const result = page.getByRole("region", { name: /donation/ });
  await expect(result.getByText(/No school may collect a donation/)).toBeVisible();
  await expect(result.getByText("How this was answered: 5 steps")).toBeVisible();
  await expect(result.getByRole("link", { name: /RTE Act, Section 13/ })).toHaveCount(2); // in the text and the list
});

test("the ration card sample hands over to a filled-in RTI application", async ({ page }) => {
  await page.goto("/assistant?sample=ration-card");
  await page.getByRole("link", { name: "Open the RTI application" }).click();
  await expect(page).toHaveURL(/\/rti\?/);
  await expect(page.getByLabel(/Public authority/)).toHaveValue(/District Supply Officer/);
  await expect(page.getByRole("article", { name: "Letter preview" })).toContainText(
    "1. The current status of my ration card",
  );
});

test("with the AI off, other questions get the matching sections and an explanation", async ({ page }) => {
  await page.goto("/assistant");
  await page.getByLabel("Describe your situation or ask a question").fill("How do I file an RTI appeal?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page.getByText(/The AI is switched off on this demo/)).toBeVisible();
  await expect(page.getByRole("link", { name: "See all matching sections" })).toBeVisible();
  await expect(page).toHaveURL(/\/assistant$/); // a typed question never goes in the address
});

test("sample answers work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/assistant");
  await page.getByRole("link", { name: /faulty phone/ }).click();
  await expect(page.getByText("Sections this answer is based on")).toBeVisible();
  await context.close();
});
