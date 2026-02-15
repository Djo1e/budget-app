import { test, expect } from "@playwright/test";

async function signupAndOnboard(page: import("@playwright/test").Page) {
  const email = `tx-test-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.fill('#name', "Tx Tester");
  await page.fill('#email', email);
  await page.fill('#password', "TestPassword123!");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

  // Step 1: Currency
  await page.click('button:has-text("Next")');

  // Step 2: Accounts
  await page.fill('#accountName', "Checking");
  await page.fill('#initialBalance', "0");
  await page.click('button:has-text("Add account")');
  await expect(page.getByText("Checking")).toBeVisible();
  await page.click('button:has-text("Next")');

  // Step 3: Income
  await page.fill('#amount', "5000");
  await page.click('button:has-text("Next")');

  // Step 4: Categories
  await expect(page.getByText("Your categories")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Next")');

  // Step 5: Assign
  await expect(page.getByText("Assign your money")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Finish")');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function clickAddTransaction(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Add transaction" }).click();
}

// Helper to find visible text (TransactionRow renders both desktop and mobile views)
function visibleText(page: import("@playwright/test").Page, text: string) {
  return page.locator(`text="${text}" >> visible=true`).first();
}

test.describe("Transactions page", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible({ timeout: 10000 });
  });

  test("shows empty state initially", async ({ page }) => {
    await expect(page.getByText("No transactions yet")).toBeVisible();
  });

  test("add transaction and it appears in list", async ({ page }) => {
    await clickAddTransaction(page);

    // Wait for drawer to open
    await expect(page.getByRole("heading", { name: "Add Transaction" })).toBeVisible({ timeout: 5000 });

    // Fill form inside drawer
    await page.fill("#tx-amount", "42.50");
    await page.fill("#tx-payee", "Coffee Shop");

    // Submit
    await page.getByRole("button", { name: "Add Transaction" }).click();

    // Should appear in list
    await expect(visibleText(page, "Coffee Shop")).toBeVisible({ timeout: 5000 });
    await expect(visibleText(page, "-$42.50")).toBeVisible();
  });

  test("edit and delete transaction", async ({ page }) => {
    // Add a transaction first
    await clickAddTransaction(page);
    await expect(page.getByRole("heading", { name: "Add Transaction" })).toBeVisible({ timeout: 5000 });
    await page.fill("#tx-amount", "20");
    await page.fill("#tx-payee", "Book Store");
    await page.getByRole("button", { name: "Add Transaction" }).click();
    await expect(visibleText(page, "Book Store")).toBeVisible({ timeout: 5000 });

    // Click to edit
    await visibleText(page, "Book Store").click();

    // Should open edit drawer
    await expect(page.getByText("Edit Transaction")).toBeVisible({ timeout: 5000 });

    // Delete
    await page.getByRole("button", { name: "Delete Transaction" }).click();

    // Should be gone
    await expect(page.getByText("No transactions yet")).toBeVisible({ timeout: 5000 });
  });

  test("transaction shows in budget activity", async ({ page }) => {
    // Add a transaction with a category
    await clickAddTransaction(page);
    await expect(page.getByRole("heading", { name: "Add Transaction" })).toBeVisible({ timeout: 5000 });

    await page.fill("#tx-amount", "100");
    await page.fill("#tx-payee", "Grocery Store");

    // Select first category — use selectors scoped to the drawer
    const drawer = page.locator('[data-slot="sheet-content"]');
    await drawer.locator('[data-slot="select-trigger"]').nth(0).click();
    await page.locator('[data-slot="select-item"]').first().click();

    // Submit
    await page.getByRole("button", { name: "Add Transaction" }).click();
    await expect(visibleText(page, "Grocery Store")).toBeVisible({ timeout: 5000 });

    // Go to budget page and check activity
    await page.goto("/budget");
    await expect(page.getByText("Ready to Assign")).toBeVisible({ timeout: 10000 });
    // The $100 expense should show as negative available (-$100.00) on the category
    await expect(visibleText(page, "-$100.00")).toBeVisible({ timeout: 5000 });
  });
});
