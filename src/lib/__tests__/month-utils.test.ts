import { describe, it, expect } from "vitest";
import { getNextMonth, getPreviousMonth, formatMonthLabel } from "../month-utils";

describe("getNextMonth", () => {
  it("increments month", () => {
    expect(getNextMonth("2026-02")).toBe("2026-03");
  });

  it("wraps year", () => {
    expect(getNextMonth("2026-12")).toBe("2027-01");
  });
});

describe("getPreviousMonth", () => {
  it("decrements month", () => {
    expect(getPreviousMonth("2026-02")).toBe("2026-01");
  });

  it("wraps year", () => {
    expect(getPreviousMonth("2026-01")).toBe("2025-12");
  });
});

describe("formatMonthLabel", () => {
  it("formats YYYY-MM to readable label", () => {
    expect(formatMonthLabel("2026-02")).toBe("February 2026");
  });

  it("formats January", () => {
    expect(formatMonthLabel("2026-01")).toBe("January 2026");
  });

  it("formats December", () => {
    expect(formatMonthLabel("2025-12")).toBe("December 2025");
  });
});
