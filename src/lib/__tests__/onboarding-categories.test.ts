import { describe, it, expect } from "vitest";
import { buildCategoryTemplate, initialSelections, type OnboardingSelections } from "../onboarding-categories";

describe("buildCategoryTemplate", () => {
  it("always includes Miscellaneous > Uncategorized even with no selections", () => {
    const result = buildCategoryTemplate(initialSelections);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Miscellaneous");
    expect(result[0].categories[0].name).toBe("Uncategorized");
  });

  it("creates Housing group with rent categories when rent selected", () => {
    const selections: OnboardingSelections = { ...initialSelections, home: "rent" };
    const result = buildCategoryTemplate(selections);
    const housing = result.find((g) => g.name === "Housing");
    expect(housing).toBeDefined();
    const catNames = housing!.categories.map((c) => c.name);
    expect(catNames).toContain("Rent");
    expect(catNames).toContain("Renters insurance");
  });

  it("creates Housing group with own categories when own selected", () => {
    const selections: OnboardingSelections = { ...initialSelections, home: "own" };
    const result = buildCategoryTemplate(selections);
    const housing = result.find((g) => g.name === "Housing");
    expect(housing).toBeDefined();
    const catNames = housing!.categories.map((c) => c.name);
    expect(catNames).toContain("Mortgage");
    expect(catNames).toContain("Home insurance");
    expect(catNames).toContain("Property taxes");
    expect(catNames).toContain("Home maintenance");
  });

  it("creates Transportation categories for car selection", () => {
    const selections: OnboardingSelections = { ...initialSelections, transportation: ["car"] };
    const result = buildCategoryTemplate(selections);
    const transport = result.find((g) => g.name === "Transportation");
    expect(transport).toBeDefined();
    const catNames = transport!.categories.map((c) => c.name);
    expect(catNames).toContain("Gas/Fuel");
    expect(catNames).toContain("Car insurance");
    expect(catNames).toContain("Car maintenance");
  });

  it("creates Debt group for multiple debt selections", () => {
    const selections: OnboardingSelections = {
      ...initialSelections,
      debt: ["credit-card", "student-loans"],
    };
    const result = buildCategoryTemplate(selections);
    const debt = result.find((g) => g.name === "Debt");
    expect(debt).toBeDefined();
    const catNames = debt!.categories.map((c) => c.name);
    expect(catNames).toContain("Credit card payments");
    expect(catNames).toContain("Student loan payments");
  });

  it("deduplicates categories when same category from multiple selections", () => {
    const selections: OnboardingSelections = {
      ...initialSelections,
      household: ["partner"],
      funSpending: ["their-spending-money"],
    };
    const result = buildCategoryTemplate(selections);
    const personal = result.find((g) => g.name === "Personal");
    expect(personal).toBeDefined();
    const matching = personal!.categories.filter((c) => c.name === "Their spending money");
    expect(matching).toHaveLength(1);
  });

  it("assigns sequential sortOrder to groups", () => {
    const selections: OnboardingSelections = {
      ...initialSelections,
      home: "rent",
      transportation: ["car"],
      regularSpending: ["groceries"],
    };
    const result = buildCategoryTemplate(selections);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].sortOrder).toBe(i);
    }
  });

  it("handles full selection scenario", () => {
    const selections: OnboardingSelections = {
      name: "Test",
      household: ["myself", "partner", "kids", "pets"],
      home: "own",
      transportation: ["car", "public-transit"],
      debt: ["credit-card"],
      regularSpending: ["groceries", "clothing"],
      subscriptions: ["music", "tv-streaming"],
      lessFrequent: ["medical-expenses"],
      goals: ["emergency-fund", "vacation"],
      funSpending: ["dining-out", "entertainment", "hobbies"],
    };
    const result = buildCategoryTemplate(selections);
    const groupNames = result.map((g) => g.name);
    expect(groupNames).toContain("Housing");
    expect(groupNames).toContain("Food");
    expect(groupNames).toContain("Transportation");
    expect(groupNames).toContain("Family");
    expect(groupNames).toContain("Debt");
    expect(groupNames).toContain("Shopping");
    expect(groupNames).toContain("Subscriptions");
    expect(groupNames).toContain("Entertainment");
    expect(groupNames).toContain("Personal");
    expect(groupNames).toContain("Less Frequent");
    expect(groupNames).toContain("Savings Goals");
    expect(groupNames).toContain("Miscellaneous");
  });
});
