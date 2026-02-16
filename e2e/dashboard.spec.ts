import { test, expect } from "@playwright/test";
import { signupAndOnboard, addAccount, addIncome } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page, "Dash Tester");
    await addAccount(page, "Checking", 0);
    await addIncome(page, 5000);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
  });

  test("shows ready to assign banner", async ({ page }) => {
    await expect(page.getByText("Ready to Assign")).toBeVisible();
    await expect(page.getByText("$5,000.00")).toBeVisible();
  });

  test("shows accounts widget", async ({ page }) => {
    await expect(page.getByText("Accounts", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Checking", { exact: true }).first()).toBeVisible();
  });

  test("shows empty transactions widget", async ({ page }) => {
    await expect(page.getByText("Recent Transactions")).toBeVisible();
    await expect(page.getByText("No transactions yet")).toBeVisible();
  });

  test("view all links navigate correctly", async ({ page }) => {
    const viewAllButtons = page.locator('a[href="/transactions"] button:has-text("View All")');
    await viewAllButtons.first().click();
    await expect(page).toHaveURL(/\/transactions/, { timeout: 5000 });

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
    const accountsLink = page.locator('a[href="/accounts"] button:has-text("View All")');
    await accountsLink.first().click();
    await expect(page).toHaveURL(/\/accounts/, { timeout: 5000 });
  });

  test("ready to assign banner links to budget", async ({ page }) => {
    await page.getByText("Ready to Assign").click();
    await expect(page).toHaveURL(/\/budget/, { timeout: 5000 });
  });
});
