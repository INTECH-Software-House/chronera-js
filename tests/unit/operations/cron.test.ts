import { describe, it, expect } from "vitest";
import {
  parseCron,
  isCronMatch,
  cronNextRun,
  cronNextN,
  cronPrevRun,
  cronToHuman,
} from "../../../src/operations/cron.js";
import { localDate } from "../../../src/core/local-date.js";

describe("Cron Expression Engine", () => {
  describe("parseCron validation", () => {
    it("parses valid 5-field expression", () => {
      const job = parseCron("0 9 * * 1-5");
      expect(job.fields.minutes).toEqual([0]);
      expect(job.fields.hours).toEqual([9]);
      expect(job.fields.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it("throws on invalid field count", () => {
      expect(() => parseCron("0 9 * *")).toThrow();
      expect(() => parseCron("0 9 * * * *")).toThrow();
    });

    it("throws on invalid range or step", () => {
      expect(() => parseCron("70 9 * * *")).toThrow();
      expect(() => parseCron("0 25 * * *")).toThrow();
      expect(() => parseCron("0 9 32 * *")).toThrow();
      expect(() => parseCron("0 9 * 13 *")).toThrow();
      expect(() => parseCron("0 9 * * 8")).toThrow();
      expect(() => parseCron("0 9 * * */0")).toThrow();
      expect(() => parseCron("0 9 * * 5-2")).toThrow();
    });

    it("handles named days and months", () => {
      const job = parseCron("30 4 * JAN-MAR MON-FRI");
      expect(job.fields.months).toEqual([1, 2, 3]);
      expect(job.fields.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it("handles 0 and 7 both as Sunday", () => {
      const job1 = parseCron("0 0 * * 0");
      const job2 = parseCron("0 0 * * 7");
      expect(job1.fields.daysOfWeek).toEqual([0]);
      expect(job2.fields.daysOfWeek).toEqual([0]);
    });
  });

  describe("matches & isCronMatch", () => {
    it("matches exact minute and hour in UTC", () => {
      const testDate = new Date(Date.UTC(2026, 8, 17, 9, 0, 0)); // Thu Sep 17 2026 09:00 UTC
      expect(isCronMatch("0 9 * * *", testDate)).toBe(true);
      expect(isCronMatch("30 9 * * *", testDate)).toBe(false);
      expect(isCronMatch("0 10 * * *", testDate)).toBe(false);
    });

    it("matches weekday expression", () => {
      const thursday = new Date(Date.UTC(2026, 8, 17, 9, 0, 0)); // Thursday
      const saturday = new Date(Date.UTC(2026, 8, 19, 9, 0, 0)); // Saturday
      expect(isCronMatch("0 9 * * 1-5", thursday)).toBe(true);
      expect(isCronMatch("0 9 * * 1-5", saturday)).toBe(false);
    });

    it("supports LocalDate input", () => {
      const d = localDate(2026, 9, 17);
      expect(isCronMatch("0 0 17 9 *", d)).toBe(true);
      expect(isCronMatch("0 0 18 9 *", d)).toBe(false);
    });
  });

  describe("next, nextN & prev", () => {
    it("calculates next occurrence accurately", () => {
      const base = new Date(Date.UTC(2026, 8, 17, 8, 45, 0));
      const nextRun = cronNextRun("0 9 * * *", base);
      const nextDate = new Date(nextRun.epochMilliseconds);
      expect(nextDate.getUTCHours()).toBe(9);
      expect(nextDate.getUTCMinutes()).toBe(0);
      expect(nextDate.getUTCDate()).toBe(17);
    });

    it("advances to next day if time has passed", () => {
      const base = new Date(Date.UTC(2026, 8, 17, 9, 30, 0));
      const nextRun = cronNextRun("0 9 * * *", base);
      const nextDate = new Date(nextRun.epochMilliseconds);
      expect(nextDate.getUTCHours()).toBe(9);
      expect(nextDate.getUTCDate()).toBe(18);
    });

    it("calculates nextN runs chronologically", () => {
      const base = new Date(Date.UTC(2026, 8, 17, 0, 0, 0));
      const runs = cronNextN("0 12 * * *", base, 3);
      expect(runs).toHaveLength(3);
      const d1 = new Date(runs[0]!.epochMilliseconds);
      const d2 = new Date(runs[1]!.epochMilliseconds);
      const d3 = new Date(runs[2]!.epochMilliseconds);
      expect(d1.getUTCDate()).toBe(17);
      expect(d2.getUTCDate()).toBe(18);
      expect(d3.getUTCDate()).toBe(19);
      expect(d1.getUTCHours()).toBe(12);
    });

    it("calculates previous occurrence", () => {
      const base = new Date(Date.UTC(2026, 8, 17, 9, 30, 0));
      const prevRun = cronPrevRun("0 9 * * *", base);
      const prevDate = new Date(prevRun.epochMilliseconds);
      expect(prevDate.getUTCHours()).toBe(9);
      expect(prevDate.getUTCMinutes()).toBe(0);
      expect(prevDate.getUTCDate()).toBe(17);
    });
  });

  describe("cronToHuman humanizer", () => {
    it("humanizes every minute", () => {
      expect(cronToHuman("* * * * *", "en")).toBe("Every minute");
      expect(cronToHuman("* * * * *", "th")).toBe("ทุกนาที");
    });

    it("humanizes steps", () => {
      expect(cronToHuman("*/15 * * * *", "en")).toBe("Every 15 minutes");
      expect(cronToHuman("*/15 * * * *", "th")).toBe("ทุกๆ 15 นาที");
      expect(cronToHuman("0 */2 * * *", "en")).toBe("Every 2 hours");
      expect(cronToHuman("0 */2 * * *", "th")).toBe("ทุกๆ 2 ชั่วโมง");
    });

    it("humanizes daily and weekdays", () => {
      expect(cronToHuman("0 9 * * *", "en")).toBe("At 09:00 every day");
      expect(cronToHuman("0 9 * * *", "th")).toBe("ทุกวัน เวลา 09:00 น.");

      expect(cronToHuman("0 9 * * 1-5", "en")).toBe(
        "At 09:00, Monday through Friday",
      );
      expect(cronToHuman("0 9 * * 1-5", "th")).toBe(
        "ทุกวันจันทร์ถึงศุกร์ เวลา 09:00 น.",
      );
    });

    it("humanizes weekends and monthly", () => {
      expect(cronToHuman("30 10 * * 0,6", "en")).toBe(
        "At 10:30, only on Saturday and Sunday",
      );
      expect(cronToHuman("30 10 * * 0,6", "th")).toBe(
        "ทุกวันเสาร์และอาทิตย์ เวลา 10:30 น.",
      );

      expect(cronToHuman("0 0 1 * *", "en")).toBe(
        "At 00:00, on day 1 of the month",
      );
      expect(cronToHuman("0 0 1 * *", "th")).toBe(
        "วันที่ 1 ของทุกเดือน เวลา 00:00 น.",
      );
    });
  });
});
