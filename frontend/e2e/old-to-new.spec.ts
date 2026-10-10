import { expect, test } from "@playwright/test";

test("an old IPC number leads to the new BNS section", async ({ page }) => {
  await page.goto("/laws");
  await page.getByRole("link", { name: "Find its new BNS or BNSS section" }).click();
  await page.getByLabel("Old section").fill("IPC 420");
  await page.getByRole("button", { name: "Find" }).click();

  await expect(page).toHaveURL(/\/laws\/old-to-new\?q=IPC\+420/);
  await expect(page.getByText("IPC 420 is now BNS 318(4)")).toBeVisible();
  await page.getByRole("link", { name: "Read BNS 318 in plain language" }).click();
  await expect(page).toHaveURL(/\/laws\/bns-2023#s-318$/);
  await expect(page.locator("#s-318")).toContainText("Cheating");
});

test("the tables list every code with its source", async ({ page }) => {
  await page.goto("/laws/old-to-new?q=IPC%20377");
  await expect(page.getByText("IPC 377 has no new section")).toBeVisible();
  for (const name of ["IPC to BNS", "CrPC to BNSS", "Evidence Act to BSA"]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  const ipc = page.getByRole("region", { name: "IPC to BNS table" });
  await expect(ipc.getByRole("row", { name: /498A 85 Cruelty/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Where these tables come from" })).toBeVisible();
  await expect(page.locator("#source-1")).toContainText("Central Academy for Police Training");
});

test("searching the library for an old number answers with the new one first", async ({ page }) => {
  await page.goto("/laws/search?q=CrPC%20438");
  await expect(page.getByText("CrPC 438 is now BNSS 482")).toBeVisible();
});

test("an unknown number says so", async ({ page }) => {
  await page.goto("/laws/old-to-new?q=IPC%20999");
  await expect(page.getByText("We don't have 999 in the tables below yet")).toBeVisible();
});

test("the lookup works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/laws/old-to-new");
  await page.getByLabel("Old section").fill("Evidence Act 65B");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.getByText("Evidence Act 65B is now BSA 63")).toBeVisible();
  await context.close();
});
