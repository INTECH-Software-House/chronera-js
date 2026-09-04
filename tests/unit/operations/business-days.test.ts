import { describe, expect, it } from "vitest";
import { calendarDate } from "../../../src/core/calendar-date.js";
import { localDate } from "../../../src/core/local-date.js";
import { isWeekday, isWeekend } from "../../../src/operations/business-days.js";

describe("Business Days Predicates (v0.1.3)", () => {
  it("correctly identifies weekdays and weekends for LocalDate", () => {
    // 2026-09-04 is Friday
    const friday = localDate(2026, 9, 4);
    expect(isWeekday(friday)).toBe(true);
    expect(isWeekend(friday)).toBe(false);

    // 2026-09-05 is Saturday
    const saturday = localDate(2026, 9, 5);
    expect(isWeekday(saturday)).toBe(false);
    expect(isWeekend(saturday)).toBe(true);

    // 2026-09-06 is Sunday
    const sunday = localDate(2026, 9, 6);
    expect(isWeekday(sunday)).toBe(false);
    expect(isWeekend(sunday)).toBe(true);

    // 2026-09-07 is Monday
    const monday = localDate(2026, 9, 7);
    expect(isWeekday(monday)).toBe(true);
    expect(isWeekend(monday)).toBe(false);
  });

  it("correctly identifies weekdays and weekends across non-Gregorian calendars", () => {
    // Thai Buddhist: 2569-09-05 is Saturday
    const thaiSat = calendarDate({
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 5,
    });
    expect(isWeekend(thaiSat)).toBe(true);
    expect(isWeekday(thaiSat)).toBe(false);

    // Thai Buddhist: 2569-09-07 is Monday
    const thaiMon = calendarDate({
      calendar: "buddhist",
      year: 2569,
      monthCode: "M09",
      day: 7,
    });
    expect(isWeekday(thaiMon)).toBe(true);
    expect(isWeekend(thaiMon)).toBe(false);

    // Japanese: Reiwa 8 (2026) September 6 is Sunday
    const jpnSun = calendarDate({
      calendar: "japanese",
      year: 2026,
      monthCode: "M09",
      day: 6,
      era: "reiwa",
      eraYear: 8,
    });
    expect(isWeekend(jpnSun)).toBe(true);
    expect(isWeekday(jpnSun)).toBe(false);
  });
});
