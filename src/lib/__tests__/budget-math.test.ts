import { describe, it, expect } from "vitest";
import {
  calculateReadyToAssign,
  calculateCategorySpent,
  calculateAccountBalance,
} from "../budget-math";

describe("calculateReadyToAssign", () => {
  it("returns income minus allocations", () => {
    const transactions = [
      { amount: 3000, date: "2026-02-01", type: "income" as const, categoryId: undefined },
      { amount: 1000, date: "2026-02-15", type: "income" as const, categoryId: undefined },
    ];
    const allocs = [
      { assignedAmount: 1500, month: "2026-02" },
      { assignedAmount: 500, month: "2026-02" },
    ];
    expect(calculateReadyToAssign(transactions, allocs, "2026-02")).toBe(2000);
  });

  it("returns full income when no allocations", () => {
    expect(
      calculateReadyToAssign(
        [{ amount: 4000, date: "2026-02-01", type: "income" as const, categoryId: undefined }],
        [],
        "2026-02"
      )
    ).toBe(4000);
  });

  it("returns negative when over-assigned", () => {
    expect(
      calculateReadyToAssign(
        [{ amount: 1000, date: "2026-02-01", type: "income" as const, categoryId: undefined }],
        [{ assignedAmount: 1500, month: "2026-02" }],
        "2026-02"
      )
    ).toBe(-500);
  });

  it("returns 0 when empty", () => {
    expect(calculateReadyToAssign([], [], "2026-02")).toBe(0);
  });

  it("filters by month", () => {
    const transactions = [
      { amount: 3000, date: "2026-02-01", type: "income" as const, categoryId: undefined },
      { amount: 2000, date: "2026-01-15", type: "income" as const, categoryId: undefined },
    ];
    const allocs = [
      { assignedAmount: 1000, month: "2026-02" },
      { assignedAmount: 500, month: "2026-01" },
    ];
    expect(calculateReadyToAssign(transactions, allocs, "2026-02")).toBe(2000);
  });

  it("ignores expense transactions", () => {
    const transactions = [
      { amount: 3000, date: "2026-02-01", type: "income" as const, categoryId: undefined },
      { amount: 50, date: "2026-02-05", type: "expense" as const, categoryId: "cat1" },
    ];
    expect(calculateReadyToAssign(transactions, [], "2026-02")).toBe(3000);
  });
});

describe("calculateCategorySpent", () => {
  it("sums expense transactions for category in month", () => {
    const txns = [
      {
        amount: 50,
        categoryId: "cat1",
        date: "2026-02-05",
        type: "expense" as const,
      },
      {
        amount: 30,
        categoryId: "cat1",
        date: "2026-02-15",
        type: "expense" as const,
      },
      {
        amount: 100,
        categoryId: "cat2",
        date: "2026-02-10",
        type: "expense" as const,
      },
    ];
    expect(calculateCategorySpent(txns, "cat1", "2026-02")).toBe(80);
  });

  it("returns 0 for no matches", () => {
    expect(calculateCategorySpent([], "cat1", "2026-02")).toBe(0);
  });
});

describe("calculateAccountBalance", () => {
  it("subtracts expenses from initial balance", () => {
    const txns = [
      { amount: 50, type: "expense" as const },
      { amount: 100, type: "expense" as const },
    ];
    expect(calculateAccountBalance(5000, txns)).toBe(4850);
  });

  it("adds income to balance", () => {
    const txns = [
      { amount: 3000, type: "income" as const },
      { amount: 50, type: "expense" as const },
    ];
    expect(calculateAccountBalance(1000, txns)).toBe(3950);
  });

  it("returns initial balance with no transactions", () => {
    expect(calculateAccountBalance(5000, [])).toBe(5000);
  });
});
