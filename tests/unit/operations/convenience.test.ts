import { describe, expect, it } from "vitest";
import { localDate } from "../../../src/core/local-date.js";
import {
  addDays,
  addMonths,
  addYears,
  diffInDays,
  endOfMonth,
  endOfYear,
  getAbsoluteDay,
  isAfter,
  isBefore,
  isBetween,
  isEqual,
  isSameDay,
  isToday,
  startOfMonth,
  startOfYear,
  subtractDays,
  subtractMonths,
  subtractYears,
} from "../../../src/operations/convenience.js";
import { convertCalendarDate } from "../../../src/operations/convert-calendar-date.js";

import type { CalendarDate } from "../../../src/public-types.js";

describe("Daily Convenience Helpers (v0.1.1)", () => {
  const d2026_09_02 = localDate(2026, 9, 2);
  const d2026_09_04 = localDate(2026, 9, 4);
  const d2026_09_10 = localDate(2026, 9, 10);

  const cal2026_09_04: CalendarDate = {
    kind: "calendar-date",
    calendar: "gregory",
    year: 2026,
    monthCode: "M09",
    day: 4,
  };

  // Thai Buddhist: BE 2569-09-04 corresponds exactly to CE 2026-09-04
  const thaiBuddhist_2569_09_04 = convertCalendarDate(
    cal2026_09_04,
    "buddhist",
  ).value;

  // Japanese: Reiwa 8-09-04 corresponds exactly to CE 2026-09-04
  const japanese_reiwa8_09_04 = convertCalendarDate(
    cal2026_09_04,
    "japanese",
  ).value;

  // Hijri: corresponds to CE 2026-09-04
  const hijri_2026_09_04 = convertCalendarDate(
    cal2026_09_04,
    "islamic-civil",
  ).value;

  describe("Comparison Helpers", () => {
    it("compares local dates with isBefore and isAfter", () => {
      expect(isBefore(d2026_09_02, d2026_09_04)).toBe(true);
      expect(isBefore(d2026_09_04, d2026_09_02)).toBe(false);
      expect(isBefore(d2026_09_04, d2026_09_04)).toBe(false);

      expect(isAfter(d2026_09_10, d2026_09_04)).toBe(true);
      expect(isAfter(d2026_09_02, d2026_09_04)).toBe(false);
      expect(isAfter(d2026_09_04, d2026_09_04)).toBe(false);
    });

    it("verifies cross-calendar equality (isEqual & isSameDay)", () => {
      // Gregorian 2026-09-04 === Thai Buddhist 2569-09-04 === Japanese Reiwa 8-09-04 === Hijri
      expect(isEqual(d2026_09_04, thaiBuddhist_2569_09_04)).toBe(true);
      expect(isSameDay(d2026_09_04, japanese_reiwa8_09_04)).toBe(true);
      expect(isEqual(thaiBuddhist_2569_09_04, hijri_2026_09_04)).toBe(true);

      // Different dates
      expect(isEqual(d2026_09_02, thaiBuddhist_2569_09_04)).toBe(false);
      expect(isBefore(d2026_09_02, thaiBuddhist_2569_09_04)).toBe(true);
      expect(isAfter(d2026_09_10, thaiBuddhist_2569_09_04)).toBe(true);
    });

    it("evaluates isBetween with inclusive and exclusive options", () => {
      // target: Sep 4, range: Sep 2 to Sep 10
      expect(isBetween(d2026_09_04, d2026_09_02, d2026_09_10, "[]")).toBe(true);
      expect(isBetween(d2026_09_04, d2026_09_02, d2026_09_10, "()")).toBe(true);

      // Boundary tests
      expect(isBetween(d2026_09_02, d2026_09_02, d2026_09_10, "[]")).toBe(true);
      expect(isBetween(d2026_09_02, d2026_09_02, d2026_09_10, "()")).toBe(
        false,
      );
      expect(isBetween(d2026_09_02, d2026_09_02, d2026_09_10, "[)")).toBe(true);
      expect(isBetween(d2026_09_02, d2026_09_02, d2026_09_10, "(]")).toBe(
        false,
      );

      expect(isBetween(d2026_09_10, d2026_09_02, d2026_09_10, "[]")).toBe(true);
      expect(isBetween(d2026_09_10, d2026_09_02, d2026_09_10, "()")).toBe(
        false,
      );
      expect(isBetween(d2026_09_10, d2026_09_02, d2026_09_10, "[)")).toBe(
        false,
      );
      expect(isBetween(d2026_09_10, d2026_09_02, d2026_09_10, "(]")).toBe(true);

      // Out of bounds
      const d2026_09_15 = localDate(2026, 9, 15);
      expect(isBetween(d2026_09_15, d2026_09_02, d2026_09_10)).toBe(false);

      // Start after end error
      expect(() => isBetween(d2026_09_04, d2026_09_10, d2026_09_02)).toThrow(
        "Start date must not be after end date.",
      );

      // Invalid inclusivity
      expect(() =>
        // @ts-expect-error test invalid parameter
        isBetween(d2026_09_04, d2026_09_02, d2026_09_10, "invalid"),
      ).toThrow("Invalid inclusivity");
    });

    it("evaluates isToday correctly", () => {
      const now = new Date();
      const today = localDate(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
      );
      expect(isToday(today, "UTC")).toBe(true);

      const yesterday = addDays(today, -1);
      expect(isToday(yesterday, "UTC")).toBe(false);

      // Works without explicit timezone argument
      const localNow = new Date();
      const hostToday = localDate(
        localNow.getFullYear(),
        localNow.getMonth() + 1,
        localNow.getDate(),
      );
      expect(isToday(hostToday)).toBe(true);
    });
  });

  describe("Date Arithmetic Shortcuts", () => {
    it("adds and subtracts days on LocalDate", () => {
      const start = localDate(2026, 2, 27);
      const plus1 = addDays(start, 1);
      expect(plus1).toEqual(localDate(2026, 2, 28));

      // Month rollover in non-leap year (Feb 28 -> Mar 1)
      const plus2 = addDays(start, 2);
      expect(plus2).toEqual(localDate(2026, 3, 1));

      // Subtract days
      const minus2 = subtractDays(plus2, 2);
      expect(minus2).toEqual(start);
    });

    it("adds and subtracts days across leap years", () => {
      // 2024 is a leap year
      const leapFeb28 = localDate(2024, 2, 28);
      const leapFeb29 = addDays(leapFeb28, 1);
      expect(leapFeb29).toEqual(localDate(2024, 2, 29));

      const leapMar1 = addDays(leapFeb28, 2);
      expect(leapMar1).toEqual(localDate(2024, 3, 1));
    });

    it("adds and subtracts days on CalendarDate", () => {
      const nextDay = addDays(thaiBuddhist_2569_09_04, 1);
      expect(nextDay.calendar).toBe("buddhist");
      expect(nextDay.day).toBe(5);

      const prevDay = subtractDays(nextDay, 1);
      expect(prevDay.day).toBe(4);
    });

    it("adds and subtracts months with overflow options", () => {
      const jan31 = localDate(2026, 1, 31);
      // Feb 2026 has 28 days
      expect(() => addMonths(jan31, 1, "reject")).toThrow();
      expect(addMonths(jan31, 1, "constrain")).toEqual(localDate(2026, 2, 28));

      const mar31 = localDate(2026, 3, 31);
      expect(subtractMonths(mar31, 1, "constrain")).toEqual(
        localDate(2026, 2, 28),
      );

      // Normal month addition
      const jun15 = localDate(2026, 6, 15);
      expect(addMonths(jun15, 3)).toEqual(localDate(2026, 9, 15));
      expect(subtractMonths(jun15, 2)).toEqual(localDate(2026, 4, 15));
    });

    it("adds and subtracts months on CalendarDate", () => {
      const calDate: CalendarDate = {
        kind: "calendar-date",
        calendar: "gregory",
        year: 2026,
        monthCode: "M01",
        day: 15,
      };
      const added = addMonths(calDate, 2);
      expect(added.monthCode).toBe("M03");
      const subtracted = subtractMonths(added, 2);
      expect(subtracted.monthCode).toBe("M01");
    });

    it("adds and subtracts years with leap year constraints", () => {
      const leapDay = localDate(2024, 2, 29);
      expect(addYears(leapDay, 1, "constrain")).toEqual(localDate(2025, 2, 28));
      expect(() => addYears(leapDay, 1, "reject")).toThrow();

      const normalDate = localDate(2026, 5, 20);
      expect(addYears(normalDate, 2)).toEqual(localDate(2028, 5, 20));
      expect(subtractYears(normalDate, 3)).toEqual(localDate(2023, 5, 20));
    });

    it("adds and subtracts years on CalendarDate", () => {
      const addedYear = addYears(thaiBuddhist_2569_09_04, 1);
      expect(addedYear.year).toBe(2570);
      const subYear = subtractYears(addedYear, 1);
      expect(subYear.year).toBe(2569);
    });

    it("calculates diffInDays accurately across any calendar", () => {
      expect(diffInDays(d2026_09_10, d2026_09_04)).toBe(6);
      expect(diffInDays(d2026_09_04, d2026_09_10)).toBe(-6);
      expect(diffInDays(d2026_09_04, d2026_09_04)).toBe(0);

      // Cross-calendar diff (Gregorian Sep 10 vs Thai Buddhist Sep 4)
      expect(diffInDays(d2026_09_10, thaiBuddhist_2569_09_04)).toBe(6);
      expect(diffInDays(thaiBuddhist_2569_09_04, d2026_09_10)).toBe(-6);
    });
  });

  describe("Date Boundary Helpers", () => {
    it("computes startOfMonth and endOfMonth for LocalDate", () => {
      const d = localDate(2026, 9, 18);
      expect(startOfMonth(d)).toEqual(localDate(2026, 9, 1));
      expect(endOfMonth(d)).toEqual(localDate(2026, 9, 30));

      // February in leap year vs non-leap year
      const feb2024 = localDate(2024, 2, 10);
      expect(endOfMonth(feb2024)).toEqual(localDate(2024, 2, 29));

      const feb2026 = localDate(2026, 2, 10);
      expect(endOfMonth(feb2026)).toEqual(localDate(2026, 2, 28));
    });

    it("computes startOfMonth and endOfMonth for CalendarDate", () => {
      expect(startOfMonth(thaiBuddhist_2569_09_04).day).toBe(1);
      expect(endOfMonth(thaiBuddhist_2569_09_04).day).toBe(30);

      // Hijri month end
      const hijriStart = startOfMonth(hijri_2026_09_04);
      expect(hijriStart.day).toBe(1);
      const hijriEnd = endOfMonth(hijri_2026_09_04);
      expect(hijriEnd.day).toBeGreaterThanOrEqual(29);
      expect(hijriEnd.day).toBeLessThanOrEqual(30);
    });

    it("computes startOfYear and endOfYear for LocalDate", () => {
      const d = localDate(2026, 8, 15);
      expect(startOfYear(d)).toEqual(localDate(2026, 1, 1));
      expect(endOfYear(d)).toEqual(localDate(2026, 12, 31));
    });

    it("computes startOfYear and endOfYear for CalendarDate", () => {
      const tbStart = startOfYear(thaiBuddhist_2569_09_04);
      expect(tbStart.monthCode).toBe("M01");
      expect(tbStart.day).toBe(1);

      const tbEnd = endOfYear(thaiBuddhist_2569_09_04);
      expect(tbEnd.monthCode).toBe("M12");
      expect(tbEnd.day).toBe(31);
    });
  });

  describe("Cross-Calendar Precision & International Edge Cases", () => {
    it("handles Thai Buddhist leap years correctly with constrain and reject", () => {
      // BE 2567 is CE 2024 (leap year)
      const tbLeapDay: CalendarDate = {
        kind: "calendar-date",
        calendar: "buddhist",
        era: "BE",
        eraYear: 2567,
        year: 2567,
        monthCode: "M02",
        month: 2,
        day: 29,
      };

      expect(() => addYears(tbLeapDay, 1, "reject")).toThrow();

      const constrained = addYears(tbLeapDay, 1, "constrain");
      expect(constrained.year).toBe(2568);
      expect(constrained.monthCode).toBe("M02");
      expect(constrained.day).toBe(28);

      // Add 4 years to next leap year (BE 2571 / CE 2028)
      const nextLeap = addYears(tbLeapDay, 4);
      expect(nextLeap.year).toBe(2571);
      expect(nextLeap.day).toBe(29);
    });

    it("handles Japanese era transitions seamlessly", () => {
      // Heisei 31-04-30 (last day of Heisei era, absolute day 2019-04-30)
      const heiseiLastDay: CalendarDate = {
        kind: "calendar-date",
        calendar: "japanese",
        era: "heisei",
        eraYear: 31,
        year: 2019,
        monthCode: "M04",
        month: 4,
        day: 30,
      };

      // The next day is Reiwa 1-05-01!
      const reiwaFirstDay = addDays(heiseiLastDay, 1);
      expect(reiwaFirstDay.era).toBe("reiwa");
      expect(reiwaFirstDay.eraYear).toBe(1);
      expect(reiwaFirstDay.monthCode).toBe("M05");
      expect(reiwaFirstDay.day).toBe(1);

      // Subtract 1 day from Reiwa 1-05-01 goes back to Heisei 31-04-30
      const backToHeisei = subtractDays(reiwaFirstDay, 1);
      expect(backToHeisei.era).toBe("heisei");
      expect(backToHeisei.eraYear).toBe(31);
      expect(backToHeisei.monthCode).toBe("M04");
      expect(backToHeisei.day).toBe(30);

      // Add 5 years from Heisei 31 (2019) -> 2024 (Reiwa 6)
      const futureReiwa = addYears(heiseiLastDay, 5);
      expect(futureReiwa.year).toBe(2024);
      expect(futureReiwa.era).toBe("reiwa");
      expect(futureReiwa.eraYear).toBe(6);
    });

    it("handles Persian (Solar Hijri) calendar months and boundaries", () => {
      const persianDate = convertCalendarDate(cal2026_09_04, "persian").value;
      expect(persianDate.calendar).toBe("persian");

      // Test month boundary
      const som = startOfMonth(persianDate);
      expect(som.day).toBe(1);

      const eom = endOfMonth(persianDate);
      expect(eom.day).toBe(31); // Shahrivar (M06) has 31 days in Persian calendar

      // Add days crossing into Mehr (M07)
      const nextMonthDay = addDays(eom, 1);
      expect(nextMonthDay.monthCode).toBe("M07");
      expect(nextMonthDay.day).toBe(1);

      // Add months
      const plus2Months = addMonths(persianDate, 2);
      expect(plus2Months.calendar).toBe("persian");
      expect(diffInDays(plus2Months, persianDate)).toBeGreaterThan(50);
    });

    it("handles ROC (Minguo) calendar conversions and arithmetic", () => {
      const rocDate = convertCalendarDate(cal2026_09_04, "roc").value;
      expect(rocDate.calendar).toBe("roc");
      expect(rocDate.year).toBe(115); // 2026 - 1911 = 115

      const plusYear = addYears(rocDate, 1);
      expect(plusYear.year).toBe(116);
      expect(plusYear.eraYear).toBe(116);

      const minusYear = subtractYears(plusYear, 1);
      expect(minusYear.year).toBe(115);

      expect(diffInDays(plusYear, rocDate)).toBe(365);
    });

    it("handles Indian Saka calendar arithmetic and boundaries", () => {
      const indianDate = convertCalendarDate(cal2026_09_04, "indian").value;
      expect(indianDate.calendar).toBe("indian");

      const som = startOfMonth(indianDate);
      expect(som.day).toBe(1);

      const eom = endOfMonth(indianDate);
      expect(eom.day).toBeGreaterThanOrEqual(30);

      const nextDay = addDays(indianDate, 1);
      expect(diffInDays(nextDay, indianDate)).toBe(1);
    });

    it("handles Islamic Civil (Hijri) arithmetic and month rollovers", () => {
      const som = startOfMonth(hijri_2026_09_04);
      expect(som.day).toBe(1);

      const eom = endOfMonth(hijri_2026_09_04);
      expect(eom.day).toBeGreaterThanOrEqual(29);
      expect(eom.day).toBeLessThanOrEqual(30);

      const nextMonthFirst = addDays(eom, 1);
      expect(nextMonthFirst.day).toBe(1);

      const prevMonthLast = subtractDays(som, 1);
      expect(prevMonthLast.day).toBeGreaterThanOrEqual(29);
    });
  });

  describe("Unsupported Calendar Handling in getAbsoluteDay", () => {
    it("throws when calendar has no converter", () => {
      const mockCalendarDate: CalendarDate = {
        kind: "calendar-date",
        calendar: "unsupported-mock",
        year: 2026,
        monthCode: "M01",
        day: 1,
      };
      expect(() => getAbsoluteDay(mockCalendarDate)).toThrow();
    });
  });
});
