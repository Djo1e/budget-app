import { describe, it, expect } from "vitest";
import { buildSuggestionContext } from "../budget-suggestions";

describe("buildSuggestionContext", () => {
  it("summarizes last month's spending per category", () => {
    const result = buildSuggestionContext({
      categories: [
        { id: "c1", name: "Groceries", groupName: "Food" },
        { id: "c2", name: "Dining", groupName: "Food" },
      ],
      lastMonthTransactions: [
        { amount: 100, categoryId: "c1", type: "expense", date: "2026-01-15" },
        { amount: 200, categoryId: "c1", type: "expense", date: "2026-01-20" },
        { amount: 80, categoryId: "c2", type: "expense", date: "2026-01-10" },
      ],
      lastMonthAllocations: [
        { categoryId: "c1", assignedAmount: 400 },
        { categoryId: "c2", assignedAmount: 100 },
      ],
      totalIncome: 3000,
    });
    expect(result).toContain("Groceries");
    expect(result).toContain("300"); // spent
    expect(result).toContain("400"); // allocated
    expect(result).toContain("3000"); // income
  });
});
