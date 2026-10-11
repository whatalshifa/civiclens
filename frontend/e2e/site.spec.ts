import { expect, test } from "@playwright/test";

// What a link preview, a search engine and a phone's home screen see, and the states a visitor
// meets off the main path: a page that doesn't exist, and keyboard-only use.

const PAGES: { path: string; title: RegExp }[] = [
  { path: "/", title: /^CivicLens: know who represents you/ },
  { path: "/services", title: /^Find your MP and MLA · CivicLens$/ },
  { path: "/seats", title: /^Every Lok Sabha seat and its MP · CivicLens$/ },
  { path: "/laws/bnss-2023", title: /^BNSS in plain language · CivicLens$/ },
  { path: "/pin/413102", title: /^Representatives for Baramati/ },
  { path: "/rti", title: /^Draft an RTI application · CivicLens$/ },
];

test("every page has its own title, description, canonical address and preview card", async ({ page }) => {
  for (const { path, title } of PAGES) {
    await page.goto(path);
    await expect(page, path).toHaveTitle(title);
    const meta = (selector: string) => page.locator(selector).first().getAttribute("content");
    expect(await meta('meta[name="description"]'), path).toBeTruthy();
    expect(await meta('meta[property="og:title"]'), path).toBe(await page.title());
    expect(await meta('meta[property="og:image"]'), path).toMatch(/\/og\.png$/);
    expect(await meta('meta[name="twitter:card"]'), path).toBe("summary_large_image");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname, path).toBe(path);
  }
});

test("the icons, manifest, robots.txt and sitemap are served", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  for (const path of ["/og.png", "/favicon.ico", "/icon.svg", "/icon-512.png", "/icon-maskable-512.png"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.short_name).toBe("CivicLens");
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/</loc>", "/services</loc>", "/laws/bnss-2023</loc>"]) expect(sitemap).toContain(path);
});

test("a missing page says so in the brand, with a way back", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found · CivicLens");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  await page.getByRole("link", { name: "Find your representatives" }).click();
  await expect(page).toHaveURL(/\/services$/);
});

test("the law search has a heading before anything is typed", async ({ page }) => {
  await page.goto("/laws/search");
  await expect(page.getByRole("heading", { level: 1, name: "Search the law in plain words" })).toBeVisible();
});

test("keyboard: the skip link comes first and Escape closes the phone menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/services");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const menu = page.getByRole("button", { name: "Menu" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Law library" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});
