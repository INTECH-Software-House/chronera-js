import { describe, it, expect } from "vitest";
import {
  localDate,
  thai,
  adjustBusinessDate,
  calculateDayCountFraction,
  calculateAccruedInterest,
  calculatePaymentDueDate,
} from "../../../src/index.js";

describe("Thai Banking & FinTech Interest Engine", () => {
  describe("calculateDayCountFraction & calculateAccruedInterest", () => {
    it("computes ACT/365 Fixed (Thai banking standard) and accrued interest with WHT", () => {
      const dc = calculateDayCountFraction(
        "2026-01-01",
        "2026-04-01",
        "ACT/365",
      );
      expect(dc.days).toBe(90);
      expect(dc.denominator).toBe(365);
      expect(dc.yearFraction).toBeCloseTo(90 / 365, 8);

      const interest = calculateAccruedInterest({
        principal: 1_000_000,
        annualRate: 0.0365, // 3.65% p.a. -> exactly 100 THB/day on ACT/365!
        startDate: "2026-01-01",
        endDate: "2026-04-01",
        convention: "ACT/365",
        withholdingTaxRate: 0.15, // 15% WHT on deposit interest
      });

      expect(interest.days).toBe(90);
      expect(interest.grossInterest).toBe(9000);
      expect(interest.withholdingTax).toBe(1350);
      expect(interest.netInterest).toBe(7650);
    });

    it("computes ACT/360 and 30/360 (Bond Basis)", () => {
      const act360 = calculateDayCountFraction(
        "2026-01-01",
        "2026-07-01",
        "ACT/360",
      );
      expect(act360.days).toBe(181);
      expect(act360.denominator).toBe(360);
      expect(act360.yearFraction).toBeCloseTo(181 / 360, 8);

      const bond30 = calculateDayCountFraction(
        "2026-01-31",
        "2026-03-31",
        "30/360",
      );
      expect(bond30.days).toBe(60);
      expect(bond30.yearFraction).toBeCloseTo(60 / 360, 8);
    });

    it("computes ACT/ACT (ISDA) splitting leap year and normal year days", () => {
      // 2024 is a leap year (366 days), 2025 is a normal year (365 days)
      const isda = calculateDayCountFraction(
        "2024-07-01",
        "2025-07-01",
        "ACT/ACT",
      );
      expect(isda.days).toBe(365);
      expect(isda.denominator).toBe("ISDA");
      // 184 days in 2024 (Jul 1 - Dec 31) / 366 + 181 days in 2025 (Jan 1 - Jul 1) / 365
      const expected = 184 / 366 + 181 / 365;
      expect(isda.yearFraction).toBeCloseTo(expected, 8);
    });
  });

  describe("adjustBusinessDate (Business Day Roll Conventions)", () => {
    it("rolls forward on 'following' and rolls backward on 'modified-following' when crossing month end", () => {
      // 2026-05-31 is a Sunday (Visakha Bucha Day) and 2026-06-01 is Substitution for Visakha Bucha Day!
      // Following -> Tuesday 2026-06-02 (crosses into June)
      // Modified-Following -> Friday 2026-05-29 (stays in May!)
      const following = adjustBusinessDate("2026-05-31", "following", "TH-BOT");
      expect(following).toEqual(localDate(2026, 6, 2));

      const modFollowing = adjustBusinessDate(
        "2026-05-31",
        "modified-following",
        "TH-BOT",
      );
      expect(modFollowing).toEqual(localDate(2026, 5, 29));

      const preceding = adjustBusinessDate("2026-05-31", "preceding", "TH-BOT");
      expect(preceding).toEqual(localDate(2026, 5, 29));
    });
  });

  describe("calculatePaymentDueDate (AP/AR Commercial Credit Terms)", () => {
    it("computes NET30, EOM, and EOM+30 with billing cut-off and BOT holiday rollover", () => {
      // Invoice on 2026-04-01 with NET12 -> raw due date 2026-04-13 (Songkran festival 13-15 Apr!)
      // Should roll to Thursday 2026-04-16
      const net12 = calculatePaymentDueDate(
        "2026-04-01",
        { type: "NET", days: 12 },
        { calendar: "TH-BOT" },
      );
      expect(net12.rawDueDate).toEqual(localDate(2026, 4, 13));
      expect(net12.adjustedDueDate).toEqual(localDate(2026, 4, 16));
      expect(net12.isAdjusted).toBe(true);
      expect(net12.creditDays).toBe(15);

      // EOM+30 with billingCutOffDay: 25
      // Invoice on 2026-03-26 (after 25th cut-off) -> billing base rolls to 2026-04-01
      // End of April = 2026-04-30, +30 days = 2026-05-30 (Saturday), 2026-05-31 (Sunday Visakha Bucha),
      // 2026-06-01 (Monday Substitution for Visakha Bucha) -> rolls to Tuesday 2026-06-02!
      const eom30 = thai.paymentDueDate("2026-03-26", "EOM+30", {
        billingCutOffDay: 25,
        rollConvention: "following",
      });
      expect(eom30.billingBaseDate).toEqual(localDate(2026, 4, 1));
      expect(eom30.rawDueDate).toEqual(localDate(2026, 5, 30));
      expect(eom30.adjustedDueDate).toEqual(localDate(2026, 6, 2));
    });
  });
});
