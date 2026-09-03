import { describe, expect, it } from "vitest";
import { calendarDate, convertCalendarDate } from "../../../src/index.js";
import {
  daysInPersianMonth,
  isPersianLeapYear,
  persianAdapter,
  persianValidator,
} from "../../../src/calendar/persian/index.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("Persian (Solar Hijri) Calendar", () => {
  it("converts Nowruz (New Year) 1403 AP (2024-03-20)", () => {
    // 2024-03-20 is 1 Farvardin 1403 AP
    const greg = calendarDate({
      calendar: "gregory",
      year: 2024,
      monthCode: "M03",
      day: 20,
    });
    const persian = convertCalendarDate(greg, "persian");
    expect(persian.value.calendar).toBe("persian");
    expect(persian.value.year).toBe(1403);
    expect(persian.value.monthCode).toBe("M01");
    expect(persian.value.day).toBe(1);

    // Round-trip back
    const backToGreg = convertCalendarDate(persian.value, "gregory");
    expect(backToGreg.value.year).toBe(2024);
    expect(backToGreg.value.monthCode).toBe("M03");
    expect(backToGreg.value.day).toBe(20);
  });

  it("verifies Persian leap years and month lengths", () => {
    // 1399 is leap (366 days)
    expect(isPersianLeapYear(1399)).toBe(true);
    expect(daysInPersianMonth(1399, 12)).toBe(30);

    // 1400 is common (365 days)
    expect(isPersianLeapYear(1400)).toBe(false);
    expect(daysInPersianMonth(1400, 12)).toBe(29);

    // Months 1-6 have 31 days
    for (let m = 1; m <= 6; m++) {
      expect(daysInPersianMonth(1400, m)).toBe(31);
    }
    // Months 7-11 have 30 days
    for (let m = 7; m <= 11; m++) {
      expect(daysInPersianMonth(1400, m)).toBe(30);
    }
  });

  it("validates constraints and out-of-range dates", () => {
    const validDate = calendarDate({
      calendar: "persian",
      year: 1403,
      monthCode: "M01",
      day: 15,
    });
    expect(persianValidator.validate(validDate)).toHaveLength(0);

    // Invalid day (31 in month 12 of common year)
    const invalidDay = calendarDate({
      calendar: "persian",
      year: 1400,
      monthCode: "M12",
      day: 30, // 1400 is common year, max 29
    });
    expect(
      persianValidator
        .validate(invalidDay)
        .some((i) => i.code === "CHRONERA_INVALID_DATE"),
    ).toBe(true);

    expect(() =>
      persianAdapter.validator.validate(
        calendarDate({
          calendar: "gregory",
          year: 2026,
          monthCode: "M01",
          day: 1,
        }),
      ),
    ).toThrow(ChroneraError);
  });
});
