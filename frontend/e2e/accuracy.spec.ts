import { expect, test } from "@playwright/test";

test("the accuracy page counts sample answers and says live answers haven't started", async ({ page }) => {
  await page.goto("/assistant?sample=arrest");
  await expect(page.getByRole("heading", { name: "Sections this answer is based on" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Accuracy" }).click();
  await expect(page.getByRole("heading", { name: "How accurate is the rights assistant?" })).toBeVisible();

  const live = page.getByRole("region", { name: "Live answers" });
  await expect(live).toContainText("None yet. The AI is switched off");

  const demo = page.getByRole("region", { name: "Sample answers (demo)" });
  const answers = Number(await demo.getByText("Answers").locator("xpath=following-sibling::dd").textContent());
  expect(answers).toBeGreaterThanOrEqual(1);
  await expect(demo.getByText("Removed as unread").locator("xpath=following-sibling::dd")).toHaveText("0");
  await expect(demo).toContainText("Counted since");
});
