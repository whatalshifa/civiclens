import { expect, test } from "@playwright/test";

test("typing a PIN code shows the MP and MLA, each with numbered sources", async ({ page }) => {
  await page.goto("/services");
  await page.getByLabel("PIN code or constituency").fill("413 102");
  await page.getByRole("button", { name: "Find" }).click();

  await expect(page).toHaveURL(/\/pin\/413102$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Baramati");
  await expect(page.getByRole("heading", { name: /Supriya Sule/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Sunetra Ajit Pawar/ })).toBeVisible();
  await expect(page.getByText("result declared 4 June 2024")).toBeVisible();

  // Every reference number points at an entry in the source list.
  const refs = page.locator("a.ref");
  expect(await refs.count()).toBeGreaterThanOrEqual(4);
  for (const href of await refs.evaluateAll((links) => links.map((a) => a.getAttribute("href")))) {
    await expect(page.locator(href!)).toBeVisible();
  }
  await expect(page.locator("#source-1 a")).toHaveAttribute("href", /^https:\/\//);
});

test("a dated fact shows when it was true", async ({ page }) => {
  await page.goto("/pin/221001");
  await expect(page.getByText("Prime Minister of India")).toBeVisible();
  await expect(page.getByText("(as of 10 June 2024)")).toBeVisible();
  // No MLA in the data for this PIN yet, and the page says so instead of leaving a gap.
  await expect(page.getByRole("heading", { name: "Not in CivicLens yet" })).toBeVisible();
});

test("a bad PIN is caught before leaving the page", async ({ page }) => {
  await page.goto("/services");
  await page.getByLabel("PIN code or constituency").fill("01234");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.getByText(/Type a six-digit PIN code/)).toBeVisible();
  await expect(page).toHaveURL("/services");
});

test("a PIN we don't have yet offers ones we do", async ({ page }) => {
  await page.goto("/pin/999999");
  await expect(page.getByRole("heading", { name: "We don't have this PIN code yet" })).toBeVisible();
  await page.getByRole("link", { name: /110001/ }).click();
  await expect(page).toHaveURL(/\/pin\/110001$/);
  await expect(page.getByRole("heading", { name: /Bansuri Swaraj/ })).toBeVisible();
});

test("the PIN form works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/services");
  await page.getByLabel("PIN code or constituency").fill("695001");
  await page.getByLabel("PIN code or constituency").press("Enter");
  await expect(page).toHaveURL(/\/pin\/695001$/);
  await expect(page.getByRole("heading", { name: /Shashi Tharoor/ })).toBeVisible();
  await context.close();
});

test("a constituency name with one match opens its seat", async ({ page }) => {
  await page.goto("/services");
  await page.getByLabel("PIN code or constituency").fill("Kollam");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page).toHaveURL(/\/seats\/ls-kollam$/);
});

test("a name with several matches lists seats and places", async ({ page }) => {
  await page.goto("/find?q=Baramati");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Baramati");
  await expect(page.getByRole("heading", { name: /Lok Sabha seats/ })).toBeVisible();
  await page.getByRole("link", { name: /413102/ }).click();
  await expect(page).toHaveURL(/\/pin\/413102$/);
});

test("a name that matches nothing says what to try", async ({ page }) => {
  await page.goto("/find?q=Atlantis");
  await expect(page.getByRole("heading", { name: /Nothing matches/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /browse every Lok Sabha seat/ })).toBeVisible();
});

test("searching by name works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/services");
  await page.getByLabel("PIN code or constituency").fill("Kollam");
  await page.getByLabel("PIN code or constituency").press("Enter");
  await expect(page).toHaveURL(/\/seats\/ls-kollam$/);
  await context.close();
});
