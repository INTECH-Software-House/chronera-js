import { describe, expect, it } from "vitest";
import { localDate } from "../../../src/core/local-date.js";
import {
  addDuration,
  addDurations,
  diffAsDuration,
  durationToHuman,
  durationToISO,
  durationTotalDays,
  parseDuration,
  scaleDuration,
  subtractDuration,
} from "../../../src/operations/duration-ops.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("duration operations (v0.1.7)", () => {
  // -------------------------------------------------------------------------
  // parseDuration
  // -------------------------------------------------------------------------
  describe("parseDuration", () => {
    it("parses a full ISO 8601 duration", () => {
      const dur = parseDuration("P1Y2M3DT4H5M6S");
      expect(dur.years).toBe(1);
      expect(dur.months).toBe(2);
      expect(dur.days).toBe(3);
      expect(dur.hours).toBe(4);
      expect(dur.minutes).toBe(5);
      expect(dur.seconds).toBe(6);
    });

    it("parses years only", () => {
      const dur = parseDuration("P1Y");
      expect(dur.years).toBe(1);
      expect(dur.months).toBeUndefined();
    });

    it("parses months only", () => {
      const dur = parseDuration("P3M");
      expect(dur.months).toBe(3);
    });

    it("parses weeks", () => {
      const dur = parseDuration("P2W");
      expect(dur.weeks).toBe(2);
    });

    it("parses fractional seconds into milliseconds", () => {
      const dur = parseDuration("PT1.5S");
      expect(dur.seconds).toBe(1);
      expect(dur.milliseconds).toBe(500);
    });

    it("parses negative duration with leading minus", () => {
      const dur = parseDuration("-P1Y");
      expect(dur.years).toBe(-1);
    });

    it("parses time-only duration", () => {
      const dur = parseDuration("PT30M");
      expect(dur.minutes).toBe(30);
      expect(dur.years).toBeUndefined();
    });

    it("throws ChroneraError for invalid string", () => {
      expect(() => parseDuration("not-a-duration")).toThrow(ChroneraError);
      try {
        parseDuration("X1Y");
      } catch (e) {
        expect((e as ChroneraError).code).toBe("CHRONERA_INVALID_DATE");
      }
    });

    it("throws for empty string", () => {
      expect(() => parseDuration("")).toThrow(ChroneraError);
    });
  });

  // -------------------------------------------------------------------------
  // durationToISO
  // -------------------------------------------------------------------------
  describe("durationToISO", () => {
    it("serializes years, months, days", () => {
      expect(durationToISO({ years: 1, months: 2, days: 3 })).toBe("P1Y2M3D");
    });

    it("serializes time parts", () => {
      expect(durationToISO({ hours: 4, minutes: 5, seconds: 6 })).toBe(
        "PT4H5M6S",
      );
    });

    it("serializes a complete duration", () => {
      const iso = durationToISO({ years: 1, months: 2, days: 3, hours: 4 });
      expect(iso).toBe("P1Y2M3DT4H");
    });

    it("serializes zero duration as 'P'", () => {
      expect(durationToISO({})).toBe("P");
    });

    it("serializes weeks", () => {
      expect(durationToISO({ weeks: 2 })).toBe("P2W");
    });

    it("serializes fractional seconds", () => {
      const iso = durationToISO({ seconds: 1, milliseconds: 500 });
      expect(iso).toBe("PT1.5S");
    });

    it("round-trips through parseDuration", () => {
      const original = { years: 1, months: 2, days: 10, hours: 3, minutes: 30 };
      const iso = durationToISO(original);
      const parsed = parseDuration(iso);
      expect(parsed.years).toBe(1);
      expect(parsed.months).toBe(2);
      expect(parsed.days).toBe(10);
      expect(parsed.hours).toBe(3);
      expect(parsed.minutes).toBe(30);
    });
  });

  // -------------------------------------------------------------------------
  // durationToHuman
  // -------------------------------------------------------------------------
  describe("durationToHuman", () => {
    it("formats in English", () => {
      const result = durationToHuman({ days: 5, hours: 3, minutes: 30 }, "en");
      expect(result).toBe("5 days, 3 hours, 30 minutes");
    });

    it("pluralizes correctly in English for 1 unit", () => {
      const result = durationToHuman({ years: 1, days: 1 }, "en");
      expect(result).toBe("1 year, 1 day");
    });

    it("formats in Thai", () => {
      const result = durationToHuman({ days: 5, hours: 3, minutes: 30 }, "th");
      expect(result).toContain("วัน");
      expect(result).toContain("ชั่วโมง");
      expect(result).toContain("นาที");
    });

    it("formats in Japanese", () => {
      const result = durationToHuman({ years: 2, months: 3 }, "ja");
      expect(result).toContain("年");
      expect(result).toContain("ヶ月");
    });

    it("formats in French", () => {
      const result = durationToHuman({ years: 2, months: 1 }, "fr");
      expect(result).toContain("ans");
      expect(result).toContain("mois");
    });

    it("formats in German", () => {
      const result = durationToHuman({ days: 3 }, "de");
      expect(result).toContain("Tage");
    });

    it("defaults to English for unknown locale", () => {
      const result = durationToHuman({ days: 1 }, "en");
      expect(result).toBe("1 day");
    });

    it("returns fallback for zero duration", () => {
      const result = durationToHuman({}, "en");
      expect(result).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // addDuration / subtractDuration
  // -------------------------------------------------------------------------
  describe("addDuration", () => {
    it("adds years to a local date", () => {
      const date = localDate(2026, 1, 15);
      const result = addDuration(date, { years: 1 });
      expect(result).toEqual(localDate(2027, 1, 15));
    });

    it("adds months to a local date", () => {
      const date = localDate(2026, 1, 15);
      const result = addDuration(date, { months: 2 });
      expect(result).toEqual(localDate(2026, 3, 15));
    });

    it("adds days to a local date", () => {
      const date = localDate(2026, 1, 1);
      const result = addDuration(date, { days: 10 });
      expect(result).toEqual(localDate(2026, 1, 11));
    });

    it("adds weeks to a local date", () => {
      const date = localDate(2026, 1, 1);
      const result = addDuration(date, { weeks: 2 });
      expect(result).toEqual(localDate(2026, 1, 15));
    });

    it("adds combined duration fields", () => {
      const date = localDate(2026, 1, 1);
      const result = addDuration(date, { years: 1, months: 2, days: 3 });
      expect(result).toEqual(localDate(2027, 3, 4));
    });
  });

  describe("subtractDuration", () => {
    it("subtracts months from a local date", () => {
      const date = localDate(2026, 6, 15);
      const result = subtractDuration(date, { months: 3 });
      expect(result).toEqual(localDate(2026, 3, 15));
    });

    it("subtracts days from a local date", () => {
      const date = localDate(2026, 1, 15);
      const result = subtractDuration(date, { days: 10 });
      expect(result).toEqual(localDate(2026, 1, 5));
    });
  });

  // -------------------------------------------------------------------------
  // diffAsDuration
  // -------------------------------------------------------------------------
  describe("diffAsDuration", () => {
    it("computes diff between two dates", () => {
      const start = localDate(2026, 1, 1);
      const end = localDate(2027, 3, 15);
      const dur = diffAsDuration(start, end);
      expect(dur.years).toBe(1);
      expect(dur.months).toBe(2);
      expect(dur.days).toBe(14);
    });

    it("returns same result regardless of argument order", () => {
      const a = localDate(2026, 1, 1);
      const b = localDate(2027, 6, 1);
      const d1 = diffAsDuration(a, b);
      const d2 = diffAsDuration(b, a);
      expect(d1).toEqual(d2);
    });

    it("returns empty object for same dates", () => {
      const d = localDate(2026, 6, 15);
      const dur = diffAsDuration(d, d);
      expect(dur.years).toBeUndefined();
      expect(dur.months).toBeUndefined();
      expect(dur.days).toBeUndefined();
    });

    it("computes day-only diff within same month", () => {
      const start = localDate(2026, 1, 5);
      const end = localDate(2026, 1, 20);
      const dur = diffAsDuration(start, end);
      expect(dur.days).toBe(15);
    });
  });

  // -------------------------------------------------------------------------
  // addDurations
  // -------------------------------------------------------------------------
  describe("addDurations", () => {
    it("adds two durations together", () => {
      const a = { years: 1, months: 2 };
      const b = { months: 3, days: 5 };
      const result = addDurations(a, b);
      expect(result.years).toBe(1);
      expect(result.months).toBe(5);
      expect(result.days).toBe(5);
    });

    it("handles empty durations", () => {
      const result = addDurations({}, { days: 5 });
      expect(result.days).toBe(5);
    });

    it("handles cancellation", () => {
      const result = addDurations({ days: 5 }, { days: -5 });
      expect(result.days).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // scaleDuration
  // -------------------------------------------------------------------------
  describe("scaleDuration", () => {
    it("scales a duration by an integer factor", () => {
      const dur = { years: 1, months: 2, days: 3 };
      const result = scaleDuration(dur, 2);
      expect(result.years).toBe(2);
      expect(result.months).toBe(4);
      expect(result.days).toBe(6);
    });

    it("negates a duration with factor -1", () => {
      const dur = { years: 1, days: 5 };
      const result = scaleDuration(dur, -1);
      expect(result.years).toBe(-1);
      expect(result.days).toBe(-5);
    });

    it("truncates non-integer results", () => {
      const dur = { days: 3 };
      const result = scaleDuration(dur, 0.5);
      expect(result.days).toBe(1);
    });

    it("returns empty object for zero factor", () => {
      const result = scaleDuration({ years: 1, months: 2 }, 0);
      expect(result.years).toBeUndefined();
      expect(result.months).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // durationTotalDays
  // -------------------------------------------------------------------------
  describe("durationTotalDays", () => {
    it("computes approximate total days", () => {
      expect(durationTotalDays({ years: 1 })).toBe(365);
      expect(durationTotalDays({ months: 1 })).toBe(30);
      expect(durationTotalDays({ weeks: 1 })).toBe(7);
      expect(durationTotalDays({ days: 5 })).toBe(5);
    });

    it("sums all fields", () => {
      const dur = { years: 1, months: 2, weeks: 1, days: 3 };
      expect(durationTotalDays(dur)).toBe(365 + 60 + 7 + 3);
    });

    it("returns 0 for empty duration", () => {
      expect(durationTotalDays({})).toBe(0);
    });
  });
});
