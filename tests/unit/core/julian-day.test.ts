import { describe, expect, it } from "vitest";
import {
  calendarDate,
  localDate,
  localDateFromJulianDayNumber,
  localDateFromModifiedJulianDay,
  toJulianDayNumber,
  toModifiedJulianDay,
} from "../../../src/index.js";
import { ChroneraError } from "../../../src/errors/errors.js";

import type { LocalDate } from "../../../src/public-types.js";

describe("Astronomical Julian Day & Modified Julian Day Engine", () => {
  it("verifies benchmark IAU/NASA reference points", () => {
    // 1970-01-01 is JDN 2440588, MJD 40587
    const epochDate = localDate(1970, 1, 1);
    expect(toJulianDayNumber(epochDate)).toBe(2440588);
    expect(toModifiedJulianDay(epochDate)).toBe(40587);

    // 2000-01-01 (J2000.0 Epoch) is JDN 2451545, MJD 51544
    const j2000Date = localDate(2000, 1, 1);
    expect(toJulianDayNumber(j2000Date)).toBe(2451545);
    expect(toModifiedJulianDay(j2000Date)).toBe(51544);
  });

  it("round-trips between LocalDate and Julian Day Number", () => {
    const orig = localDate(2026, 9, 2);
    const jdn = toJulianDayNumber(orig);
    const roundTripped = localDateFromJulianDayNumber(jdn);

    expect(roundTripped.year).toBe(2026);
    expect(roundTripped.month).toBe(9);
    expect(roundTripped.day).toBe(2);
  });

  it("round-trips between LocalDate and Modified Julian Day", () => {
    const orig = localDate(2026, 9, 2);
    const mjd = toModifiedJulianDay(orig);
    const roundTripped = localDateFromModifiedJulianDay(mjd);

    expect(roundTripped.year).toBe(2026);
    expect(roundTripped.month).toBe(9);
    expect(roundTripped.day).toBe(2);
  });

  it("supports CalendarDate inputs and handles errors", () => {
    const cal = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      day: 2,
    });
    expect(toJulianDayNumber(cal)).toBe(2461286);

    expect(() => toJulianDayNumber({} as unknown as LocalDate)).toThrow(
      ChroneraError,
    );
  });
});
