import { describe, expect, it } from "vitest";
import { calendarDate } from "../../../src/core/calendar-date.js";
import { localDate } from "../../../src/core/local-date.js";
import {
  addBusinessDays,
  diffInBusinessDays,
  isWeekday,
  isWeekend,
  subtractBusinessDays,
} from "../../../src/operations/business-days.js";

describe("Business Days Toolkit (v0.1.3)", () => {
  describe("Predicates", () => {
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

  describe("addBusinessDays & subtractBusinessDays", () => {
    it("adds business days correctly skipping weekends", () => {
      // Friday 2026-09-04 + 1 business day -> Monday 2026-09-07
      const friday = localDate(2026, 9, 4);
      expect(addBusinessDays(friday, 1)).toEqual(localDate(2026, 9, 7));

      // Friday 2026-09-04 + 2 business days -> Tuesday 2026-09-08
      expect(addBusinessDays(friday, 2)).toEqual(localDate(2026, 9, 8));

      // Friday 2026-09-04 + 5 business days (1 full week) -> Friday 2026-09-11
      expect(addBusinessDays(friday, 5)).toEqual(localDate(2026, 9, 11));

      // Friday 2026-09-04 + 10 business days (2 full weeks) -> Friday 2026-09-18
      expect(addBusinessDays(friday, 10)).toEqual(localDate(2026, 9, 18));
    });

    it("handles additions starting on weekend correctly", () => {
      const saturday = localDate(2026, 9, 5);
      const sunday = localDate(2026, 9, 6);

      // Saturday + 1 business day -> Monday
      expect(addBusinessDays(saturday, 1)).toEqual(localDate(2026, 9, 7));
      // Sunday + 1 business day -> Monday
      expect(addBusinessDays(sunday, 1)).toEqual(localDate(2026, 9, 7));
      // Saturday + 2 business days -> Tuesday
      expect(addBusinessDays(saturday, 2)).toEqual(localDate(2026, 9, 8));
    });

    it("handles zero and negative additions (subtracting business days)", () => {
      const monday = localDate(2026, 9, 7);
      expect(addBusinessDays(monday, 0)).toEqual(monday);

      // Monday - 1 business day -> Friday
      expect(addBusinessDays(monday, -1)).toEqual(localDate(2026, 9, 4));
      expect(subtractBusinessDays(monday, 1)).toEqual(localDate(2026, 9, 4));

      // Monday - 2 business days -> Thursday
      expect(subtractBusinessDays(monday, 2)).toEqual(localDate(2026, 9, 3));

      // Sunday - 1 business day -> Friday
      const sunday = localDate(2026, 9, 6);
      expect(subtractBusinessDays(sunday, 1)).toEqual(localDate(2026, 9, 4));
    });

    it("handles month and year boundaries accurately", () => {
      // Wednesday 2026-09-30 + 3 business days -> Monday 2026-10-05 (skips Sat 3rd, Sun 4th)
      const endOfSep = localDate(2026, 9, 30);
      expect(addBusinessDays(endOfSep, 3)).toEqual(localDate(2026, 10, 5));

      // Thursday 2026-12-31 + 2 business days -> Monday 2027-01-04 (skips Sat 2nd, Sun 3rd)
      const endOfYear = localDate(2026, 12, 31);
      expect(addBusinessDays(endOfYear, 2)).toEqual(localDate(2027, 1, 4));
    });

    it("works seamlessly on non-Gregorian calendars", () => {
      // Thai Buddhist: Friday 2569-09-04 + 2 business days -> Tuesday 2569-09-08
      const thaiFriday = calendarDate({
        calendar: "buddhist",
        year: 2569,
        monthCode: "M09",
        day: 4,
        era: "BE",
        eraYear: 2569,
      });
      const expectedTuesday = calendarDate({
        calendar: "buddhist",
        year: 2569,
        monthCode: "M09",
        day: 8,
        era: "BE",
        eraYear: 2569,
      });
      expect(addBusinessDays(thaiFriday, 2)).toEqual(expectedTuesday);
    });
  });

  describe("diffInBusinessDays", () => {
    it("computes business day differences with exact precision", () => {
      const fri = localDate(2026, 9, 4);
      const mon = localDate(2026, 9, 7);
      const tue = localDate(2026, 9, 8);
      const nextFri = localDate(2026, 9, 11);

      // Friday to Monday = 1 business day
      expect(diffInBusinessDays(mon, fri)).toBe(1);
      // Friday to Tuesday = 2 business days
      expect(diffInBusinessDays(tue, fri)).toBe(2);
      // Friday to next Friday = 5 business days
      expect(diffInBusinessDays(nextFri, fri)).toBe(5);

      // Same day
      expect(diffInBusinessDays(fri, fri)).toBe(0);

      // Weekend ranges
      const sat = localDate(2026, 9, 5);
      const sun = localDate(2026, 9, 6);
      expect(diffInBusinessDays(sat, fri)).toBe(0);
      expect(diffInBusinessDays(sun, fri)).toBe(0);
      expect(diffInBusinessDays(sun, sat)).toBe(0);
      expect(diffInBusinessDays(mon, sat)).toBe(1);

      // Signed difference (left - right)
      expect(diffInBusinessDays(fri, mon)).toBe(-1);
      expect(diffInBusinessDays(fri, nextFri)).toBe(-5);
    });

    it("calculates differences across different calendar representations", () => {
      // Thai Buddhist Friday 2569-09-04 to Gregorian Monday 2026-09-07
      const thaiFri = calendarDate({
        calendar: "buddhist",
        year: 2569,
        monthCode: "M09",
        day: 4,
      });
      const gregMon = localDate(2026, 9, 7);
      expect(diffInBusinessDays(gregMon, thaiFri)).toBe(1);
      expect(diffInBusinessDays(thaiFri, gregMon)).toBe(-1);
    });
  });
});
