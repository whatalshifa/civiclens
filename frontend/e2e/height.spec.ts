import { expect, test } from "@playwright/test";

// No endless scrolling: on a desktop screen the key pages of the service fit in about two screens,
// with long lists, long acts and secondary material behind panes, tabs and disclosures.
const BUDGET = 2.25; // screens of 1440 by 900

const PAGES = [
  "/services",
  "/pin/413102",
  "/seats",
  "/seats#uttar-pradesh",
  "/seats/ls-kollam",
  "/laws",
  "/laws/bns-2023",
  "/laws/bnss-2023#s-173",
  "/laws/search?q=police%20won%27t%20register%20my%20FIR",
  "/laws/old-to-new?q=IPC%20420",
  "/assistant?sample=arrest",
  "/rti",
  "/rti/appeal",
  "/letters/consumer",
  "/letters/police",
  "/data",
];

test("key pages stay within two screens on a desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a desktop budget");
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of PAGES) {
    await page.goto(path);
    if (path.includes("sample=")) {
      await expect(page.getByRole("heading", { name: "Sections this answer is based on" })).toBeVisible();
    }
    const screens = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
    expect(screens, path).toBeLessThanOrEqual(BUDGET);
  }
});
