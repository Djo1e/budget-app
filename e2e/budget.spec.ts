import { test, expect } from "@playwright/test";

// Helper: create a fresh user and complete onboarding
async function signupAndOnboard(page: import("@playwright/test").Page) {
  const email = `budget-test-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.fill('input[name="name"]', "Budget Tester");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "TestPassword123!");
  await page.click('button[type="submit"]');

  // Onboarding
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

  // Step 1: Currency — just proceed with USD
  await page.click('button:has-text("Next")');

  // Step 2: Accounts — add a checking account
  await page.fill('input[name="accountName"]', "Checking");
  await page.click('button:has-text("Add")');
  await expect(page.getByText("Checking")).toBeVisible();
  await page.click('button:has-text("Next")');

  // Step 3: Income — add $5000
  await page.fill('input[name="income"]', "5000");
  await page.click('button:has-text("Next")');

  // Step 4: Categories — use defaults
  await expect(page.getByText("Your categories")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Next")');

  // Step 5: Assign — skip assignment, just finish
  await expect(page.getByText("Assign your money")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Finish")');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Budget page", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
    await page.goto("/budget");
    await expect(page.getByText("Ready to Assign")).toBeVisible({ timeout: 10000 });
  });

  test("shows ready to assign with full income", async ({ page }) => {
    // Should show $5,000 ready to assign (nothing assigned during onboarding)
    await expect(page.getByText("$5,000.00")).toBeVisible();
  });

  test("assigning money decreases ready to assign", async ({ page }) => {
    // Click on the first $0.00 assigned amount to edit it
    const firstAssigned = page.locator('button:has-text("$0.00")').first();
    await firstAssigned.click();

    // Type 1000 in the input
    const input = page.locator('input[type="number"]').first();
    await input.fill("1000");
    await input.blur();

    // Ready to assign should decrease
    await expect(page.getByText("$4,000.00")).toBeVisible({ timeout: 5000 });
  });

  test("over-assigning shows warning", async ({ page }) => {
    // Assign more than income to a single category
    const firstAssigned = page.locator('button:has-text("$0.00")').first();
    await firstAssigned.click();

    const input = page.locator('input[type="number"]').first();
    await input.fill("6000");
    await input.blur();

    // Should show negative/warning state
    await expect(page.getByText("You have assigned more than your income")).toBeVisible({
      timeout: 5000,
    });
  });

  test("add income mid-month increases ready to assign", async ({ page }) => {
    // Click Add Income button
    await page.click('button:has-text("Add Income")');

    // Fill in income dialog
    await page.fill('#income-amount', "2000");
    await page.fill('#income-label', "Freelance");
    await page.click('button[type="submit"]:has-text("Add")');

    // Ready to assign should now be $7,000
    await expect(page.getByText("$7,000.00")).toBeVisible({ timeout: 5000 });
  });

  test("month navigation shows fresh budget", async ({ page }) => {
    // Navigate to next month
    await page.click('[aria-label="Next month"]');

    // Should show $0.00 ready to assign (no income in next month)
    await expect(page.getByText("$0.00")).toBeVisible({ timeout: 5000 });

    // Navigate back
    await page.click('[aria-label="Previous month"]');

    // Should show original amount again
    await expect(page.getByText("$5,000.00")).toBeVisible({ timeout: 5000 });
  });
});
