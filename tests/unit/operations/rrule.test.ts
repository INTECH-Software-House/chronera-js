import { describe, it, expect } from "vitest";
import {
  parseRRule,
  rruleToHuman,
  rruleToString,
} from "../../../src/operations/rrule.js";
import { localDate } from "../../../src/core/local-date.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";

describe("RFC 5545 RRULE Engine", () => {
  describe("parseRRule & validation", () => {
    it("parses daily rule with interval and count", () => {
      const dtstart = localDate(2026, 9, 1);
      const job = parseRRule("RRULE:FREQ=DAILY;INTERVAL=2;COUNT=5", dtstart);
      expect(job.options.freq).toBe("DAILY");
      expect(job.options.interval).toBe(2);
      expect(job.options.count).toBe(5);

      const all = job.all();
      expect(all).toHaveLength(5);
      const days = all.map((inst) =>
        new Date(inst.epochMilliseconds).getUTCDate(),
      );
      expect(days).toEqual([1, 3, 5, 7, 9]);
    });

    it("parses weekly rule with BYDAY", () => {
      // 2026-09-07 is Monday
      const dtstart = localDate(2026, 9, 7);
      const job = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6", dtstart);
      expect(job.options.freq).toBe("WEEKLY");

      const all = job.all();
      expect(all).toHaveLength(6);
      const days = all.map((inst) =>
        new Date(inst.epochMilliseconds).getUTCDate(),
      );
      // Monday Sep 7, Wednesday Sep 9, Friday Sep 11, Monday Sep 14, Wednesday Sep 16, Friday Sep 18
      expect(days).toEqual([7, 9, 11, 14, 16, 18]);
    });

    it("parses monthly rule with BYMONTHDAY", () => {
      const dtstart = localDate(2026, 1, 15);
      const job = parseRRule("FREQ=MONTHLY;BYMONTHDAY=15;COUNT=4", dtstart);
      const all = job.all();
      expect(all).toHaveLength(4);
      const dates = all.map((inst) => {
        const d = new Date(inst.epochMilliseconds);
        return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
      });
      expect(dates).toEqual([
        "2026-1-15",
        "2026-2-15",
        "2026-3-15",
        "2026-4-15",
      ]);
    });

    it("parses monthly rule with nth weekday (e.g. 1MO = first Monday)", () => {
      // First Monday of month starting Oct 2026
      const dtstart = localDate(2026, 10, 1);
      const job = parseRRule("FREQ=MONTHLY;BYDAY=1MO;COUNT=3", dtstart);
      const all = job.all();
      expect(all).toHaveLength(3);
      // 2026-10: 1st Mon is Oct 5
      // 2026-11: 1st Mon is Nov 2
      // 2026-12: 1st Mon is Dec 7
      const dates = all.map((inst) => {
        const d = new Date(inst.epochMilliseconds);
        return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
      });
      expect(dates).toEqual(["2026-10-5", "2026-11-2", "2026-12-7"]);
    });

    it("parses UNTIL timestamp and stops occurrences correctly", () => {
      const dtstart = localDate(2026, 9, 1);
      const job = parseRRule("FREQ=DAILY;UNTIL=20260905T235959Z", dtstart);
      const all = job.all();
      expect(all).toHaveLength(5); // Sep 1, 2, 3, 4, 5
    });

    it("throws on invalid RRULE input", () => {
      expect(() => parseRRule("")).toThrow();
      expect(() => parseRRule("FREQ=HOURLY")).toThrow();
      expect(() => parseRRule("FREQ=DAILY;INTERVAL=-1")).toThrow();
      expect(() => parseRRule("FREQ=DAILY;COUNT=0")).toThrow();
    });
  });

  describe("next, nextN and matches", () => {
    it("returns next occurrence after a given timestamp", () => {
      const dtstart = localDate(2026, 9, 1);
      const job = parseRRule("FREQ=DAILY;INTERVAL=1", dtstart);

      // Ask for next after Sep 3 12:00
      const ref = instantFromEpochMilliseconds(Date.UTC(2026, 8, 3, 12, 0, 0));
      const nextRun = job.next(ref);
      expect(nextRun).not.toBeNull();
      const d = new Date(nextRun!.epochMilliseconds);
      expect(d.getUTCDate()).toBe(4);
    });

    it("returns nextN occurrences chronologically", () => {
      const dtstart = localDate(2026, 9, 1);
      const job = parseRRule("FREQ=WEEKLY;BYDAY=MO", dtstart);
      const nextThree = job.nextN(localDate(2026, 9, 1), 3);
      expect(nextThree).toHaveLength(3);
    });

    it("matches exact date occurrence", () => {
      const dtstart = localDate(2026, 9, 1);
      const job = parseRRule("FREQ=DAILY;INTERVAL=2;COUNT=10", dtstart);
      expect(job.matches(localDate(2026, 9, 1))).toBe(true);
      expect(job.matches(localDate(2026, 9, 3))).toBe(true);
      expect(job.matches(localDate(2026, 9, 2))).toBe(false);
    });
  });

  describe("rruleToString and rruleToHuman", () => {
    it("serializes options to string", () => {
      const str = rruleToString({
        freq: "WEEKLY",
        interval: 2,
        byDay: ["MO", "FR"],
        count: 10,
      });
      expect(str).toBe("RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=10;BYDAY=MO,FR");
    });

    it("humanizes in English and Thai", () => {
      const dailyEn = rruleToHuman("FREQ=DAILY;INTERVAL=1", "en");
      expect(dailyEn).toBe("Every day");

      const dailyTh = rruleToHuman("FREQ=DAILY;INTERVAL=1", "th");
      expect(dailyTh).toBe("ทุกวัน");

      const weeklyEn = rruleToHuman(
        "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10",
        "en",
      );
      expect(weeklyEn).toContain("Every week on Monday, Wednesday, Friday");
      expect(weeklyEn).toContain("10 times");

      const weeklyTh = rruleToHuman(
        "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10",
        "th",
      );
      expect(weeklyTh).toContain("ทุกวันจันทร์ พุธ ศุกร์");
      expect(weeklyTh).toContain("ทั้งหมด 10 ครั้ง");

      const monthlyTh = rruleToHuman("FREQ=MONTHLY;BYMONTHDAY=15", "th");
      expect(monthlyTh).toBe("ทุกเดือนในวันที่ 15");
    });
  });
});
