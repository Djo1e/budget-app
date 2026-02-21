import { describe, it, expect } from "vitest";
import { predictCategorySpending } from "../spending-predictions";

describe("predictCategorySpending", () => {
  it("projects overspend when pace exceeds budget", () => {
    const result = predictCategorySpending({
      spent: 200,
      allocated: 300,
      dayOfMonth: 10,
      daysInMonth: 30,
    });
    expect(result.projected).toBeCloseTo(600);
    expect(result.projectedOverspend).toBeCloseTo(300);
    expect(result.status).toBe("over");
  });

  it("returns on-track when pace is under budget", () => {
    const result = predictCategorySpending({
      spent: 50,
      allocated: 300,
      dayOfMonth: 15,
      daysInMonth: 30,
    });
    expect(result.projected).toBeCloseTo(100);
    expect(result.projectedOverspend).toBeCloseTo(-200);
    expect(result.status).toBe("under");
  });

  it("returns warning when projected is within 10% of budget", () => {
    const result = predictCategorySpending({
      spent: 140,
      allocated: 300,
      dayOfMonth: 15,
      daysInMonth: 30,
    });
    expect(result.status).toBe("warning");
  });

  it("handles day 0 (avoid division by zero)", () => {
    const result = predictCategorySpending({
      spent: 10,
      allocated: 300,
      dayOfMonth: 0,
      daysInMonth: 30,
    });
    expect(result.status).toBe("under");
  });

  it("handles zero allocation", () => {
    const result = predictCategorySpending({
      spent: 50,
      allocated: 0,
      dayOfMonth: 10,
      daysInMonth: 30,
    });
    expect(result.status).toBe("over");
  });
});
