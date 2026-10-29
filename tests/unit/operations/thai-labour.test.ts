import { describe, expect, it } from "vitest";
import {
  calculateProbationEndDate,
  calculateServiceTenure,
  calculateThaiSeverancePay,
  thai,
} from "../../../src/thai/index.js";

describe("Thai Labour Law (Section 118 Severance, Service Tenure & 119-Day Probation)", () => {
  describe("calculateProbationEndDate / thai.probation", () => {
    it("calculates exact 119th day cutoff and 120th day severance eligibility date", () => {
      // Jan (31) + Feb (28) + Mar (31) = 90 days -> + 29 days in April = 119th day on 2026-04-29
      const res = thai.probation("2026-01-01");
      expect(res.probationDays).toBe(119);
      expect(res.probationEndDate).toEqual({
        kind: "local-date",
        year: 2026,
        month: 4,
        day: 29,
      });
      expect(res.day119Date).toEqual({
        kind: "local-date",
        year: 2026,
        month: 4,
        day: 29,
      });
      expect(res.day120SeveranceEligibleDate).toEqual({
        kind: "local-date",
        year: 2026,
        month: 4,
        day: 30,
      });
      expect(res.recommendedEvaluationDate).toEqual({
        kind: "local-date",
        year: 2026,
        month: 3,
        day: 30,
      });
    });

    it("supports custom probation period (e.g. 90 days) while still reporting statutory Day 119/120", () => {
      const res = calculateProbationEndDate("2026-01-01", {
        probationDays: 90,
        evaluationLeadDays: 15,
      });
      expect(res.probationEndDate).toEqual({
        kind: "local-date",
        year: 2026,
        month: 3,
        day: 31,
      });
      expect(res.day119Date.month).toBe(4);
      expect(res.day119Date.day).toBe(29);
      expect(res.recommendedEvaluationDate).toEqual({
        kind: "local-date",
        year: 2026,
        month: 3,
        day: 16,
      });
    });
  });

  describe("calculateServiceTenure / thai.serviceTenure", () => {
    it("counts a full inclusive calendar year (Jan 1 to Dec 31) as 1 year 0 months 0 days", () => {
      const tenure = thai.serviceTenure("2025-01-01", "2025-12-31");
      expect(tenure.years).toBe(1);
      expect(tenure.months).toBe(0);
      expect(tenure.days).toBe(0);
      expect(tenure.totalDays).toBe(365);
      expect(tenure.isSeveranceEligible).toBe(true);
    });

    it("distinguishes 119 days vs 120 days accurately", () => {
      const d119 = thai.serviceTenure("2026-01-01", "2026-04-29");
      expect(d119.totalDays).toBe(119);
      expect(d119.isSeveranceEligible).toBe(false);

      const d120 = thai.serviceTenure("2026-01-01", "2026-04-30");
      expect(d120.totalDays).toBe(120);
      expect(d120.isSeveranceEligible).toBe(true);
    });

    it("supports exclusive end date mode (inclusiveEndDate: false)", () => {
      const tenure = calculateServiceTenure("2025-01-01", "2026-01-01", {
        inclusiveEndDate: false,
      });
      expect(tenure.years).toBe(1);
      expect(tenure.months).toBe(0);
      expect(tenure.days).toBe(0);
      expect(tenure.totalDays).toBe(365);
    });
  });

  describe("calculateThaiSeverancePay / thai.severancePay (Section 118 — All 6 Tiers)", () => {
    it("evaluates all 6 statutory severance tiers under Section 118", () => {
      // < 120 days (119 days) -> 0 days
      const t0 = thai.severancePay({
        hireDate: "2026-01-01",
        terminationDate: "2026-04-29",
        monthlySalary: 30_000,
      });
      expect(t0.tier).toBe("NONE");
      expect(t0.severanceDays).toBe(0);
      expect(t0.severanceAmount).toBe(0);

      // Tier 1: 120 days to < 1 year -> 30 days
      const t1 = thai.severancePay({
        hireDate: "2026-01-01",
        terminationDate: "2026-04-30",
        monthlySalary: 30_000,
      });
      expect(t1.tier).toBe("DAYS_120_TO_1Y");
      expect(t1.severanceDays).toBe(30);
      expect(t1.severanceAmount).toBe(30_000);

      // Tier 2: 1 year to < 3 years -> 90 days
      const t2 = thai.severancePay({
        hireDate: "2025-01-01",
        terminationDate: "2025-12-31",
        monthlySalary: 30_000,
      });
      expect(t2.tier).toBe("YEARS_1_TO_3");
      expect(t2.severanceDays).toBe(90);
      expect(t2.severanceAmount).toBe(90_000);

      // Tier 3: 3 years to < 6 years -> 180 days
      const t3 = thai.severancePay({
        hireDate: "2023-01-01",
        terminationDate: "2025-12-31",
        monthlySalary: 30_000,
      });
      expect(t3.tier).toBe("YEARS_3_TO_6");
      expect(t3.severanceDays).toBe(180);
      expect(t3.severanceAmount).toBe(180_000);

      // Tier 4: 6 years to < 10 years -> 240 days
      const t4 = thai.severancePay({
        hireDate: "2020-01-01",
        terminationDate: "2025-12-31",
        monthlySalary: 30_000,
      });
      expect(t4.tier).toBe("YEARS_6_TO_10");
      expect(t4.severanceDays).toBe(240);
      expect(t4.severanceAmount).toBe(240_000);

      // Tier 5: 10 years to < 20 years -> 300 days
      const t5 = thai.severancePay({
        hireDate: "2016-01-01",
        terminationDate: "2025-12-31",
        monthlySalary: 30_000,
      });
      expect(t5.tier).toBe("YEARS_10_TO_20");
      expect(t5.severanceDays).toBe(300);
      expect(t5.severanceAmount).toBe(300_000);

      // Tier 6: >= 20 years -> 400 days + 600,000 THB tax exemption cap
      const t6 = calculateThaiSeverancePay({
        hireDate: "2006-01-01",
        terminationDate: "2025-12-31",
        monthlySalary: 60_000, // 2,000 THB/day * 400 days = 800,000 THB
      });
      expect(t6.tier).toBe("YEARS_20_PLUS");
      expect(t6.severanceDays).toBe(400);
      expect(t6.dailyWage).toBe(2000);
      expect(t6.severanceAmount).toBe(800_000);
      expect(t6.taxExemptAmount).toBe(600_000);
      expect(t6.taxableAmount).toBe(200_000);
    });

    it("does not apply tax exemption when isRetirement is true", () => {
      const res = thai.severancePay({
        hireDate: "2006-01-01",
        terminationDate: "2025-12-31",
        monthlySalary: 45_000, // 1,500 * 400 = 600,000
        isRetirement: true,
      });
      expect(res.severanceAmount).toBe(600_000);
      expect(res.taxExemptAmount).toBe(0);
      expect(res.taxableAmount).toBe(600_000);
    });
  });
});
