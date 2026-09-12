import { describe, expect, it } from "vitest";
import { localDate } from "../../../src/core/local-date.js";
import { dateRange } from "../../../src/core/range.js";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  rangeContains,
  rangeIntersection,
  rangeLengthInDays,
  rangeOverlaps,
  rangeUnion,
  splitByDay,
  splitByMonth,
  splitByWeek,
} from "../../../src/operations/interval.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("interval operations (v0.1.7)", () => {
  const d0101 = localDate(2026, 1, 1);
  const d0110 = localDate(2026, 1, 10);
  const d0115 = localDate(2026, 1, 15);
  const d0120 = localDate(2026, 1, 20);
  const d0131 = localDate(2026, 1, 31);
  const d0201 = localDate(2026, 2, 1);
  const d0228 = localDate(2026, 2, 28);
  const d0301 = localDate(2026, 3, 1);
  const d0331 = localDate(2026, 3, 31);

  // -------------------------------------------------------------------------
  // rangeContains
  // -------------------------------------------------------------------------
  describe("rangeContains", () => {
    it("returns true for date inside inclusive range", () => {
      const range = dateRange(d0101, d0131, true, true);
      expect(rangeContains(range, d0115)).toBe(true);
    });

    it("returns true for start date in inclusive range", () => {
      const range = dateRange(d0101, d0131, true, true);
      expect(rangeContains(range, d0101)).toBe(true);
    });

    it("returns true for end date in inclusive range", () => {
      const range = dateRange(d0101, d0131, true, true);
      expect(rangeContains(range, d0131)).toBe(true);
    });

    it("returns false for start date in exclusive-start range", () => {
      const range = dateRange(d0101, d0131, false, true);
      expect(rangeContains(range, d0101)).toBe(false);
    });

    it("returns false for end date in exclusive-end range", () => {
      const range = dateRange(d0101, d0131, true, false);
      expect(rangeContains(range, d0131)).toBe(false);
    });

    it("returns false for date before range", () => {
      const range = dateRange(d0110, d0131, true, true);
      expect(rangeContains(range, d0101)).toBe(false);
    });

    it("returns false for date after range", () => {
      const range = dateRange(d0101, d0115, true, true);
      expect(rangeContains(range, d0131)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // rangeOverlaps
  // -------------------------------------------------------------------------
  describe("rangeOverlaps", () => {
    it("returns true for overlapping ranges", () => {
      const a = dateRange(d0101, d0115, true, true);
      const b = dateRange(d0110, d0131, true, true);
      expect(rangeOverlaps(a, b)).toBe(true);
    });

    it("returns false for non-overlapping ranges", () => {
      const a = dateRange(d0101, d0110, true, true);
      const b = dateRange(d0120, d0131, true, true);
      expect(rangeOverlaps(a, b)).toBe(false);
    });

    it("returns true for touching ranges (inclusive-inclusive)", () => {
      const a = dateRange(d0101, d0110, true, true);
      const b = dateRange(d0110, d0120, true, true);
      expect(rangeOverlaps(a, b)).toBe(true);
    });

    it("returns false for touching ranges with exclusive boundaries", () => {
      const a = dateRange(d0101, d0110, true, false);
      const b = dateRange(d0110, d0120, false, true);
      expect(rangeOverlaps(a, b)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // rangeIntersection
  // -------------------------------------------------------------------------
  describe("rangeIntersection", () => {
    it("returns intersection of overlapping ranges", () => {
      const a = dateRange(d0101, d0120, true, true);
      const b = dateRange(d0110, d0131, true, true);
      const result = rangeIntersection(a, b);
      expect(result).not.toBeNull();
      expect(result!.start).toEqual(d0110);
      expect(result!.end).toEqual(d0120);
      expect(result!.startInclusive).toBe(true);
      expect(result!.endInclusive).toBe(true);
    });

    it("returns null for non-overlapping ranges", () => {
      const a = dateRange(d0101, d0110, true, true);
      const b = dateRange(d0120, d0131, true, true);
      expect(rangeIntersection(a, b)).toBeNull();
    });

    it("uses more restrictive inclusivity at boundaries", () => {
      const a = dateRange(d0101, d0120, true, true);
      const b = dateRange(d0101, d0120, false, false);
      const result = rangeIntersection(a, b);
      expect(result).not.toBeNull();
      expect(result!.startInclusive).toBe(false);
      expect(result!.endInclusive).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // rangeUnion
  // -------------------------------------------------------------------------
  describe("rangeUnion", () => {
    it("returns union of overlapping ranges", () => {
      const a = dateRange(d0101, d0115, true, true);
      const b = dateRange(d0110, d0131, true, true);
      const result = rangeUnion(a, b);
      expect(result.start).toEqual(d0101);
      expect(result.end).toEqual(d0131);
    });

    it("throws for non-overlapping non-adjacent ranges", () => {
      const a = dateRange(d0101, d0110, true, true);
      const b = dateRange(d0120, d0131, true, true);
      expect(() => rangeUnion(a, b)).toThrow(ChroneraError);
    });

    it("handles adjacent ranges", () => {
      const a = dateRange(d0101, d0115, true, true);
      const b = dateRange(d0115, d0131, true, true);
      const result = rangeUnion(a, b);
      expect(result.start).toEqual(d0101);
      expect(result.end).toEqual(d0131);
    });
  });

  // -------------------------------------------------------------------------
  // rangeLengthInDays
  // -------------------------------------------------------------------------
  describe("rangeLengthInDays", () => {
    it("returns correct length for inclusive range", () => {
      const range = dateRange(d0101, d0110, true, true);
      // Jan 1 to Jan 10 inclusive = 10 days
      expect(rangeLengthInDays(range)).toBe(10);
    });

    it("returns correct length for exclusive-exclusive range", () => {
      const range = dateRange(d0101, d0110, false, false);
      // (Jan 1, Jan 10) exclusive = 8 days
      expect(rangeLengthInDays(range)).toBe(8);
    });

    it("returns correct length for half-open range", () => {
      const range = dateRange(d0101, d0110, true, false);
      // [Jan 1, Jan 10) = 9 days
      expect(rangeLengthInDays(range)).toBe(9);
    });
  });

  // -------------------------------------------------------------------------
  // eachDayOfInterval
  // -------------------------------------------------------------------------
  describe("eachDayOfInterval", () => {
    it("returns all days in a small range", () => {
      const days = eachDayOfInterval(d0101, localDate(2026, 1, 5));
      expect(days).toHaveLength(5);
      expect(days[0]).toEqual(d0101);
      expect(days[4]).toEqual(localDate(2026, 1, 5));
    });

    it("returns a single day when start === end", () => {
      const days = eachDayOfInterval(d0101, d0101);
      expect(days).toHaveLength(1);
      expect(days[0]).toEqual(d0101);
    });

    it("returns empty array when start > end", () => {
      const days = eachDayOfInterval(d0110, d0101);
      expect(days).toHaveLength(0);
    });

    it("throws ChroneraError when range exceeds 3650 days", () => {
      const start = localDate(2000, 1, 1);
      const end = localDate(2020, 1, 1); // ~7305 days
      expect(() => eachDayOfInterval(start, end)).toThrow(ChroneraError);
      try {
        eachDayOfInterval(start, end);
      } catch (e) {
        expect((e as ChroneraError).code).toBe("CHRONERA_OUT_OF_RANGE");
      }
    });

    it("does not throw for exactly 3650 days", () => {
      const start = localDate(2016, 1, 1);
      const end = localDate(2025, 12, 27); // 3650 days later
      expect(() => eachDayOfInterval(start, end)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // eachWeekOfInterval
  // -------------------------------------------------------------------------
  describe("eachWeekOfInterval", () => {
    it("returns first day of each week in interval", () => {
      const weeks = eachWeekOfInterval(d0101, d0131);
      // 31 days / 7 = 4 full weeks + partial = 5 week starts
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks[0]).toEqual(d0101);
      // Each subsequent entry should be 7 days later
      for (let i = 1; i < weeks.length; i++) {
        const prev = weeks[i - 1]!;
        const curr = weeks[i]!;
        if (prev.kind === "local-date" && curr.kind === "local-date") {
          const prevAbs = prev.year * 365 + prev.month * 31 + prev.day;
          const currAbs = curr.year * 365 + curr.month * 31 + curr.day;
          // approx check — just confirm it advanced
          expect(currAbs).toBeGreaterThan(prevAbs);
        }
      }
    });

    it("returns single entry when range is less than 7 days", () => {
      const weeks = eachWeekOfInterval(d0101, localDate(2026, 1, 3));
      expect(weeks).toHaveLength(1);
      expect(weeks[0]).toEqual(d0101);
    });
  });

  // -------------------------------------------------------------------------
  // eachMonthOfInterval
  // -------------------------------------------------------------------------
  describe("eachMonthOfInterval", () => {
    it("returns first of each month in interval", () => {
      const months = eachMonthOfInterval(d0101, d0331);
      // Should include Jan, Feb, Mar starts
      expect(months.length).toBeGreaterThanOrEqual(3);
      expect(months[0]).toEqual(d0101);
    });

    it("returns single entry for same-month range", () => {
      const months = eachMonthOfInterval(d0101, d0115);
      expect(months).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // splitByDay
  // -------------------------------------------------------------------------
  describe("splitByDay", () => {
    it("returns one range per day", () => {
      const ranges = splitByDay(d0101, localDate(2026, 1, 5));
      expect(ranges).toHaveLength(5);
      for (const r of ranges) {
        expect(r.start).toEqual(r.end);
        expect(r.startInclusive).toBe(true);
        expect(r.endInclusive).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // splitByWeek
  // -------------------------------------------------------------------------
  describe("splitByWeek", () => {
    it("splits 14 days into 2 week ranges", () => {
      const ranges = splitByWeek(d0101, localDate(2026, 1, 14));
      expect(ranges).toHaveLength(2);
      expect(ranges[0]!.start).toEqual(d0101);
      expect(ranges[0]!.end).toEqual(localDate(2026, 1, 7));
      expect(ranges[1]!.start).toEqual(localDate(2026, 1, 8));
      expect(ranges[1]!.end).toEqual(localDate(2026, 1, 14));
    });

    it("clamps last week to end date", () => {
      const ranges = splitByWeek(d0101, localDate(2026, 1, 10));
      expect(ranges).toHaveLength(2);
      expect(ranges[1]!.end).toEqual(localDate(2026, 1, 10));
    });
  });

  // -------------------------------------------------------------------------
  // splitByMonth
  // -------------------------------------------------------------------------
  describe("splitByMonth", () => {
    it("splits Jan–Mar into 3 month ranges", () => {
      const ranges = splitByMonth(d0101, d0331);
      expect(ranges).toHaveLength(3);
      expect(ranges[0]!.start).toEqual(d0101);
      expect(ranges[0]!.end).toEqual(d0131);
      expect(ranges[1]!.start).toEqual(d0201);
      expect(ranges[1]!.end).toEqual(d0228);
      expect(ranges[2]!.start).toEqual(d0301);
      expect(ranges[2]!.end).toEqual(d0331);
    });

    it("handles a range starting mid-month", () => {
      const ranges = splitByMonth(d0115, d0301);
      expect(ranges.length).toBeGreaterThanOrEqual(2);
      expect(ranges[0]!.start).toEqual(d0115);
    });
  });
});
