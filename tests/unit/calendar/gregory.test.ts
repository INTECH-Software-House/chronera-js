import { describe, expect, it } from "vitest";
import { gregorianAdapter } from "../../../src/calendar/gregory/adapter.js";
import { isLeapYear } from "../../../src/operations/validate.js";

describe("Gregorian calendar", () => {
  const cases = [
    { year: 1900, expected: false },
    { year: 2000, expected: true },
    { year: 2024, expected: true },
    { year: 2026, expected: false },
  ];

  it.each(cases)(
    "returns $expected for Gregorian year $year",
    ({ year, expected }) => {
      expect(isLeapYear(year, "gregory")).toBe(expected);
    },
  );

  it("adds duration with reject overflow", () => {
    const d = {
      kind: "calendar-date" as const,
      calendar: "gregory" as const,
      year: 2026,
      monthCode: "M01" as const,
      month: 1,
      day: 31,
    };

    expect(() =>
      gregorianAdapter.arithmetic!.add(d, { months: 1 }, "reject"),
    ).toThrowError(/exceeds maximum days/);
  });

  it("adds duration with constrain overflow", () => {
    const d = {
      kind: "calendar-date" as const,
      calendar: "gregory" as const,
      year: 2026,
      monthCode: "M01" as const,
      month: 1,
      day: 31,
    };

    const res = gregorianAdapter.arithmetic!.add(d, { months: 1 }, "constrain");
    expect(res.month).toBe(2);
    expect(res.day).toBe(28); // 2026 Feb has 28 days
  });
});
