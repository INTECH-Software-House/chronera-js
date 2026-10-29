import { describe, it, expect } from "vitest";
import {
  thai,
  getThaiFiscalYear,
  getThaiFiscalQuarter,
  getThaiFiscalYearRange,
  getTaxFilingDeadline,
  getAllMonthlyTaxDeadlines,
  calculateWorkShiftDuration,
  calculateNetBusinessMinutes,
  calculateSlaDeadline,
  calculateOvertime,
  calculateThaiOvertimePay,
  getThaiLunarDate,
  isWanPhra,
  getWanPhraInMonth,
  formatThaiLunarDate,
  thailandHolidays,
  thailandBankHolidays,
  formatThaiOfficialPreset,
  formatThaiShortDatePreset,
  formatThaiSlashDatePreset,
} from "../../../src/thai/index.js";
import { localDate } from "../../../src/index.js";

describe("@intech-software/chronera/thai subpath", () => {
  it("exports all standalone Thai Enterprise functions and holiday calendars", () => {
    expect(typeof getThaiFiscalYear).toBe("function");
    expect(typeof getThaiFiscalQuarter).toBe("function");
    expect(typeof getThaiFiscalYearRange).toBe("function");
    expect(typeof getTaxFilingDeadline).toBe("function");
    expect(typeof getAllMonthlyTaxDeadlines).toBe("function");
    expect(typeof calculateWorkShiftDuration).toBe("function");
    expect(typeof calculateNetBusinessMinutes).toBe("function");
    expect(typeof calculateSlaDeadline).toBe("function");
    expect(typeof calculateOvertime).toBe("function");
    expect(typeof calculateThaiOvertimePay).toBe("function");
    expect(typeof getThaiLunarDate).toBe("function");
    expect(typeof isWanPhra).toBe("function");
    expect(typeof getWanPhraInMonth).toBe("function");
    expect(typeof formatThaiLunarDate).toBe("function");
    expect(typeof thailandHolidays).toBe("object");
    expect(typeof thailandBankHolidays).toBe("object");
    expect(typeof formatThaiOfficialPreset).toBe("function");
    expect(typeof formatThaiShortDatePreset).toBe("function");
    expect(typeof formatThaiSlashDatePreset).toBe("function");
  });

  it("provides the unified thai namespace with fiscal, tax, overtime, lunar, BOT, and formatting helpers", () => {
    const fy = thai.fiscalYear("2026-10-15");
    expect(fy.fiscalYearBE).toBe(2570);
    expect(fy.quarter).toBe(1);

    const pnd53 = thai.taxDeadline("PND53", 2026, 9, { eFiling: true });
    expect(pnd53.adjustedDeadline).toEqual(localDate(2026, 10, 15));

    const ot = thai.overtimePay({
      monthlySalary: 36000,
      workdayOvertimeHours: 2,
    });
    expect(ot.hourlyRate).toBe(150);
    expect(ot.workdayOvertimePay).toBe(450);

    const lunar = thai.lunar("2026-07-29");
    expect(lunar.isWanPhra).toBe(true);

    expect(thai.isBankHoliday("2026-04-13")).toBe(true);
    expect(thai.isBankBusinessDay("2026-04-13")).toBe(false);
    expect(thai.getBankHolidays(2026).length).toBeGreaterThan(10);

    const d = localDate(2026, 10, 18);
    expect(thai.formatOfficial(d)).toBe("วันที่ 18 ตุลาคม พ.ศ. 2569");
    expect(thai.formatOfficial(d, { thaiDigits: true })).toBe(
      "วันที่ ๑๘ ตุลาคม พ.ศ. ๒๕๖๙",
    );
    expect(thai.formatShortDate(d)).toContain("2569");
    expect(thai.formatSlashDate(d)).toBe("18/10/2569");

    // Thai Banking & SSO Payroll
    expect(thai.dayCountFraction("2026-01-01", "2026-01-31").days).toBe(30);
    expect(
      thai.ssoContribution({ salary: 30000, yearOrDate: 2026 })
        .employeeContribution,
    ).toBe(875);
    expect(thai.ssoDeadline(2026, 10).effectiveDeadline).toEqual(
      localDate(2026, 11, 16),
    );
  });
});
