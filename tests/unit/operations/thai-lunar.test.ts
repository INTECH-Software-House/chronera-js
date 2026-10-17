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
