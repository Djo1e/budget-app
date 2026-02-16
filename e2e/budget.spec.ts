import { test, expect } from "@playwright/test";
import { signupAndOnboard, addAccount, addIncome } from "./helpers";

// Assign money to first category, handling both desktop (inline edit) and mobile (drawer)
async function assignToFirstCategory(page: import("@playwright/test").Page, amount: string) {
  const firstAssigned = page.locator('button:has-text("$0.00"):visible').first();
  await firstAssigned.click();

  const input = page.locator('input[type="number"]:visible').first();
  await input.fill(amount);

  // On mobile, the AssignmentDrawer has a "Done" button; on desktop, just blur
  const doneBtn = page.getByRole("button", { name: "Done" });
  if (await doneBtn.isVisible().catch(() => false)) {
    await doneBtn.click();
  } else {
    await input.blur();
  }
}

test.describe("Budget page", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, "Budget Tester");
    await addAccount(page, "Checking", 0);
    await addIncome(page, 5000);
    await page.goto("/budget");
    await expect(page.getByText("Ready to Assign")).toBeVisible({ timeout: 10000 });
  });

  test("shows ready to assign with full income", async ({ page }) => {
    // Should show $5,000 ready to assign (nothing assigned during onboarding)
    await expect(page.getByText("$5,000.00")).toBeVisible();
  });

  test("assigning money decreases ready to assign", async ({ page }) => {
    await assignToFirstCategory(page, "1000");

    // Ready to assign should decrease
    await expect(page.getByText("$4,000.00")).toBeVisible({ timeout: 5000 });
  });

  test("over-assigning shows warning", async ({ page }) => {
    await assignToFirstCategory(page, "6000");

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
    await expect(page.locator("text=Ready to Assign").locator("..").getByText("$0.00")).toBeVisible({ timeout: 5000 });

    // Navigate back
    await page.click('[aria-label="Previous month"]');

    // Should show original amount again
    await expect(page.getByText("$5,000.00")).toBeVisible({ timeout: 5000 });
  });
});
