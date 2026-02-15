import { test, expect } from "@playwright/test";

async function signupAndOnboard(page: import("@playwright/test").Page) {
  const email = `acct-test-${Date.now()}@example.com`;

  await page.goto("/signup");
  await expect(page.locator('#name')).toBeVisible({ timeout: 10000 });
  await page.fill('#name', "Acct Tester");
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

test.describe("Accounts page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
    await page.goto("/accounts");
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible({ timeout: 10000 });
  });

  test("shows accounts from onboarding", async ({ page }) => {
    await expect(page.getByText("Checking", { exact: true }).first()).toBeVisible();
  });

  test("add a new account", async ({ page }) => {
    await page.click('button:has-text("Add Account")');

    await page.fill("#acct-name", "Savings");
    // Select savings type
    await page.locator('[data-slot="select-trigger"]').first().click();
    await page.getByRole("option", { name: "Savings" }).click();
    await page.fill("#acct-balance", "1000");
    await page.locator('[data-slot="sheet-content"] button').filter({ hasText: "Add Account" }).click();

    await expect(page.getByText("Savings")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("$1,000.00")).toBeVisible();
  });

  test("edit account", async ({ page }) => {
    // Click edit on the Checking account
    await page.locator('button:has-text("Edit")').first().click();

    await expect(page.getByText("Edit Account")).toBeVisible({ timeout: 5000 });
    await page.fill("#acct-name", "Main Checking");
    await page.click('button:has-text("Save Changes")');

    await expect(page.getByText("Main Checking")).toBeVisible({ timeout: 5000 });
  });

  test("balance updates after transaction", async ({ page }) => {
    // Note the initial balance
    await expect(page.getByText("Checking", { exact: true }).first()).toBeVisible();

    // Add a transaction via transactions page
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible({ timeout: 10000 });

    // On desktop click header "Add" button, on mobile click the FAB
    const addBtn = page.getByRole("button", { name: "Add" });
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
    } else {
      await page.getByRole("button", { name: "Add transaction" }).click();
    }
    await page.fill("#tx-amount", "200");
    await page.fill("#tx-payee", "Test Store");
    await page.getByRole("button", { name: "Add Transaction" }).click();
    await expect(page.locator('text="Test Store" >> visible=true').first()).toBeVisible({ timeout: 5000 });

    // Go back to accounts
    await page.goto("/accounts");
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible({ timeout: 10000 });

    // Balance should reflect the expense (initial 0 - 200 = -200)
    await expect(page.getByText("-$200.00")).toBeVisible({ timeout: 5000 });
  });
});
