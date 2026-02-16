import { test, expect } from "@playwright/test";

test.describe("Onboarding flow", () => {
  const testUser = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
  };

  test("full signup to dashboard flow", async ({ page }) => {
    // Visit root — shows landing page with Get Started link
    await page.goto("/");
    await page.click("text=Get Started");
    await expect(page).toHaveURL(/\/signup/);

    // Fill signup form
    await page.fill("#name", testUser.name);
    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

    // Step 1: Name
    await expect(page.getByText("Let\u2019s get started.")).toBeVisible();
    await page.fill("#onboarding-name", "TestName");
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

    // Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
