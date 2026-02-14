import { test, expect } from "@playwright/test";

test.describe("Onboarding flow", () => {
  const testUser = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
  };

  test("full signup to dashboard flow", async ({ page }) => {
    // Visit root — should redirect to login
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);

    // Navigate to signup
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL(/\/signup/);

    // Fill signup form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

    // Step 1: Currency
    await expect(page.getByText("Currency")).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 2: Accounts
    await expect(page.getByText("Accounts")).toBeVisible();
    await page.fill('input[name="accountName"]', "Checking");
    await page.click('button:has-text("Add")');
    await expect(page.getByText("Checking")).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 3: Income
    await expect(page.getByText("Income")).toBeVisible();
    await page.fill('input[name="income"]', "4000");
    await page.click('button:has-text("Next")');

    // Step 4: Categories
    await expect(page.getByText("Categories")).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 5: Assign budget
    await expect(page.getByText("Assign")).toBeVisible();
    await page.click('button:has-text("Finish")');

    // Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
