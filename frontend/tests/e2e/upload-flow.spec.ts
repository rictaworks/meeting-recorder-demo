import { test, expect } from "@playwright/test";

test.describe("upload flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("file uploader area is visible", async ({ page }) => {
    const uploadButton = page.getByRole("button", { name: /click|select/i });
    await expect(uploadButton).toBeVisible();
  });

  test("file input accepts audio formats", async ({ page }) => {
    const fileInput = page.locator("input[type='file']");
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toContain(".wav");
    expect(accept).toContain(".mp3");
    expect(accept).toContain(".webm");
    expect(accept).toContain(".ogg");
  });

  test("honeypot field exists and is hidden", async ({ page }) => {
    const honeypot = page.locator("input[name='website']");
    await expect(honeypot).toBeHidden();
  });

  test("honeypot field is empty by default", async ({ page }) => {
    const honeypot = page.locator("input[name='website']");
    const value = await honeypot.inputValue();
    expect(value).toBe("");
  });
});
