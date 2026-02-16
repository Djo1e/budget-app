import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Signs up a new user and completes the 11-step lifestyle questionnaire onboarding.
 * The new onboarding creates category templates but does NOT create accounts or income.
 */
export async function signupAndOnboard(page: Page, name: string) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  await page.goto("/signup");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", "TestPassword123!");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

  // Step 1: Name
  await expect(page.getByText("Let's get started.")).toBeVisible({ timeout: 10000 });
  await page.fill("#onboarding-name", name);
  await page.click('button:has-text("Next")');

  // Step 2: Household — select "Myself"
  await expect(page.getByText("Who\u2019s in your household?")).toBeVisible();
  await page.click("text=Myself");
  await page.click('button:has-text("Next")');

  // Step 3: Home — select "I rent"
  await expect(page.getByText("Tell us about your home")).toBeVisible();
  await page.click("text=I rent");
  await page.click('button:has-text("Next")');

  // Step 4: Transportation — skip
  await expect(page.getByText("How do you get around?")).toBeVisible();
  await page.click("text=None of these apply to me");

  // Step 5: Debt — skip
  await expect(page.getByText("Do you currently have any debt?")).toBeVisible();
  await page.click("text=I don\u2019t currently have debt");

  // Step 6: Regular spending — select Groceries
  await expect(
    page.getByText("Which of these do you regularly spend money on?")
  ).toBeVisible();
  await page.click("text=Groceries");
  await page.click('button:has-text("Next")');

  // Step 7: Subscriptions — skip
  await expect(
    page.getByText("Which of these subscriptions do you have?")
  ).toBeVisible();
  await page.click("text=I don\u2019t subscribe to any of these");

  // Step 8: Less frequent — skip
  await expect(
    page.getByText("What less frequent expenses do you need to prepare for?")
  ).toBeVisible();
  await page.click("text=None of these apply to me");

  // Step 9: Goals — select Emergency fund
  await expect(
    page.getByText("What goals do you want to prioritize?")
  ).toBeVisible();
  await page.click("text=Emergency fund");
  await page.click('button:has-text("Next")');

  // Step 10: Fun spending — select Dining out, click Finish
  await expect(
    page.getByText("What else do you want to include in your plan?")
  ).toBeVisible();
  await page.click("text=Dining out");
  await page.click('button:has-text("Finish")');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Adds an account via the Accounts page UI.
 * Navigates to /accounts, creates the account, then returns.
 */
export async function addAccount(
  page: Page,
  name: string,
  balance: number,
  type?: string
) {
  await page.goto("/accounts");
  await expect(
    page.getByRole("heading", { name: "Accounts" })
  ).toBeVisible({ timeout: 10000 });

  await page.click('button:has-text("Add Account")');
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  await page.fill("#acct-name", name);
  if (type) {
    await page.locator('[data-slot="select-trigger"]').first().click();
    await page.getByRole("option", { name: type }).click();
  }
  await page.fill("#acct-balance", String(balance));
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add Account" })
    .click();

  await expect(page.getByText(name)).toBeVisible({ timeout: 5000 });
}

/**
 * Adds income via the Budget page UI.
 * Navigates to /budget, adds income entry, then returns.
 */
export async function addIncome(
  page: Page,
  amount: number,
  label = "Monthly Income"
) {
  await page.goto("/budget");
  await expect(page.getByText("Ready to Assign")).toBeVisible({
    timeout: 10000,
  });

  await page.click('button:has-text("Add Income")');
  await page.fill("#income-amount", String(amount));
  await page.fill("#income-label", label);
  await page.click('button[type="submit"]:has-text("Add")');

  // Wait for the income to be reflected
  const formatted = `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  await expect(page.getByText(formatted)).toBeVisible({ timeout: 5000 });
}
