import { describe, expect, it } from "vitest";
import {
  calendarDate,
  formatOrdinalDate,
  getDayOfYear,
  localDate,
} from "../../../src/index.js";
import {
  getDayOfYearFromAbsoluteDay,
  getDayOfYearFromGregorianFields,
} from "../../../src/core/day-of-year.js";
import { ChroneraError } from "../../../src/errors/errors.js";

import type { LocalDate } from "../../../src/public-types.js";

describe("Day of Year & Ordinal Date Engine", () => {
  it("calculates day of year accurately for common year", () => {
    // 2023 is common year: 2023-01-01 is DOY 1, 2023-12-31 is DOY 365
    expect(getDayOfYearFromGregorianFields(2023, 1, 1)).toBe(1);
    expect(getDayOfYearFromGregorianFields(2023, 1, 31)).toBe(31);
    expect(getDayOfYearFromGregorianFields(2023, 2, 1)).toBe(32);
    expect(getDayOfYearFromGregorianFields(2023, 2, 28)).toBe(59);
    expect(getDayOfYearFromGregorianFields(2023, 3, 1)).toBe(60);
    expect(getDayOfYearFromGregorianFields(2023, 12, 31)).toBe(365);
  });

  it("calculates day of year accurately for leap year (2024)", () => {
    // 2024 is leap year: Feb 29 is DOY 60, Mar 1 is DOY 61, Dec 31 is DOY 366
    expect(getDayOfYearFromGregorianFields(2024, 2, 29)).toBe(60);
    expect(getDayOfYearFromGregorianFields(2024, 3, 1)).toBe(61);
    expect(getDayOfYearFromGregorianFields(2024, 12, 31)).toBe(366);
  });

  it("calculates from absolute day and formats ISO 8601 ordinal date (YYYY-DDD)", () => {
    // 2026-09-02: Jan(31) + Feb(28) + Mar(31) + Apr(30) + May(31) + Jun(30) + Jul(31) + Aug(31) + 2 = 245
    const d = localDate(2026, 9, 2);
    const doy = getDayOfYear(d);
    expect(doy.year).toBe(2026);
    expect(doy.dayOfYear).toBe(245);

    const formatted = formatOrdinalDate(d);
    expect(formatted).toBe("2026-245");

    const coreRes = getDayOfYearFromAbsoluteDay(0); // 1970-01-01
    expect(coreRes.year).toBe(1970);
    expect(coreRes.dayOfYear).toBe(1);
  });

  it("supports CalendarDate inputs and rejects invalid inputs", () => {
    const cal = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    });
    const doy = getDayOfYear(cal);
    expect(doy.dayOfYear).toBe(245);

    expect(() => getDayOfYear({} as unknown as LocalDate)).toThrow(
      ChroneraError,
    );
  });
});
