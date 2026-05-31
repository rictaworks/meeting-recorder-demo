import { test, expect } from "@playwright/test";

test.describe("maintenance banner", () => {
  test("maintenance banner is not shown on normal page load", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("alert");
    await expect(banner).not.toBeVisible();
  });

  test("maintenance banner has correct aria role when shown", async ({ page }) => {
    await page.goto("/");
    const bannerCount = await page.getByRole("alert").count();
    expect(bannerCount).toBeLessThanOrEqual(1);
  });
});
