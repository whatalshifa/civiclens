import { expect, test } from "@playwright/test";

test("every Lok Sabha seat is listed by state, and each opens with its sources", async ({ page }) => {
  await page.goto("/seats");
  await expect(page.getByRole("heading", { level: 1, name: "Every seat and its MP" })).toBeVisible();
  await expect(page.getByText(/All 543 Lok Sabha constituencies/)).toBeVisible();

  await page.getByRole("navigation", { name: "States" }).getByRole("link", { name: "Kerala" }).click();
  await expect(page).toHaveURL(/#kerala$/);
  await page.getByRole("link", { name: /^Kollam/ }).click();

  await expect(page).toHaveURL(/\/seats\/ls-kollam$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kollam");
  await expect(page.getByRole("heading", { name: /N K Premachandran/ })).toBeVisible();
  // A member list says who sits now, not when they were elected, so the card says when it was listed.
  await expect(page.getByText(/Sitting member of the 18th Lok Sabha, as listed on/)).toBeVisible();
  await expect(page.getByText(/result declared/)).toHaveCount(0);
  for (const href of await page.locator("a.ref").evaluateAll((links) => links.map((a) => a.getAttribute("href")))) {
    await expect(page.locator(href!)).toBeVisible();
  }
});

test("a vacant seat says why", async ({ page }) => {
  await page.goto("/seats/ls-shillong");
  await expect(page.getByText(/shows this seat as vacant \(previous member died\)/)).toBeVisible();
  await expect(page.getByText(/haven't placed PIN codes in this seat yet/)).toBeVisible();
});

test("a PIN code page links to its seats, and the seat page back to its PIN codes", async ({ page }) => {
  await page.goto("/pin/413102");
  await page.getByRole("link", { name: "Baramati, Maharashtra" }).first().click();
  await expect(page).toHaveURL(/\/seats\/ls-baramati$/);
  await expect(page.getByRole("heading", { name: /Supriya Sule/ })).toBeVisible();
  await expect(page.getByText("result declared 4 June 2024")).toBeVisible();
  await page.getByRole("link", { name: /413102/ }).click();
  await expect(page).toHaveURL(/\/pin\/413102$/);
});

test("an unknown seat is a 404", async ({ page }) => {
  const response = await page.goto("/seats/ls-nowhere");
  expect(response?.status()).toBe(404);
});
