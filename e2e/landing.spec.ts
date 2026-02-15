import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("shows hero for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
  });

  test("get started navigates to signup", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Get Started");
    await expect(page).toHaveURL(/\/signup/);
  });
});
