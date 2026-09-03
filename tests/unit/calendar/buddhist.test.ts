import { describe, expect, it } from "vitest";
import { buddhistAdapter } from "../../../src/calendar/buddhist/adapter.js";
import { buddhistValidator } from "../../../src/calendar/buddhist/validator.js";
import { convertCalendarDate } from "../../../src/operations/convert-calendar-date.js";

import type { CalendarDate } from "../../../src/public-types.js";

describe("Buddhist calendar", () => {
  it("converts Gregorian 2026-09-02 to Buddhist BE 2569-09-02", () => {
    const greg: CalendarDate = {
      kind: "calendar-date",
      calendar: "gregory",
      year: 2026,
      monthCode: "M09",
      month: 9,
      day: 2,
    };

    const res = convertCalendarDate(greg, "buddhist");
    expect(res.value).toEqual({
      kind: "calendar-date",
      calendar: "buddhist",
      era: "BE",
      eraYear: 2569,
      year: 2569,
      monthCode: "M09",
      month: 9,
      day: 2,
    });
    expect(res.metadata.deterministic).toBe(true);
    expect(res.metadata.engine).toBe("chronera");
  });

  it("round-trips Buddhist to absolute day and back", () => {
    const bDate: CalendarDate = {
      kind: "calendar-date",
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 2,
    };

    const day = buddhistAdapter.converter!.toAbsoluteDay(bDate);
    const convertedBack = buddhistAdapter.converter!.fromAbsoluteDay(day);

    expect(convertedBack.year).toBe(2569);
    expect(convertedBack.monthCode).toBe("M09");
    expect(convertedBack.day).toBe(2);
    expect(convertedBack.era).toBe("BE");
  });

  it("checks leap year in Buddhist calendar", () => {
    // 2024 CE is leap -> 2567 BE is leap
    expect(buddhistValidator.isLeapYear(2567)).toBe(true);
    // 2026 CE is not leap -> 2569 BE is not leap
    expect(buddhistValidator.isLeapYear(2569)).toBe(false);
  });
});
