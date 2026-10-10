import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/pin/413102",
  "/pin/999999",
  "/seats",
  "/seats/ls-kollam",
  "/seats/ls-shillong",
  "/laws",
  "/laws/rti-act-2005",
  "/laws/search?q=arrest",
  "/laws/bns-2023",
  "/laws/old-to-new?q=IPC%20420",
  "/about",
  "/assistant?sample=arrest",
  "/rti?authority=Municipal%20Corporation&info=Copies%20of%20the%20road%20repair%20contract",
];

for (const theme of ["light", "dark"] as const) {
  test(`pages meet WCAG AA in ${theme} mode`, async ({ page }) => {
    test.slow(); // the list of every seat is a long page to check
    await page.emulateMedia({ colorScheme: theme });
    for (const path of PAGES) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${path}: ${v.id} ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
    }
  });
}

test("no page scrolls sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of PAGES) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
