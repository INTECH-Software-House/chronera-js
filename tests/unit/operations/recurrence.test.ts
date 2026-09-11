import { describe, expect, it } from "vitest";
import { localDate } from "../../../src/core/local-date.js";
import {
  getOccurrences,
  isOccurrence,
  recur,
} from "../../../src/operations/recurrence.js";
import type { RecurrenceRule } from "../../../src/operations/recurrence.js";

describe("recurrence engine (v0.1.7)", () => {
  const start = localDate(2026, 1, 5); // Monday, Jan 5, 2026

  // -------------------------------------------------------------------------
  // Daily recurrence
  // -------------------------------------------------------------------------
  describe("daily recurrence", () => {
    it("generates N daily occurrences", () => {
      const rule: RecurrenceRule = { frequency: "daily", interval: 1 };
      const occ = getOccurrences(start, rule, 5);
      expect(occ).toHaveLength(5);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2026, 1, 6));
      expect(occ[4]).toEqual(localDate(2026, 1, 9));
    });

    it("respects interval=2 (every other day)", () => {
      const rule: RecurrenceRule = { frequency: "daily", interval: 2 };
      const occ = getOccurrences(start, rule, 3);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2026, 1, 7));
      expect(occ[2]).toEqual(localDate(2026, 1, 9));
    });

    it("respects count limit", () => {
      const rule: RecurrenceRule = {
        frequency: "daily",
        interval: 1,
        count: 3,
      };
      const occ = getOccurrences(start, rule);
      expect(occ).toHaveLength(3);
    });

    it("respects until date", () => {
      const rule: RecurrenceRule = {
        frequency: "daily",
        interval: 1,
        until: localDate(2026, 1, 10),
      };
      const occ = getOccurrences(start, rule);
      expect(occ.every((d) => d.kind === "local-date" && d.day <= 10)).toBe(
        true,
      );
      expect(occ[occ.length - 1]).toEqual(localDate(2026, 1, 10));
    });
  });

  // -------------------------------------------------------------------------
  // Weekly recurrence
  // -------------------------------------------------------------------------
  describe("weekly recurrence", () => {
    it("generates weekly occurrences", () => {
      const rule: RecurrenceRule = { frequency: "weekly", interval: 1 };
      const occ = getOccurrences(start, rule, 4);
      expect(occ).toHaveLength(4);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2026, 1, 12));
      expect(occ[2]).toEqual(localDate(2026, 1, 19));
      expect(occ[3]).toEqual(localDate(2026, 1, 26));
    });

    it("generates bi-weekly occurrences", () => {
      const rule: RecurrenceRule = { frequency: "weekly", interval: 2 };
      const occ = getOccurrences(start, rule, 3);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2026, 1, 19));
      expect(occ[2]).toEqual(localDate(2026, 2, 2));
    });

    it("generates weekly occurrences on specific days of week", () => {
      // Monday, Jan 5, 2026 is our start
      const rule: RecurrenceRule = {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: ["monday", "wednesday", "friday"],
        count: 9,
      };
      const occ = getOccurrences(start, rule);
      expect(occ).toHaveLength(9);
      // First 3 should be Mon Jan 5, Wed Jan 7, Fri Jan 9
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2026, 1, 7));
      expect(occ[2]).toEqual(localDate(2026, 1, 9));
      // Then Mon Jan 12, Wed Jan 14, Fri Jan 16
      expect(occ[3]).toEqual(localDate(2026, 1, 12));
      expect(occ[4]).toEqual(localDate(2026, 1, 14));
      expect(occ[5]).toEqual(localDate(2026, 1, 16));
    });
  });

  // -------------------------------------------------------------------------
  // Monthly recurrence
  // -------------------------------------------------------------------------
  describe("monthly recurrence", () => {
    it("generates monthly occurrences", () => {
      const rule: RecurrenceRule = { frequency: "monthly", interval: 1 };
      const occ = getOccurrences(start, rule, 4);
      expect(occ).toHaveLength(4);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2026, 2, 5));
      expect(occ[2]).toEqual(localDate(2026, 3, 5));
      expect(occ[3]).toEqual(localDate(2026, 4, 5));
    });

    it("generates quarterly occurrences (interval=3)", () => {
      const rule: RecurrenceRule = { frequency: "monthly", interval: 3 };
      const occ = getOccurrences(start, rule, 4);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2026, 4, 5));
      expect(occ[2]).toEqual(localDate(2026, 7, 5));
      expect(occ[3]).toEqual(localDate(2026, 10, 5));
    });

    it("respects until date", () => {
      const rule: RecurrenceRule = {
        frequency: "monthly",
        interval: 1,
        until: localDate(2026, 6, 1),
      };
      const occ = getOccurrences(start, rule);
      expect(occ.length).toBeLessThanOrEqual(6);
      const last = occ[occ.length - 1]!;
      if (last.kind === "local-date") {
        expect(last.month).toBeLessThanOrEqual(6);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Yearly recurrence
  // -------------------------------------------------------------------------
  describe("yearly recurrence", () => {
    it("generates annual occurrences", () => {
      const rule: RecurrenceRule = { frequency: "yearly", interval: 1 };
      const occ = getOccurrences(start, rule, 5);
      expect(occ).toHaveLength(5);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2027, 1, 5));
      expect(occ[4]).toEqual(localDate(2030, 1, 5));
    });

    it("generates biennial occurrences (interval=2)", () => {
      const rule: RecurrenceRule = { frequency: "yearly", interval: 2 };
      const occ = getOccurrences(start, rule, 3);
      expect(occ[0]).toEqual(localDate(2026, 1, 5));
      expect(occ[1]).toEqual(localDate(2028, 1, 5));
      expect(occ[2]).toEqual(localDate(2030, 1, 5));
    });
  });

  // -------------------------------------------------------------------------
  // isOccurrence
  // -------------------------------------------------------------------------
  describe("isOccurrence", () => {
    it("returns true for dates that are daily occurrences", () => {
      const rule: RecurrenceRule = { frequency: "daily", interval: 1 };
      expect(isOccurrence(localDate(2026, 1, 5), start, rule)).toBe(true);
      expect(isOccurrence(localDate(2026, 1, 10), start, rule)).toBe(true);
    });

    it("returns false for date before start", () => {
      const rule: RecurrenceRule = { frequency: "daily", interval: 1 };
      expect(isOccurrence(localDate(2026, 1, 4), start, rule)).toBe(false);
    });

    it("returns true for monthly occurrence", () => {
      const rule: RecurrenceRule = { frequency: "monthly", interval: 1 };
      expect(isOccurrence(localDate(2026, 3, 5), start, rule)).toBe(true);
    });

    it("returns false for non-monthly date", () => {
      const rule: RecurrenceRule = { frequency: "monthly", interval: 1 };
      expect(isOccurrence(localDate(2026, 3, 6), start, rule)).toBe(false);
    });

    it("returns true for yearly occurrence", () => {
      const rule: RecurrenceRule = { frequency: "yearly", interval: 1 };
      expect(isOccurrence(localDate(2028, 1, 5), start, rule)).toBe(true);
    });

    it("respects until in isOccurrence", () => {
      const rule: RecurrenceRule = {
        frequency: "daily",
        interval: 1,
        until: localDate(2026, 1, 7),
      };
      expect(isOccurrence(localDate(2026, 1, 10), start, rule)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Fluent builder (recur)
  // -------------------------------------------------------------------------
  describe("recur() fluent builder", () => {
    it("generates N occurrences via .next(n)", () => {
      const dates = recur(start).every(1).days().next(5);
      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(localDate(2026, 1, 5));
      expect(dates[4]).toEqual(localDate(2026, 1, 9));
    });

    it("generates occurrences via .occurrences() with .count()", () => {
      const dates = recur(start).every(1).months().count(4).occurrences();
      expect(dates).toHaveLength(4);
      expect(dates[3]).toEqual(localDate(2026, 4, 5));
    });

    it("generates occurrences via .until()", () => {
      const dates = recur(start)
        .every(1)
        .days()
        .until(localDate(2026, 1, 8))
        .occurrences();
      expect(dates).toHaveLength(4); // Jan 5, 6, 7, 8
    });

    it("supports weekly with .on() for specific days", () => {
      const dates = recur(start)
        .every(1)
        .weeks()
        .on(["monday", "friday"])
        .count(4)
        .occurrences();
      expect(dates).toHaveLength(4);
      // Mon Jan 5, Fri Jan 9, Mon Jan 12, Fri Jan 16
      expect(dates[0]).toEqual(localDate(2026, 1, 5));
      expect(dates[1]).toEqual(localDate(2026, 1, 9));
    });

    it(".build() returns the RecurrenceRule", () => {
      const rule = recur(start).every(2).months().count(5).build();
      expect(rule.frequency).toBe("monthly");
      expect(rule.interval).toBe(2);
      expect(rule.count).toBe(5);
    });

    it("respects safety cap of 500 max occurrences", () => {
      const dates = recur(start).every(1).days().occurrences();
      expect(dates.length).toBeLessThanOrEqual(500);
    });
  });
});
