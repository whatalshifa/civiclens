import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the landing page leads with the statement, the search and the seat map", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/543 seats\.\s*One of them is yours\./);
  await expect(page.getByLabel("PIN code or constituency")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Lok Sabha seats by state" })).toBeAttached();
  await expect(page.getByRole("link", { name: "Uttar Pradesh, 80 seats" })).toBeAttached();
});

test("the search works right in the hero", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("PIN code or constituency").fill("413102");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page).toHaveURL(/\/pin\/413102$/);
  await expect(page.getByRole("heading", { name: /Supriya Sule/ })).toBeVisible();
});

test("the header's call to action opens the app, and the app's About goes back", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Open the app" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("heading", { level: 1, name: "Find your MP and MLA" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the old About page sends people to the landing page", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#neutral")).toBeAttached();
  await expect(page.locator("#sources")).toBeAttached();
});

test("everyday situations link to the real sections of the law", async ({ page }) => {
  await page.goto("/");
  const rights = page.getByRole("region", { name: /The law, in the words/ });
  await expect(rights.getByRole("heading", { name: /I’ve been arrested/ })).toBeVisible();
  await rights.getByRole("link", { name: "Read section 173 of the BNSS" }).click();
  await expect(page).toHaveURL(/\/laws\/bnss-2023#s-173$/);
});

test("the RTI example is the drafter's real output, in English and Hindi", async ({ page }) => {
  await page.goto("/");
  const letter = page.getByRole("region", { name: "Letter preview" });
  await expect(letter).toContainText("The Public Information Officer");
  await expect(letter).toContainText("Pune Municipal Corporation");
  await page.getByRole("radio", { name: "हिंदी" }).click();
  await expect(letter).toContainText("लोक सूचना अधिकारी");
});

test("the landing page doesn't scroll sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const theme of ["light", "dark"] as const) {
  test(`the landing page meets WCAG AA in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id} ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
}
