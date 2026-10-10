import { expect, test } from "@playwright/test";

test("the open data page lists every dataset and downloads it as CSV", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Open data" }).click();
  await expect(page.getByRole("heading", { name: "Download the data" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Download CSV/ })).toHaveCount(5);

  const href = await page.getByRole("link", { name: "Download CSV: Seats and representatives" }).getAttribute("href");
  const csv = await request.get(href!);
  expect(csv.ok()).toBeTruthy();
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toContain("civiclens-representatives.csv");
  const [header, ...rows] = (await csv.text()).trim().split(/\r?\n/);
  expect(header).toContain("source");
  expect(rows.length).toBeGreaterThan(500);
});

test("an unknown file is a 404", async ({ request }) => {
  expect((await request.get("/data/nope.csv")).status()).toBe(404);
  expect((await request.get("/data/..%2Fsecret")).status()).toBe(404);
});
