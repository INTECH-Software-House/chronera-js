import { describe, expect, it } from "vitest";
import {
  calendarDate,
  convertCalendarDate,
  formatDate,
  localDate,
} from "../../../src/index.js";
import { rocAdapter, rocValidator } from "../../../src/calendar/roc/index.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("Taiwan Republic of China (ROC / Minguo) Calendar", () => {
  it("converts Gregorian to ROC calendar (Year = Gregorian - 1911)", () => {
    const d = localDate(2026, 9, 2);
    const roc = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 2026,
        monthCode: "M09",
        day: 2,
      }),
      "roc",
    );
    expect(roc.value.calendar).toBe("roc");
    expect(roc.value.year).toBe(115); // 2026 - 1911 = 115
    expect(roc.value.monthCode).toBe("M09");
    expect(roc.value.day).toBe(2);

    // Format with taiwan-official preset
    const formatted = formatDate(d, { preset: "taiwan-official" });
    expect(formatted).toBe("民國115年9月2日");
  });

  it("handles 1912-01-01 as Minguo Year 1", () => {
    const d = localDate(1912, 1, 1);
    const roc = convertCalendarDate(
      calendarDate({
        calendar: "gregory",
        year: 1912,
        monthCode: "M01",
        day: 1,
      }),
      "roc",
    );
    expect(roc.value.year).toBe(1);

    const formatted = formatDate(d, { preset: "taiwan-official" });
    expect(formatted).toBe("民國1年1月1日");
  });

  it("round-trips ROC CalendarDate back to Gregorian", () => {
    const rocDate = calendarDate({
      calendar: "roc",
      year: 115,
      monthCode: "M09",
      day: 2,
    });
    const greg = convertCalendarDate(rocDate, "gregory");
    expect(greg.value.year).toBe(2026);
    expect(greg.value.monthCode).toBe("M09");
    expect(greg.value.day).toBe(2);
  });

  it("validates leap years and month lengths in ROC calendar", () => {
    // 2024 is ROC 113 (Leap year)
    expect(rocValidator.isLeapYear(113)).toBe(true);
    expect(rocValidator.daysInMonth(113, "M02")).toBe(29);

    // 2025 is ROC 114 (Common year)
    expect(rocValidator.isLeapYear(114)).toBe(false);
    expect(rocValidator.daysInMonth(114, "M02")).toBe(28);

    // Pre-1912 out of range
    const pre1912 = calendarDate({
      calendar: "roc",
      year: 0,
      monthCode: "M01",
      day: 1,
    });
    const issues = rocValidator.validate(pre1912);
    expect(issues.some((i) => i.code === "CHRONERA_OUT_OF_RANGE")).toBe(true);

    expect(() =>
      rocAdapter.validator.validate(
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
