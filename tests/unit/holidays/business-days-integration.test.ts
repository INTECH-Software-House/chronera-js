import { describe, it, expect } from "vitest";
import { createLocalDate } from "../../../src/core/local-date.js";
import { calendarDate } from "../../../src/core/calendar-date.js";
import {
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  diffInBusinessDays,
  isWeekend,
} from "../../../src/operations/business-days.js";
import { isPublicHoliday } from "../../../src/operations/holidays.js";

describe("Business Days & Public Holidays Integration Suite", () => {
  describe("Songkran Festival Skipping in Thailand", () => {
    it("skips weekends AND all 3 days of Songkran when adding 1 business day", () => {
      // Friday April 10, 2026:
      // Sat April 11 (Weekend)
      // Sun April 12 (Weekend)
      // Mon April 13 (Songkran Day 1 - Holiday)
      // Tue April 14 (Songkran Day 2 - Holiday)
      // Wed April 15 (Songkran Day 3 - Holiday)
      // -> Next working day is Thursday April 16!
      const invoiceDate = createLocalDate(2026, 4, 10);
      const nextWorkingDay = addBusinessDays(invoiceDate, 1, {
        holidays: "TH",
      });

      expect(nextWorkingDay.year).toBe(2026);
      expect(nextWorkingDay.month).toBe(4);
      expect(nextWorkingDay.day).toBe(16); // April 16, 2026 (Thursday)
    });

    it("subtracts business days backwards skipping Songkran and weekend", () => {
      // Thursday April 16, 2026 - 1 business day -> should return Friday April 10!
      const targetDate = createLocalDate(2026, 4, 16);
      const prevWorkingDay = subtractBusinessDays(targetDate, 1, {
        holidays: "TH",
      });

      expect(prevWorkingDay.year).toBe(2026);
      expect(prevWorkingDay.month).toBe(4);
      expect(prevWorkingDay.day).toBe(10); // Friday April 10
    });

    it("computes exact diffInBusinessDays excluding holidays", () => {
      const start = createLocalDate(2026, 4, 10); // Friday
      const end = createLocalDate(2026, 4, 16); // Thursday next week

      // Without holidays: Mon, Tue, Wed, Thu = 4 business days
      expect(diffInBusinessDays(end, start)).toBe(4);

      // With Thailand holidays (Songkran Mon, Tue, Wed excluded): only Thursday counts = 1 business day!
      expect(diffInBusinessDays(end, start, { holidays: "TH" })).toBe(1);
    });
  });

  describe("Middle East Country-Specific Weekend Adaptations", () => {
    it("recognizes Thursday and Friday as weekends in Iran (IR)", () => {
      // 2026-04-16 is Thursday -> In Iran, it's a weekend!
      const thursday = createLocalDate(2026, 4, 16);
      expect(isWeekend(thursday, { holidays: "IR" })).toBe(true);

      // 2026-04-17 is Friday -> In Iran, it's a weekend!
      const friday = createLocalDate(2026, 4, 17);
      expect(isWeekend(friday, { holidays: "IR" })).toBe(true);

      // 2026-04-18 is Saturday -> In Iran, Saturday is a regular WORKING day!
      const saturday = createLocalDate(2026, 4, 18);
      expect(isWeekend(saturday, { holidays: "IR" })).toBe(false);
      expect(isBusinessDay(saturday, { holidays: "IR" })).toBe(true);

      // 2026-04-19 is Sunday -> In Iran, Sunday is a regular WORKING day!
      const sunday = createLocalDate(2026, 4, 19);
      expect(isWeekend(sunday, { holidays: "IR" })).toBe(false);
      expect(isBusinessDay(sunday, { holidays: "IR" })).toBe(true);
    });
  });

  describe("Cross-Calendar Invariant Checks", () => {
    it("correctly identifies Songkran holiday from a Thai Buddhist CalendarDate (พ.ศ. 2569)", () => {
      const thaiBuddhistSongkran = calendarDate({
        calendar: "buddhist",
        year: 2569,
        monthCode: "M04",
        day: 13,
      });

      expect(thaiBuddhistSongkran.calendar).toBe("buddhist");
      expect(thaiBuddhistSongkran.year).toBe(2569);
      expect(thaiBuddhistSongkran.day).toBe(13);

      // Polymorphic isPublicHoliday accepts CalendarDate
      expect(isPublicHoliday(thaiBuddhistSongkran, "TH")).toBe(true);
      expect(isBusinessDay(thaiBuddhistSongkran, { holidays: "TH" })).toBe(
        false,
      );
    });

    it("correctly identifies Japanese Golden Week from a Reiwa CalendarDate (令和8年)", () => {
      const japaneseDate = calendarDate({
        calendar: "japanese",
        year: 2026,
        eraYear: 8,
        era: "reiwa",
        monthCode: "M04",
        day: 29,
      });

      expect(japaneseDate.calendar).toBe("japanese");
      expect(japaneseDate.eraYear).toBe(8); // Reiwa 8

      expect(isPublicHoliday(japaneseDate, "JP")).toBe(true);
      expect(isBusinessDay(japaneseDate, { holidays: "JP" })).toBe(false);
    });
  });

  describe("Custom Holiday Predicates & Additional Days", () => {
    it("supports custom holiday predicate functions in addBusinessDays", () => {
      const date = createLocalDate(2026, 9, 7); // Monday
      // Company closed on Wednesday Sept 9
      const result = addBusinessDays(date, 3, {
        holidays: (d) => d.month === 9 && d.day === 9,
      });

      // Mon (7) + 1 -> Tue (8)
      // + 1 -> Wed (9 is holiday, skipped!) -> Thu (10)
      // + 1 -> Fri (11)
      expect(result.day).toBe(11);
    });
  });
});
