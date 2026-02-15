import { test, expect } from "@playwright/test";

async function signupAndOnboard(page: import("@playwright/test").Page) {
  const email = `ai-test-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.fill('#name', "AI Tester");
  await page.fill('#email', email);
  await page.fill('#password', "TestPassword123!");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

  await page.click('button:has-text("Next")');

  await page.fill('#accountName', "Checking");
  await page.fill('#initialBalance', "1000");
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

test.describe("NL Quick-Add", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
  });

  test("shows NL quick-add input on dashboard", async ({ page }) => {
    const nlInput = page.getByPlaceholder(/Try/);
    await expect(nlInput).toBeVisible();
  });

  test("parses natural language and pre-fills transaction form", async ({ page }) => {
    const nlInput = page.getByPlaceholder(/Try/);
    await nlInput.fill("coffee 4.50");
    await nlInput.press("Enter");

    // Wait for the form drawer to open with pre-filled amount
    await expect(page.locator('[id="tx-amount"]')).toBeVisible({ timeout: 15000 });
    const amountValue = await page.locator('[id="tx-amount"]').inputValue();
    expect(parseFloat(amountValue)).toBe(4.5);
  });

  test("shows NL quick-add on transactions page", async ({ page }) => {
    await page.goto("/transactions");
    await page.waitForSelector("text=Transactions");
    const nlInput = page.getByPlaceholder(/Try/);
    await expect(nlInput).toBeVisible();
  });
});

test.describe("Chat Widget", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
  });

  test("opens and closes chat widget", async ({ page }) => {
    await page.getByLabel("Open chat").click();
    await expect(page.getByText("Budget Assistant")).toBeVisible();
    await expect(page.getByPlaceholder("Ask a question...")).toBeVisible();

    await page.getByLabel("Close chat").click();
    await expect(page.getByText("Budget Assistant")).not.toBeVisible();
  });

  test("sends a message and gets a response", async ({ page }) => {
    await page.getByLabel("Open chat").click();

    const chatInput = page.getByPlaceholder("Ask a question...");
    await chatInput.fill("What are my account balances?");
    await chatInput.press("Enter");

    // Wait for an assistant response to appear
    const assistantMessage = page.locator(".bg-muted").filter({ hasNotText: "" });
    await expect(assistantMessage.last()).toBeVisible({ timeout: 30000 });
  });
});
