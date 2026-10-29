import { describe, it, expect } from "vitest";
import {
  localDate,
  thai,
  getThaiSsoWageCeiling,
  calculateThaiSsoContribution,
  getSsoFilingDeadline,
} from "../../../src/index.js";

describe("Thai Social Security (ประกันสังคม สปส. 1-10) & Payroll Engine", () => {
  describe("getThaiSsoWageCeiling (Stepped Wage Ceiling 2568–2575)", () => {
    it("returns accurate stepped wage ceilings for CE and BE years", () => {
      // <= 2025 (พ.ศ. 2568): 15,000 THB -> max 750 THB
      expect(getThaiSsoWageCeiling(2025).maxWage).toBe(15000);
      expect(getThaiSsoWageCeiling(2568).maxMonthlyContribution).toBe(750);

      // 2026–2028 (พ.ศ. 2569–2571): 17,500 THB -> max 875 THB
      expect(getThaiSsoWageCeiling(2026).maxWage).toBe(17500);
      expect(getThaiSsoWageCeiling(2570).maxMonthlyContribution).toBe(875);

      // 2029–2031 (พ.ศ. 2572–2574): 20,000 THB -> max 1,000 THB
      expect(getThaiSsoWageCeiling(2029).maxWage).toBe(20000);
      expect(getThaiSsoWageCeiling(2573).maxMonthlyContribution).toBe(1000);

      // >= 2032 (พ.ศ. 2575+): 23,000 THB -> max 1,150 THB
      expect(getThaiSsoWageCeiling(2032).maxWage).toBe(23000);
      expect(getThaiSsoWageCeiling(2575).maxMonthlyContribution).toBe(1150);
    });
  });

  describe("calculateThaiSsoContribution (Section 33 & Section 39)", () => {
    it("calculates Section 33 contribution capped at 17,500 THB (875 THB) in 2026", () => {
      const res = calculateThaiSsoContribution({
        salary: 45000,
        yearOrDate: "2026-10-29",
      });
      expect(res.section).toBe(33);
      expect(res.effectiveYearBE).toBe(2569);
      expect(res.maxWageCeiling).toBe(17500);
      expect(res.contributoryWage).toBe(17500);
      expect(res.employeeContribution).toBe(875);
      expect(res.employerContribution).toBe(875);
      expect(res.totalContribution).toBe(1750);
    });

    it("enforces minimum wage floor of 1,650 THB for low positive salaries and 0 for zero salary", () => {
      const low = calculateThaiSsoContribution({
        salary: 1000,
        yearOrDate: 2026,
      });
      expect(low.contributoryWage).toBe(1650);
      // 1650 * 0.05 = 82.5 -> rounds to 83 THB per SSO rule
      expect(low.employeeContribution).toBe(83);

      const zero = calculateThaiSsoContribution({
        salary: 0,
        yearOrDate: 2026,
      });
      expect(zero.employeeContribution).toBe(0);
      expect(zero.totalContribution).toBe(0);
    });

    it("calculates Section 39 voluntary insured contribution (4,800 THB base @ 9% = 432 THB)", () => {
      const s39 = thai.ssoContribution({ section: 39 });
      expect(s39.contributoryWage).toBe(4800);
      expect(s39.employeeContribution).toBe(432);
      expect(s39.employerContribution).toBe(0);
      expect(s39.totalContribution).toBe(432);
    });
  });

  describe("getSsoFilingDeadline (สปส. 1-10 Monthly Remittance)", () => {
    it("computes standard 15th deadline and +7 business days e-Payment extension", () => {
      // Contribution for October 2026 -> standard deadline is 2026-11-15 (Sunday!)
      // Adjusted standard deadline rolls to Monday 2026-11-16
      const standard = getSsoFilingDeadline(2026, 10);
      expect(standard.standardDeadline).toEqual(localDate(2026, 11, 15));
      expect(standard.adjustedStandardDeadline).toEqual(
        localDate(2026, 11, 16),
      );
      expect(standard.effectiveDeadline).toEqual(localDate(2026, 11, 16));

      // e-Payment (+7 business days after Nov 15, 2026 -> Tue Nov 24, 2026)
      const epay = thai.ssoDeadline(2026, 10, { ePayment: true });
      expect(epay.isEPayment).toBe(true);
      expect(epay.effectiveDeadline).toEqual(localDate(2026, 11, 24));
    });
  });
});
