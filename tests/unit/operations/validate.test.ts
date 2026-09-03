import { describe, expect, it } from "vitest";
import {
  daysInMonth,
  getCalendarCapabilities,
  isLeapYear,
  isValidCalendarDate,
} from "../../../src/operations/validate.js";
import { ChroneraError } from "../../../src/errors/errors.js";

import type { CalendarDate } from "../../../src/public-types.js";

describe("validate operations", () => {
  it("validates valid and invalid calendar dates", () => {
    const valid: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    };
    const invalid: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: 2026,
      monthCode: "M02",
      day: 30,
    };

    expect(isValidCalendarDate(valid)).toBe(true);
    expect(isValidCalendarDate(invalid)).toBe(false);
  });

  it("queries daysInMonth and isLeapYear", () => {
    expect(daysInMonth(2024, "M02", "gregory")).toBe(29);
    expect(daysInMonth(2026, "M02", "gregory")).toBe(28);
    expect(isLeapYear(2024, "gregory")).toBe(true);
    expect(isLeapYear(2026, "gregory")).toBe(false);
  });

  it("inspects calendar capabilities", () => {
    const caps = getCalendarCapabilities("gregory");
    expect(caps.calendar).toBe("gregory");
    expect(caps.maturity).toBe("stable");
    expect(caps.deterministic).toBe(true);
    expect(caps.canConvertFromAbsoluteDate).toBe(true);
  });

  it("throws for unconfigured calendar", () => {
    expect(() => getCalendarCapabilities("unknown-cal")).toThrow(ChroneraError);
  });
});
