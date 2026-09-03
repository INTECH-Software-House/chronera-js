import { describe, expect, it } from "vitest";
import { calendarDate } from "../../../src/core/calendar-date.js";
import { ChroneraError } from "../../../src/errors/errors.js";
import type { MonthCode } from "../../../src/public-types.js";

describe("calendarDate", () => {
  it("creates valid calendarDate", () => {
    const cd = calendarDate({
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 2,
      era: "BE",
      eraYear: 2569,
    });
    expect(cd).toEqual({
      kind: "calendar-date",
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      month: 9,
      day: 2,
      era: "BE",
      eraYear: 2569,
    });
  });

  it("defaults month number when monthCode is M01-M12 and month is omitted", () => {
    const cd = calendarDate({
      calendar: "gregory",
      year: 2026,
      monthCode: "M05",
      day: 15,
    });
    expect(cd.month).toBe(5);
  });

  it("rejects non-integer year or day", () => {
    expect(() =>
      calendarDate({
        calendar: "gregory",
        year: 2026.5,
        monthCode: "M01",
        day: 1,
      }),
    ).toThrow(ChroneraError);

    expect(() =>
      calendarDate({
        calendar: "gregory",
        year: 2026,
        monthCode: "M01",
        day: 1.5,
      }),
    ).toThrow(ChroneraError);
  });

  it("rejects invalid monthCode pattern", () => {
    expect(() =>
      calendarDate({
        calendar: "gregory",
        year: 2026,
        monthCode: "XYZ" as unknown as MonthCode,
        day: 1,
      }),
    ).toThrow(ChroneraError);
  });
});
