import { describe, expect, it } from "vitest";
import {
  getThaiFiscalYear,
  getTaxFilingDeadline,
  getAllMonthlyTaxDeadlines,
} from "../../../src/operations/thai-fiscal.js";
import { localDate } from "../../../src/core/local-date.js";
import { chronera } from "../../../src/chronera.js";

describe("Thai Fiscal Year & Tax Deadlines Engine", () => {
  describe("getThaiFiscalYear", () => {
    it("should calculate Q1 and next year CE/BE for October, November, December", () => {
      const d = localDate(2026, 10, 15);
      const res = getThaiFiscalYear(d);

      expect(res.fiscalYearCE).toBe(2027);
      expect(res.fiscalYearBE).toBe(2570);
      expect(res.quarter).toBe(1);
      expect(res.quarterBE).toBe("ไตรมาส 1");
      expect(res.startDate).toEqual(localDate(2026, 10, 1));
      expect(res.endDate).toEqual(localDate(2027, 9, 30));
      expect(res.quarterStartDate).toEqual(localDate(2026, 10, 1));
      expect(res.quarterEndDate).toEqual(localDate(2026, 12, 31));
    });

    it("should calculate Q2 for January, February, March", () => {
      const d = localDate(2027, 2, 10);
      const res = getThaiFiscalYear(d);

      expect(res.fiscalYearCE).toBe(2027);
      expect(res.fiscalYearBE).toBe(2570);
      expect(res.quarter).toBe(2);
      expect(res.quarterBE).toBe("ไตรมาส 2");
    });

    it("should calculate Q3 for April, May, June", () => {
      const d = localDate(2027, 5, 20);
      const res = getThaiFiscalYear(d);

      expect(res.fiscalYearCE).toBe(2027);
      expect(res.quarter).toBe(3);
      expect(res.quarterBE).toBe("ไตรมาส 3");
    });

    it("should calculate Q4 for July, August, September", () => {
      const d = localDate(2027, 9, 30);
      const res = getThaiFiscalYear(d);

      expect(res.fiscalYearCE).toBe(2027);
      expect(res.quarter).toBe(4);
      expect(res.quarterBE).toBe("ไตรมาส 4");
    });

    it("works seamlessly on Chronera fluent instances", () => {
      const c = chronera("2026-10-15");
      const res = c.getThaiFiscalYear();

      expect(res.fiscalYearBE).toBe(2570);
      expect(res.quarter).toBe(1);
    });
  });

  describe("getTaxFilingDeadline", () => {
    it("should compute paper filing deadline for PND53 (7th of following month)", () => {
      // Tax period 8 (August 2026) -> Due Sept 7, 2026 (Monday)
      const res = getTaxFilingDeadline("PND53", 2026, 8, { eFiling: false });
      expect(res.taxForm).toBe("PND53");
      expect(res.standardDeadline).toEqual(localDate(2026, 9, 7));
      expect(res.adjustedDeadline).toEqual(localDate(2026, 9, 7));
      expect(res.isExtended).toBe(false);
      expect(res.isEFiling).toBe(false);
    });

    it("should compute e-Filing deadline for PND53 (+8 days -> 15th)", () => {
      const res = getTaxFilingDeadline("PND53", 2026, 8, { eFiling: true });
      expect(res.standardDeadline).toEqual(localDate(2026, 9, 15));
      expect(res.adjustedDeadline).toEqual(localDate(2026, 9, 15));
      expect(res.isEFiling).toBe(true);
    });

    it("should automatically roll deadline to next business day if landing on weekend", () => {
      // March 2026 tax month -> following month is April 2026.
      // April 7, 2026 is Tuesday. But Chakri Day is April 6 (Mon).
      // Let's test November 2026 -> December 2026.
      // Dec 7, 2026: Dec 5 is King Bhumibol's Birthday (Sat), Dec 7 is observed holiday (Mon)!
      const res = getTaxFilingDeadline("PND1", 2026, 11, { eFiling: false });
      expect(res.standardDeadline).toEqual(localDate(2026, 12, 7));
      // Dec 7 is observed holiday in Thailand, so it must extend to Tuesday Dec 8!
      expect(res.adjustedDeadline).toEqual(localDate(2026, 12, 8));
      expect(res.isExtended).toBe(true);
      expect(res.extensionDays).toBe(1);
    });

    it("should compute PP30 monthly VAT (15th / 23rd)", () => {
      const paper = getTaxFilingDeadline("PP30", 2026, 8, { eFiling: false });
      expect(paper.standardDeadline).toEqual(localDate(2026, 9, 15));

      const eFiling = getTaxFilingDeadline("PP30", 2026, 8, { eFiling: true });
      expect(eFiling.standardDeadline).toEqual(localDate(2026, 9, 23));
    });

    it("should compute PND50 (Annual Corporate Income Tax - 150 days)", () => {
      const res = getTaxFilingDeadline("PND50", 2026, 12, { eFiling: false });
      // 150 days after 2026-12-31 is 2027-05-30 (Sunday), so it rolls to Monday 2027-05-31
      expect(res.standardDeadline).toEqual(localDate(2027, 5, 30));
      expect(res.isExtended).toBe(true);
      expect(res.adjustedDeadline).toEqual(localDate(2027, 5, 31));
    });

    it("should compute PND51 (Half-Year Corporate Income Tax - Aug 31)", () => {
      const res = getTaxFilingDeadline("PND51", 2026, 6, { eFiling: false });
      expect(res.standardDeadline).toEqual(localDate(2026, 8, 31));
    });

    it("should get all monthly deadlines at once", () => {
      const all = getAllMonthlyTaxDeadlines(2026, 8, { eFiling: true });
      expect(all).toHaveLength(4);
      expect(all.map((a) => a.taxForm)).toEqual([
        "PND1",
        "PND3",
        "PND53",
        "PP30",
      ]);
    });
  });

  describe("thai Namespace & Additional Fiscal Helpers", () => {
    it("supports Date and ISO string inputs directly", async () => {
      const { thai, getThaiFiscalQuarter, getThaiFiscalYearRange } =
        await import("../../../src/index.js");

      const fyFromDate = thai.fiscalYear(new Date("2026-10-15T00:00:00Z"));
      expect(fyFromDate.fiscalYearBE).toBe(2570);
      expect(fyFromDate.quarter).toBe(1);

      expect(getThaiFiscalQuarter("2027-02-15")).toBe(2);
      expect(thai.fiscalQuarter("2027-08-01")).toBe(4);

      const rangeCE = getThaiFiscalYearRange(2027);
      expect(rangeCE.fiscalYearBE).toBe(2570);
      expect(rangeCE.startDate).toEqual(localDate(2026, 10, 1));
      expect(rangeCE.endDate).toEqual(localDate(2027, 9, 30));

      const rangeBE = thai.fiscalYearRange(2570);
      expect(rangeBE.fiscalYearCE).toBe(2027);
      expect(rangeBE.startDate).toEqual(localDate(2026, 10, 1));
    });

    it("exposes unified thai namespace methods", async () => {
      const { thai } = await import("../../../src/index.js");

      const tax = thai.taxDeadline("PND53", 2026, 9, { eFiling: true });
      expect(tax.taxForm).toBe("PND53");

      const lunar = thai.lunar(new Date("2026-10-15T00:00:00Z"));
      expect(lunar.phaseDay).toBeGreaterThanOrEqual(1);
      expect(typeof thai.isWanPhra("2026-10-15")).toBe("boolean");
      expect(thai.formatLunar("2026-10-15")).toContain("ค่ำ เดือน");

      const otPay = thai.overtimePay({
        monthlySalary: 24000,
        workdayOvertimeHours: 2,
        holidayRegularHours: 8,
        holidayOvertimeHours: 2,
      });
      expect(otPay.hourlyRate).toBe(100);
      expect(otPay.workdayOvertimePay).toBe(300); // 2 * 1.5 * 100
      expect(otPay.holidayRegularPay).toBe(800); // 8 * 1.0 * 100
      expect(otPay.holidayOvertimePay).toBe(600); // 2 * 3.0 * 100
      expect(otPay.totalOvertimePay).toBe(1700);

      expect(typeof thai.isBankHoliday("2026-05-01")).toBe("boolean");
      expect(thai.isBankHoliday("2026-05-01")).toBe(true); // National Labour Day is a BOT bank holiday
      expect(thai.isBankBusinessDay("2026-05-01")).toBe(false);
    });
  });
});
