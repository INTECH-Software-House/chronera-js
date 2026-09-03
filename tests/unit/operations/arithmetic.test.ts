import { describe, expect, it } from "vitest";
import { addDateDuration } from "../../../src/operations/arithmetic.js";
import { calendarDate } from "../../../src/core/calendar-date.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("arithmetic operations", () => {
  it("adds years and months to Gregorian calendar date", () => {
    const cd = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    });

    const res = addDateDuration(cd, { years: 1, months: 2, days: 5 });
    expect(res.year).toBe(2027);
    expect(res.month).toBe(11);
    expect(res.day).toBe(7);
  });

  it("handles constrain overflow when adding a month to January 31", () => {
    const cd = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M01",
      day: 31,
    });

    const res = addDateDuration(cd, { months: 1 }, "constrain");
    expect(res.month).toBe(2);
    expect(res.day).toBe(28);
  });

  it("throws with reject overflow when adding a month to January 31", () => {
    const cd = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M01",
      day: 31,
    });

    expect(() => addDateDuration(cd, { months: 1 }, "reject")).toThrow(
      ChroneraError,
    );
  });
});
