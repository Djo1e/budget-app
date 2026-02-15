import { describe, it, expect } from "vitest";
import { formatSpendingByCategory, formatAccountBalances } from "../ai/chat-tools";

describe("formatSpendingByCategory", () => {
  it("groups transactions by category and sums amounts", () => {
    const transactions = [
      { amount: 10, categoryId: "cat1", date: "2026-02-05", type: "expense" as const },
      { amount: 20, categoryId: "cat1", date: "2026-02-10", type: "expense" as const },
      { amount: 15, categoryId: "cat2", date: "2026-02-07", type: "expense" as const },
    ];
    const categoryMap = { cat1: "Groceries", cat2: "Coffee" };
    const result = formatSpendingByCategory(transactions, categoryMap, "2026-02");
    expect(result).toContain("Groceries");
    expect(result).toContain("30.00");
    expect(result).toContain("Coffee");
    expect(result).toContain("15.00");
  });

  it("filters to the specified month", () => {
    const transactions = [
      { amount: 10, categoryId: "cat1", date: "2026-02-05", type: "expense" as const },
      { amount: 99, categoryId: "cat1", date: "2026-01-05", type: "expense" as const },
    ];
    const categoryMap = { cat1: "Groceries" };
    const result = formatSpendingByCategory(transactions, categoryMap, "2026-02");
    expect(result).toContain("10.00");
    expect(result).not.toContain("99.00");
  });
});

describe("formatAccountBalances", () => {
  it("computes balances from initial minus expenses", () => {
    const accounts = [
      { name: "Checking", initialBalance: 1000, _id: "a1", type: "checking" as const },
    ];
    const transactions = [
      { amount: 50, accountId: "a1", type: "expense" as const },
      { amount: 30, accountId: "a1", type: "expense" as const },
    ];
    const result = formatAccountBalances(accounts, transactions);
    expect(result).toContain("Checking");
    expect(result).toContain("920.00");
  });
});
