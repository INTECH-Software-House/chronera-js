import { describe, it, expect } from "vitest";
import {
  financialPeriods,
  priorYearSamePeriod,
  priorPeriod,
  isYTD,
} from "../../../src/operations/financial-periods.js";
import { localDate } from "../../../src/core/local-date.js";
import { dateRange } from "../../../src/core/range.js";

describe("Financial & Accounting Periods Engine", () => {
  describe("financialPeriods with Calendar Year (startMonth = 1)", () => {
    it("computes MTD, QTD, YTD, and LTM for September 17, 2026", () => {
      const ref = localDate(2026, 9, 17);
      const fp = financialPeriods(ref, { fiscalYearStartMonth: 1 });

      // MTD: 2026-09-01 to 2026-09-17
      expect(fp.mtd.start).toEqual(localDate(2026, 9, 1));
      expect(fp.mtd.end).toEqual(localDate(2026, 9, 17));

      // QTD: Q3 (Jul 1 to Sep 17)
      expect(fp.fiscalQuarterNumber).toBe(3);
      expect(fp.qtd.start).toEqual(localDate(2026, 7, 1));
      expect(fp.qtd.end).toEqual(localDate(2026, 9, 17));

      // YTD: 2026-01-01 to 2026-09-17
      expect(fp.fiscalYear).toBe(2026);
      expect(fp.ytd.start).toEqual(localDate(2026, 1, 1));
      expect(fp.ytd.end).toEqual(localDate(2026, 9, 17));

      // LTM: 2025-09-17 to 2026-09-17
      expect(fp.ltm.start).toEqual(localDate(2025, 9, 17));
      expect(fp.ltm.end).toEqual(localDate(2026, 9, 17));

      // Full current quarter: 2026-07-01 to 2026-09-30
      expect(fp.currentQuarter.start).toEqual(localDate(2026, 7, 1));
      expect(fp.currentQuarter.end).toEqual(localDate(2026, 9, 30));

      // Full previous quarter: 2026-04-01 to 2026-06-30
      expect(fp.previousQuarter.start).toEqual(localDate(2026, 4, 1));
      expect(fp.previousQuarter.end).toEqual(localDate(2026, 6, 30));

      // Full current month: 2026-09-01 to 2026-09-30
      expect(fp.currentMonth.start).toEqual(localDate(2026, 9, 1));
      expect(fp.currentMonth.end).toEqual(localDate(2026, 9, 30));

      // Full previous month: 2026-08-01 to 2026-08-31
      expect(fp.previousMonth.start).toEqual(localDate(2026, 8, 1));
      expect(fp.previousMonth.end).toEqual(localDate(2026, 8, 31));
    });
  });

  describe("financialPeriods with Fiscal Year starting in October (startMonth = 10)", () => {
    it("handles US Federal / Thai Government fiscal year correctly", () => {
      // Date in September 2026 (Month 9) -> Last month of FY2026 (Q4)
      const refSep = localDate(2026, 9, 17);
      const fpSep = financialPeriods(refSep, { fiscalYearStartMonth: 10 });

      expect(fpSep.fiscalQuarterNumber).toBe(4);
      expect(fpSep.fiscalYear).toBe(2026);
      expect(fpSep.ytd.start).toEqual(localDate(2025, 10, 1));
      expect(fpSep.ytd.end).toEqual(localDate(2026, 9, 17));
      expect(fpSep.qtd.start).toEqual(localDate(2026, 7, 1));

      // Date in November 2026 (Month 11) -> First quarter of FY2027 (Q1)
      const refNov = localDate(2026, 11, 15);
      const fpNov = financialPeriods(refNov, { fiscalYearStartMonth: 10 });

      expect(fpNov.fiscalQuarterNumber).toBe(1);
      expect(fpNov.fiscalYear).toBe(2027);
      expect(fpNov.ytd.start).toEqual(localDate(2026, 10, 1));
      expect(fpNov.ytd.end).toEqual(localDate(2026, 11, 15));
      expect(fpNov.qtd.start).toEqual(localDate(2026, 10, 1));
    });
  });

  describe("financialPeriods with Fiscal Year starting in April (startMonth = 4)", () => {
    it("handles UK/Japan fiscal year", () => {
      const ref = localDate(2026, 9, 17);
      const fp = financialPeriods(ref, { fiscalYearStartMonth: 4 });

      // In September, months since April: 5 (April, May, June, July, August, September) -> Q2
      expect(fp.fiscalQuarterNumber).toBe(2);
      expect(fp.ytd.start).toEqual(localDate(2026, 4, 1));
      expect(fp.qtd.start).toEqual(localDate(2026, 7, 1));
    });
  });

  describe("priorYearSamePeriod & priorPeriod", () => {
    it("computes priorYearSamePeriod (YoY)", () => {
      const range = dateRange(localDate(2026, 9, 1), localDate(2026, 9, 17));
      const prior = priorYearSamePeriod(range);

      expect(prior.start).toEqual(localDate(2025, 9, 1));
      expect(prior.end).toEqual(localDate(2025, 9, 17));
    });

    it("handles leap year in priorYearSamePeriod (Feb 29 -> Feb 28)", () => {
      // 2024 was leap year
      const leapRange = dateRange(
        localDate(2024, 2, 1),
        localDate(2024, 2, 29),
      );
      const prior = priorYearSamePeriod(leapRange);

      expect(prior.start).toEqual(localDate(2023, 2, 1));
      expect(prior.end).toEqual(localDate(2023, 2, 28));
    });

    it("computes sequential priorPeriod", () => {
      // 10-day period: 2026-09-11 to 2026-09-20
      const range = dateRange(localDate(2026, 9, 11), localDate(2026, 9, 20));
      const prior = priorPeriod(range);

      // Prior 10 days ending on 2026-09-10
      expect(prior.end).toEqual(localDate(2026, 9, 10));
      expect(prior.start).toEqual(localDate(2026, 9, 1));
    });
  });

  describe("isYTD", () => {
    it("determines whether a date is in YTD", () => {
      const ref = localDate(2026, 9, 17);
      expect(isYTD(localDate(2026, 5, 1), ref)).toBe(true);
      expect(isYTD(localDate(2026, 9, 17), ref)).toBe(true);
      expect(isYTD(localDate(2026, 9, 18), ref)).toBe(false);
      expect(isYTD(localDate(2025, 12, 31), ref)).toBe(false);
    });
  });

  describe("error handling", () => {
    it("throws on invalid fiscalYearStartMonth", () => {
      expect(() =>
        financialPeriods(localDate(2026, 9, 17), { fiscalYearStartMonth: 0 }),
      ).toThrow();
      expect(() =>
        financialPeriods(localDate(2026, 9, 17), { fiscalYearStartMonth: 13 }),
      ).toThrow();
    });
  });
});
