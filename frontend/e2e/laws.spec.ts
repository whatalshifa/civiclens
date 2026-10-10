import { expect, test } from "@playwright/test";

test("an everyday question finds the right section and jumps to it", async ({ page }) => {
  // The home page is the representatives lookup; the law search lives on the law library page.
  await page.goto("/laws");
  await page.getByLabel("Search the laws").fill("police won't register my FIR");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/laws\/search\?q=/);
  const first = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { level: 2 }) })
    .first();
  await expect(first).toContainText("BNSS · Section 173");
  await expect(first.locator("mark").first()).toBeVisible();

  await first.getByRole("link").click();
  await expect(page).toHaveURL(/\/laws\/bnss-2023#s-173$/);
  await expect(page.locator("#s-173")).toBeInViewport();
  await expect(page.locator("#s-173")).toContainText("Zero FIR");
});

test("search can be narrowed to one law", async ({ page }) => {
  await page.goto("/laws/search?q=appeal");
  await page.getByRole("link", { name: "RTI Act", exact: true }).click();
  await expect(page.getByText("Only in")).toBeVisible();
  const labels = await page.locator("ol p.text-xs").allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) expect(label).toContain("RTI Act");
});

test("a search with no matches suggests what to do next", async ({ page }) => {
  await page.goto("/laws/search?q=zzzz");
  await expect(page.getByRole("heading", { name: "Nothing found for “zzzz”" })).toBeVisible();
  await expect(page.getByRole("link", { name: "browse all laws" })).toBeVisible();
});

test("every act page says its summaries are not the law and links the official text", async ({ page }) => {
  await page.goto("/laws");
  const acts = await page
    .locator("main ul a[href^='/laws/']")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(acts.length).toBeGreaterThanOrEqual(6);
  for (const href of acts) {
    await page.goto(href!);
    await expect(page.getByText("not the law itself")).toBeVisible();
    await expect(page.getByRole("link", { name: /Official text/ })).toHaveAttribute("href", /^https:\/\//);
  }
});

test("law search works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/laws");
  await page.getByLabel("Search the laws").fill("bail");
  await page.getByLabel("Search the laws").press("Enter");
  await expect(page.getByRole("heading", { name: /match “bail”/ })).toBeVisible();
  await context.close();
});
