import { describe, it, expect } from "vitest";
import { getDefaultCategoryTemplate } from "../category-template";

describe("getDefaultCategoryTemplate", () => {
  it("returns 10 groups", () => {
    expect(getDefaultCategoryTemplate()).toHaveLength(10);
  });

  it("has all expected group names", () => {
    const names = getDefaultCategoryTemplate().map((g) => g.name);
    expect(names).toEqual([
      "Housing",
      "Utilities",
      "Food",
      "Transportation",
      "Health",
      "Entertainment",
      "Shopping",
      "Financial",
      "Personal",
      "Miscellaneous",
    ]);
  });

  it("has ~25 total categories", () => {
    const total = getDefaultCategoryTemplate().reduce(
      (s, g) => s + g.categories.length,
      0
    );
    expect(total).toBeGreaterThanOrEqual(24);
    expect(total).toBeLessThanOrEqual(30);
  });

  it("has sequential sortOrder on groups", () => {
    getDefaultCategoryTemplate().forEach((g, i) =>
      expect(g.sortOrder).toBe(i)
    );
  });

  it("has sequential sortOrder on categories within groups", () => {
    getDefaultCategoryTemplate().forEach((g) => {
      g.categories.forEach((c, i) => expect(c.sortOrder).toBe(i));
    });
  });

  it("marks all categories as isDefault: true", () => {
    getDefaultCategoryTemplate().forEach((g) => {
      g.categories.forEach((c) => expect(c.isDefault).toBe(true));
    });
  });

  it("has Uncategorized in Miscellaneous", () => {
    const misc = getDefaultCategoryTemplate().find(
      (g) => g.name === "Miscellaneous"
    )!;
    expect(misc.categories.map((c) => c.name)).toContain("Uncategorized");
  });
});
