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
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

    // Step 1: Currency
    await expect(page.getByText("Pick your currency")).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 2: Accounts
    await expect(page.getByText("Add your accounts")).toBeVisible();
    await page.fill('#accountName', "Checking");
    await page.fill('#initialBalance', "0");
    await page.click('button:has-text("Add account")');
    await expect(page.getByText("Checking")).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 3: Income
    await expect(page.getByText("How much do you have to budget?")).toBeVisible();
    await page.fill('#amount', "4000");
    await page.click('button:has-text("Next")');

    // Step 4: Categories
    await expect(page.getByText("Your categories")).toBeVisible();
    await page.click('button:has-text("Next")');

    // Step 5: Assign budget
    await expect(page.getByText("Assign your money")).toBeVisible();
    await page.click('button:has-text("Finish")');

    // Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
