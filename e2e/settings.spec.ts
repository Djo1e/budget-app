import { test, expect } from "@playwright/test";

async function signupAndOnboard(page: import("@playwright/test").Page) {
  const email = `settings-test-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.fill('#name', "Settings Tester");
  await page.fill('#email', email);
  await page.fill('#password', "TestPassword123!");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

  await page.click('button:has-text("Next")');

  await page.fill('#accountName', "Checking");
  await page.fill('#initialBalance', "0");
  await page.click('button:has-text("Add account")');
  await expect(page.getByText("Checking")).toBeVisible();
  await page.click('button:has-text("Next")');

  await page.fill('#amount', "5000");
  await page.click('button:has-text("Next")');

  await expect(page.getByText("Your categories")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Next")');

  await expect(page.getByText("Assign your money")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Finish")');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
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
