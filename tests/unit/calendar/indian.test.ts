import { describe, expect, it } from "vitest";
import { calendarDate, convertCalendarDate } from "../../../src/index.js";
import {
  daysInIndianMonth,
  indianAdapter,
  indianValidator,
  isIndianLeapYear,
} from "../../../src/calendar/indian/index.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("Indian National (Saka) Calendar", () => {
  it("converts 1 Chaitra 1946 Saka (2024-03-21 in leap year)", () => {
    // 2024 is leap year, so 1 Chaitra begins on March 21
    const gregLeap = calendarDate({
      calendar: "gregory",
      year: 2024,
      monthCode: "M03",
      day: 21,
    });
    const saka = convertCalendarDate(gregLeap, "indian");
    expect(saka.value.calendar).toBe("indian");
    expect(saka.value.year).toBe(1946); // 2024 - 78 = 1946
    expect(saka.value.monthCode).toBe("M01");
    expect(saka.value.day).toBe(1);

    // Round-trip back
    const backToGreg = convertCalendarDate(saka.value, "gregory");
    expect(backToGreg.value.year).toBe(2024);
    expect(backToGreg.value.monthCode).toBe("M03");
    expect(backToGreg.value.day).toBe(21);
  });

  it("converts 1 Chaitra in common year (March 22)", () => {
    // 2023 is common year, so 1 Chaitra begins on March 22
    const gregCommon = calendarDate({
      calendar: "gregory",
      year: 2023,
      monthCode: "M03",
      day: 22,
    });
    const saka = convertCalendarDate(gregCommon, "indian");
    expect(saka.value.year).toBe(1945); // 2023 - 78 = 1945
    expect(saka.value.monthCode).toBe("M01");
    expect(saka.value.day).toBe(1);

    // Round-trip back
    const backToGreg = convertCalendarDate(saka.value, "gregory");
    expect(backToGreg.value.year).toBe(2023);
    expect(backToGreg.value.monthCode).toBe("M03");
    expect(backToGreg.value.day).toBe(22);
  });

  it("checks leap year behavior and days per month", () => {
    // 1946 Saka (2024 CE) is leap year
    expect(isIndianLeapYear(1946)).toBe(true);
    expect(daysInIndianMonth(1946, 1)).toBe(31);

    // 1945 Saka (2023 CE) is common year
    expect(isIndianLeapYear(1945)).toBe(false);
    expect(daysInIndianMonth(1945, 1)).toBe(30);

    // Months 2-6 have 31 days
    for (let m = 2; m <= 6; m++) {
      expect(daysInIndianMonth(1946, m)).toBe(31);
    }
    // Months 7-12 have 30 days
    for (let m = 7; m <= 12; m++) {
      expect(daysInIndianMonth(1946, m)).toBe(30);
    }
  });

  it("validates constraints and error cases", () => {
    const valid = calendarDate({
      calendar: "indian",
      year: 1946,
      monthCode: "M01",
      day: 15,
    });
    expect(indianValidator.validate(valid)).toHaveLength(0);

    // Invalid day: 31 in Chaitra of common year
    const invalidDay = calendarDate({
      calendar: "indian",
      year: 1945,
      monthCode: "M01",
      day: 31,
    });
    expect(
      indianValidator
        .validate(invalidDay)
        .some((i) => i.code === "CHRONERA_INVALID_DATE"),
    ).toBe(true);

    expect(() =>
      indianAdapter.validator.validate(
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
