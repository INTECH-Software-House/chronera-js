import { describe, expect, it } from "vitest";
import {
  getThaiLunarDate,
  isWanPhra,
  formatThaiLunarDate,
  getWanPhraInMonth,
} from "../../../src/operations/thai-lunar.js";
import { localDate } from "../../../src/core/local-date.js";
import { chronera } from "../../../src/chronera.js";

describe("Thai Lunar Phase & Wan Phra Engine", () => {
  describe("getThaiLunarDate", () => {
    it("identifies lunar phase, waxing/waning, and illumination", () => {
      // 2026-03-03 is Full Moon (Makha Bucha, ขึ้น ๑๕ ค่ำ)
      const res = getThaiLunarDate(localDate(2026, 3, 3));

      expect(res.isWaxing).toBe(true);
      expect(res.phaseDay).toBe(15);
      expect(res.moonPhase).toBe("full-moon");
      expect(res.illumination).toBeGreaterThan(0.9);
      expect(res.isWanPhra).toBe(true);
      expect(res.wanPhraTitle).toContain("วันเพ็ญ");
    });

    it("formats Thai Lunar date into traditional phrase with Thai digits", () => {
      const res = getThaiLunarDate(localDate(2026, 3, 3));
      const formatted = formatThaiLunarDate(res);

      expect(formatted).toContain("ขึ้น ๑๕ ค่ำ");
    });

    it("formats Thai Lunar date with Arabic digits", () => {
      const res = getThaiLunarDate(localDate(2026, 3, 3));
      const formatted = formatThaiLunarDate(res, { thaiDigits: false });

      expect(formatted).toContain("ขึ้น 15 ค่ำ");
    });

    it("integrates with Chronera fluent instance", () => {
      const c = chronera("2026-03-03");
      expect(c.isWanPhra()).toBe(true);
      expect(c.formatThaiLunarDate()).toContain("ขึ้น ๑๕ ค่ำ");
    });

    it("computes true Suriyayatra lunar months, Adhikamasa (อธิกมาส เดือน 8 สองหน), and Adhikavara (อธิกวาร)", () => {
      // 2026 (BE 2569) is Adhikamasa:
      // 2026-03-03 (Makha Bucha) -> ขึ้น ๑๕ ค่ำ เดือน ๔
      const makha2026 = getThaiLunarDate("2026-03-03");
      expect(makha2026.lunarMonth).toBe(4);
      expect(makha2026.isLeapMonth).toBe(false);
      expect(makha2026.isLeapMonthYear).toBe(true);
      expect(formatThaiLunarDate(makha2026)).toBe("ขึ้น ๑๕ ค่ำ เดือน ๔");

      // 2026-06-29 = ขึ้น ๑๕ ค่ำ เดือน ๘ แรก (first 8th month; 14d after May 31 + 15d = Jun 29)
      const eighthFirst = getThaiLunarDate("2026-06-29");
      expect(eighthFirst.lunarMonth).toBe(8);
      expect(eighthFirst.isLeapMonth).toBe(false);
      expect(eighthFirst.isWanPhra).toBe(true);

      // 2026-07-29 (Asarnha Bucha) = ขึ้น ๑๕ ค่ำ เดือน ๘ หลัง (second 8th month)
      const asarnha2026 = getThaiLunarDate("2026-07-29");
      expect(asarnha2026.lunarMonth).toBe(8);
      expect(asarnha2026.isLeapMonth).toBe(true);
      expect(formatThaiLunarDate(asarnha2026)).toBe("ขึ้น ๑๕ ค่ำ เดือน ๘ หลัง");

      // 2025 (BE 2568) is Adhikavara: Month 7 has 30 days (ends on แรม ๑๕ ค่ำ เดือน ๗ = 2025-06-25)
      const month7End2025 = getThaiLunarDate("2025-06-25");
      expect(month7End2025.isExtraDayYear).toBe(true);
      expect(month7End2025.lunarMonth).toBe(7);
      expect(month7End2025.isWaxing).toBe(false);
      expect(month7End2025.phaseDay).toBe(15);
      expect(month7End2025.isWanPhra).toBe(true);

      // 2027 (BE 2570) normal year: Visakha 2027-05-20 = ขึ้น ๑๕ ค่ำ เดือน ๖, Asarnha 2027-07-18 = ขึ้น ๑๕ ค่ำ เดือน ๘
      const visakha2027 = getThaiLunarDate("2027-05-20");
      expect(visakha2027.lunarMonth).toBe(6);
      expect(visakha2027.phaseDay).toBe(15);
      expect(visakha2027.isWanPhra).toBe(true);

      const asarnha2027 = getThaiLunarDate("2027-07-18");
      expect(asarnha2027.lunarMonth).toBe(8);
      expect(asarnha2027.phaseDay).toBe(15);
      expect(asarnha2027.isWanPhra).toBe(true);
    });
  });

  describe("getWanPhraInMonth", () => {
    it("returns 4 holy days per month", () => {
      const holyDays = getWanPhraInMonth(2026, 3);
      expect(holyDays.length).toBeGreaterThanOrEqual(3);
      expect(holyDays.length).toBeLessThanOrEqual(5);

      for (const day of holyDays) {
        expect(isWanPhra(day)).toBe(true);
      }
    });
  });
});
