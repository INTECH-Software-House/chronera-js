import { describe, expect, it } from "vitest";
import {
  daysInGregorianMonth,
  isGregorianLeapYear,
  parseGregorianMonthCode,
} from "../../../src/core/gregorian-math.js";

describe("gregorian-math", () => {
  const leapCases = [
    { year: 1900, expected: false },
    { year: 2000, expected: true },
    { year: 2024, expected: true },
    { year: 2026, expected: false },
  ];

  it.each(leapCases)(
    "evaluates isGregorianLeapYear($year) = $expected",
    ({ year, expected }) => {
      expect(isGregorianLeapYear(year)).toBe(expected);
    },
  );

  it("calculates month lengths correctly", () => {
    expect(daysInGregorianMonth(2024, 2)).toBe(29);
    expect(daysInGregorianMonth(2026, 2)).toBe(28);
    expect(daysInGregorianMonth(2026, 9)).toBe(30);
    expect(daysInGregorianMonth(2026, 10)).toBe(31);
  });

  it("parses valid month codes", () => {
    expect(parseGregorianMonthCode("M01")).toBe(1);
    expect(parseGregorianMonthCode("M12")).toBe(12);
  });
});
