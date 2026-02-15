import { describe, it, expect } from "vitest";
import {
  parseTransactionResponseSchema,
  buildParsePrompt,
} from "../ai/parse-transaction";

describe("parseTransactionResponseSchema", () => {
  it("validates a correct response", () => {
    const result = parseTransactionResponseSchema.safeParse({
      amount: 4.5,
      payeeName: "Starbucks",
      categoryName: "Coffee Shops",
      date: "2026-02-15",
    });
    expect(result.success).toBe(true);
  });

  it("allows optional categoryName", () => {
    const result = parseTransactionResponseSchema.safeParse({
      amount: 10,
      payeeName: "Store",
      date: "2026-02-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing amount", () => {
    const result = parseTransactionResponseSchema.safeParse({
      payeeName: "Store",
      date: "2026-02-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = parseTransactionResponseSchema.safeParse({
      amount: -5,
      payeeName: "Store",
      date: "2026-02-15",
    });
    expect(result.success).toBe(false);
  });
});

describe("buildParsePrompt", () => {
  it("includes category and payee names", () => {
    const prompt = buildParsePrompt("coffee 4.50", {
      categories: [{ id: "cat1", name: "Coffee Shops" }],
      payees: [{ id: "p1", name: "Starbucks" }],
    });
    expect(prompt).toContain("Coffee Shops");
    expect(prompt).toContain("Starbucks");
    expect(prompt).toContain("coffee 4.50");
  });
});
