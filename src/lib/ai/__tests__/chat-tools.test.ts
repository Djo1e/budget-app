import { describe, it, expect } from "vitest";
import { buildBudgetContext } from "../chat-tools";

describe("buildBudgetContext", () => {
  it("formats category and account data for the AI system prompt", () => {
    const result = buildBudgetContext({
      categories: [
        { id: "cat1", name: "Groceries", groupName: "Food" },
        { id: "cat2", name: "Restaurants", groupName: "Food" },
      ],
      accounts: [
        { id: "acc1", name: "Checking", type: "checking" },
      ],
      payees: [
        { id: "p1", name: "Walmart" },
      ],
    });
    expect(result).toContain("Groceries");
    expect(result).toContain("Checking");
    expect(result).toContain("Walmart");
  });
});
