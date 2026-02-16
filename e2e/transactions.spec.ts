import { test, expect } from "@playwright/test";
import { signupAndOnboard, addAccount } from "./helpers";

async function clickAddTransaction(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Add transaction" }).click();
}

// Helper to find visible text (TransactionRow renders both desktop and mobile views)
function visibleText(page: import("@playwright/test").Page, text: string) {
  return page.locator(`text="${text}" >> visible=true`).first();
}

test.describe("Transactions page", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, "Tx Tester");
    await addAccount(page, "Checking", 0);
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

    // Select first category — scope to dialog/sheet
    const form = page.getByRole("dialog");
    await form.locator('[data-slot="select-trigger"]').nth(0).click();
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
