import { describe, it, expect } from "vitest";
import {
  isPublicHoliday,
  getPublicHolidays,
  getHolidayDetails,
  getHolidayDetailsAll,
} from "../../../src/operations/holidays.js";
import {
  isBusinessDay,
  addBusinessDays,
  diffInBusinessDays,
  createCorporateCalendar,
} from "../../../src/operations/business-days.js";
import { chronera } from "../../../src/chronera.js";
import { localDate } from "../../../src/core/local-date.js";

describe("Cross-Border Multi-Region Holidays & Corporate Calendar", () => {
  describe("Multi-Region Public Holidays", () => {
    it("evaluates public holidays across multiple countries", () => {
      // 2026-04-13 is Songkran in Thailand (TH), regular day in Singapore (SG)
      expect(isPublicHoliday("2026-04-13", "TH")).toBe(true);
      expect(isPublicHoliday("2026-04-13", "SG")).toBe(false);
      expect(isPublicHoliday("2026-04-13", ["TH", "SG"])).toBe(true);

      // 2026-08-09 is National Day in Singapore (SG), regular day in Thailand (TH)
      expect(isPublicHoliday("2026-08-09", "SG")).toBe(true);
      expect(isPublicHoliday("2026-08-09", "TH")).toBe(false);
      expect(isPublicHoliday("2026-08-09", ["TH", "SG"])).toBe(true);

      // 2026-06-15 is regular workday in both TH and SG
      expect(isPublicHoliday("2026-06-15", ["TH", "SG"])).toBe(false);
    });

    it("merges and sorts public holidays from multiple countries chronologically", () => {
      const merged = getPublicHolidays(2026, ["TH", "SG"]);
      expect(merged.length).toBeGreaterThan(15);

      // Ensure chronological order
      for (let i = 1; i < merged.length; i++) {
        const prev = merged[i - 1]!.date;
        const curr = merged[i]!.date;
        const prevStr = `${prev.year}-${String(prev.month).padStart(2, "0")}-${String(prev.day).padStart(2, "0")}`;
        const currStr = `${curr.year}-${String(curr.month).padStart(2, "0")}-${String(curr.day).padStart(2, "0")}`;
        expect(prevStr <= currStr).toBe(true);
      }
    });

    it("returns details for all matching countries on common holidays with getHolidayDetailsAll", () => {
      // 2026-01-01 (New Year's Day) is celebrated in TH, SG, and US
      const details = getHolidayDetailsAll("2026-01-01", ["TH", "SG", "US"]);
      expect(details.length).toBe(3);
      const countries = details.map((d) => d.country);
      expect(countries).toContain("TH");
      expect(countries).toContain("SG");
      expect(countries).toContain("US");
    });

    it("getHolidayDetails returns first matching country detail", () => {
      const detail = getHolidayDetails("2026-04-13", ["SG", "TH"]);
      expect(detail).not.toBeNull();
      expect(detail?.country).toBe("TH");
      expect(detail?.nameEn).toContain("Songkran");
    });
  });

  describe("Corporate Calendar & Working Day Overrides", () => {
    it("handles custom company holidays (off days)", () => {
      const corporate = createCorporateCalendar({
        publicHolidays: ["TH"],
        customHolidays: ["2026-07-10"], // Corporate Foundation Day
      });

      // Regular Friday before is working
      expect(isBusinessDay("2026-07-03", corporate)).toBe(true);
      // Corporate Foundation Day is non-working
      expect(isBusinessDay("2026-07-10", corporate)).toBe(false);
    });

    it("handles working day overrides (compensation working Saturdays)", () => {
      // 2026-05-02 is a Saturday
      expect(isBusinessDay("2026-05-02")).toBe(false);

      const corporate = createCorporateCalendar({
        publicHolidays: ["TH"],
        workingDayOverrides: ["2026-05-02"], // Special working Saturday
      });

      // Special Saturday is now considered a working business day!
      expect(isBusinessDay("2026-05-02", corporate)).toBe(true);
    });

    it("computes addBusinessDays and diffInBusinessDays with multi-region settlements", () => {
      // 2026-04-10 is Friday
      // 2026-04-11 (Sat), 2026-04-12 (Sun) -> Weekend
      // 2026-04-13 (Mon), 2026-04-14 (Tue), 2026-04-15 (Wed) -> Songkran in TH
      // Next business day for TH settlement should be 2026-04-16 (Thursday)
      const start = localDate(2026, 4, 10);
      const nextDay = addBusinessDays(start, 1, { holidays: ["TH", "SG"] });
      expect(nextDay).toEqual(localDate(2026, 4, 16));

      const diff = diffInBusinessDays(nextDay, start, {
        holidays: ["TH", "SG"],
      });
      expect(diff).toBe(1);
    });
  });

  describe("Chronera Fluent Wrapper Integration", () => {
    it("supports multi-country holiday array directly in fluent methods", () => {
      const c = chronera("2026-04-13");
      expect(c.isPublicHoliday(["TH", "SG"])).toBe(true);
      expect(c.isPublicHoliday("SG")).toBe(false);
      expect(c.isBusinessDay(["TH", "SG"])).toBe(false);

      // Add business days passing multi-country array
      const fri = chronera("2026-04-10");
      const next = fri.addBusinessDays(1, ["TH", "SG"]);
      expect(next.format("yyyy-MM-dd")).toBe("2026-04-16");
    });

    it("supports corporate calendar config directly in fluent methods", () => {
      const corp = createCorporateCalendar({
        publicHolidays: ["TH"],
        customHolidays: ["2026-10-05"],
        workingDayOverrides: ["2026-10-10"], // Working Saturday
      });

      expect(chronera("2026-10-05").isBusinessDay(corp)).toBe(false);
      expect(chronera("2026-10-10").isBusinessDay(corp)).toBe(true);
    });
  });
});
