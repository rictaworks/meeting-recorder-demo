import { test, expect } from "@playwright/test";

test.describe("session isolation", () => {
  test("page loads without authentication requirement", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });

  test("two separate contexts have independent sessions", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/");
    await page2.goto("/");

    const cookies1 = await context1.cookies();
    const cookies2 = await context2.cookies();

    await context1.close();
    await context2.close();

    const sessionCookies1 = cookies1.filter((c) => c.name.toLowerCase().includes("session"));
    const sessionCookies2 = cookies2.filter((c) => c.name.toLowerCase().includes("session"));

    if (sessionCookies1.length > 0 && sessionCookies2.length > 0) {
      expect(sessionCookies1[0].value).not.toBe(sessionCookies2[0].value);
    }
  });

  test("page is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const recorder = page.getByRole("button").first();
    await expect(recorder).toBeVisible();
  });
});
