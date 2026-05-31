import { test, expect } from "@playwright/test";

test.describe("record flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(["microphone"]);
    await page.goto("/");
  });

  test("page loads and shows recorder button", async ({ page }) => {
    const button = page.getByRole("button").first();
    await expect(button).toBeVisible();
  });

  test("page does not use native alert/confirm/prompt", async ({ page }) => {
    const alerts: string[] = [];
    page.on("dialog", (dialog) => {
      alerts.push(dialog.type());
      dialog.dismiss();
    });
    await page.goto("/");
    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });

  test("language selector is visible", async ({ page }) => {
    const select = page.getByRole("combobox");
    await expect(select).toBeVisible();
  });

  test("no native dialog is triggered on page load", async ({ page }) => {
    let nativeDialogTriggered = false;
    page.on("dialog", () => {
      nativeDialogTriggered = true;
    });
    await page.goto("/");
    await page.waitForTimeout(500);
    expect(nativeDialogTriggered).toBe(false);
  });
});
