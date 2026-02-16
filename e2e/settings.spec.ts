import { test, expect } from "@playwright/test";
import { signupAndOnboard } from "./helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, "Settings Tester");
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 5000 });
  });

  test("displays profile information", async ({ page }) => {
    await expect(page.getByText("Settings Tester")).toBeVisible();
    await expect(page.getByText("USD")).toBeVisible();
  });

  test("can edit name", async ({ page }) => {
    await page.click('[data-testid="edit-name"]');
    const input = page.getByRole("textbox");
    await input.fill("New Name");
    await input.press("Enter");
    await expect(page.getByText("Name updated")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("New Name")).toBeVisible();
  });

  test("manage accounts link navigates to accounts page", async ({ page }) => {
    await page.click("text=Manage Accounts");
    await expect(page).toHaveURL(/\/accounts/);
  });

  test("manage categories link navigates to budget page", async ({ page }) => {
    await page.click("text=Manage Categories");
    await expect(page).toHaveURL(/\/budget/);
  });
});
