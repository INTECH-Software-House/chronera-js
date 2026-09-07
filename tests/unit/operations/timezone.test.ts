import { describe, expect, it } from "vitest";
import {
  formatInTimeZone,
  getTimeZoneOffset,
  isSameTimeZone,
} from "../../../src/index.js";
import { instantFromDate } from "../../../src/core/instant.js";
import { ChroneraError } from "../../../src/errors/errors.js";

describe("Global TimeZone Converter & Schedule Utilities", () => {
  const summerUtc = instantFromDate(new Date("2026-07-01T12:00:00.000Z"));
  const winterUtc = instantFromDate(new Date("2026-01-01T12:00:00.000Z"));
  const sampleUtc = instantFromDate(new Date("2026-09-04T12:30:45.500Z"));

  describe("formatInTimeZone()", () => {
    it("formats instant into various target time zones", () => {
      // 12:30:45 UTC -> 19:30:45 in Bangkok (UTC+7)
      const bkk = formatInTimeZone(
        sampleUtc,
        "Asia/Bangkok",
        "yyyy-MM-dd HH:mm:ss",
      );
      expect(bkk).toBe("2026-09-04 19:30:45");

      // 12:30:45 UTC -> 08:30:45 in New York (EDT, UTC-4)
      const ny = formatInTimeZone(
        sampleUtc,
        "America/New_York",
        "yyyy-MM-dd HH:mm:ss",
      );
      expect(ny).toBe("2026-09-04 08:30:45");

      // 12:30:45 UTC -> 21:30:45 in Tokyo (UTC+9)
      const tokyo = formatInTimeZone(
        sampleUtc,
        "Asia/Tokyo",
        "yyyy-MM-dd HH:mm:ss",
      );
      expect(tokyo).toBe("2026-09-04 21:30:45");

      // 12:30:45 UTC -> 18:00:45 in India (UTC+5:30)
      const india = formatInTimeZone(
        sampleUtc,
        "Asia/Kolkata",
        "yyyy-MM-dd HH:mm:ss",
      );
      expect(india).toBe("2026-09-04 18:00:45");
    });

    it("accepts a native JavaScript Date directly", () => {
      const date = new Date("2026-09-04T12:00:00.000Z");
      const res = formatInTimeZone(date, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
      expect(res).toBe("2026-09-04 19:00:00");
    });

    it("supports ISO offset tokens X, XX, XXX, x, xx, xxx", () => {
      expect(formatInTimeZone(sampleUtc, "Asia/Bangkok", "XXX")).toBe("+07:00");
      expect(formatInTimeZone(sampleUtc, "Asia/Bangkok", "XX")).toBe("+0700");
      expect(formatInTimeZone(sampleUtc, "Asia/Bangkok", "X")).toBe("+07");
      expect(formatInTimeZone(sampleUtc, "Asia/Bangkok", "xxx")).toBe("+07:00");
      expect(formatInTimeZone(sampleUtc, "Asia/Bangkok", "xx")).toBe("+0700");
      expect(formatInTimeZone(sampleUtc, "Asia/Bangkok", "x")).toBe("+07");

      // UTC offset tokens
      expect(formatInTimeZone(sampleUtc, "UTC", "XXX")).toBe("Z");
      expect(formatInTimeZone(sampleUtc, "UTC", "XX")).toBe("Z");
      expect(formatInTimeZone(sampleUtc, "UTC", "X")).toBe("Z");
      expect(formatInTimeZone(sampleUtc, "UTC", "xxx")).toBe("+00:00");
      expect(formatInTimeZone(sampleUtc, "UTC", "xx")).toBe("+0000");
      expect(formatInTimeZone(sampleUtc, "UTC", "x")).toBe("+00");

      // Fractional hour zone (India +05:30)
      expect(formatInTimeZone(sampleUtc, "Asia/Kolkata", "X")).toBe("+0530");
      expect(formatInTimeZone(sampleUtc, "Asia/Kolkata", "XXX")).toBe("+05:30");
    });

    it("supports time zone name tokens z and zzzz", () => {
      const nyShort = formatInTimeZone(sampleUtc, "America/New_York", "z");
      expect(typeof nyShort).toBe("string");
      expect(nyShort.length).toBeGreaterThan(0);

      const nyLong = formatInTimeZone(sampleUtc, "America/New_York", "zzzz");
      expect(nyLong).toBe("Eastern Daylight Time");
    });

    it("supports locale and calendar customization", () => {
      // Thai Buddhist calendar formatting in Bangkok
      const thai = formatInTimeZone(
        sampleUtc,
        "Asia/Bangkok",
        "d MMMM yyyy HH:mm",
        {
          calendar: "buddhist",
          locale: "th-TH",
        },
      );
      expect(thai).toContain("2569");
      expect(thai).toContain("กันยายน");
      expect(thai).toContain("19:30");

      // Thai numerals
      const thaiDigits = formatInTimeZone(
        sampleUtc,
        "Asia/Bangkok",
        "yyyy-MM-dd",
        {
          numberingSystem: "thai",
        },
      );
      expect(thaiDigits).toBe("๒๐๒๖-๐๙-๐๔");
    });

    it("throws ChroneraError for invalid inputs", () => {
      expect(() =>
        formatInTimeZone(sampleUtc, "Invalid/TimeZone", "yyyy"),
      ).toThrow(ChroneraError);

      expect(() =>
        formatInTimeZone(null as unknown as Date, "Asia/Bangkok", "yyyy"),
      ).toThrow(ChroneraError);
    });
  });

  describe("getTimeZoneOffset()", () => {
    it("returns formatted offset string by default", () => {
      expect(getTimeZoneOffset("Asia/Bangkok", sampleUtc)).toBe("+07:00");
      expect(getTimeZoneOffset("Asia/Tokyo", sampleUtc)).toBe("+09:00");
      expect(getTimeZoneOffset("UTC", sampleUtc)).toBe("+00:00");
      expect(getTimeZoneOffset("Asia/Kolkata", sampleUtc)).toBe("+05:30");
      expect(getTimeZoneOffset("Asia/Kathmandu", sampleUtc)).toBe("+05:45");
    });

    it("returns minutes when format is 'minutes'", () => {
      expect(getTimeZoneOffset("Asia/Bangkok", sampleUtc, "minutes")).toBe(420);
      expect(getTimeZoneOffset("Asia/Tokyo", sampleUtc, "minutes")).toBe(540);
      expect(getTimeZoneOffset("UTC", sampleUtc, "minutes")).toBe(0);
      expect(getTimeZoneOffset("Asia/Kolkata", sampleUtc, "minutes")).toBe(330);
      expect(getTimeZoneOffset("Asia/Kathmandu", sampleUtc, "minutes")).toBe(
        345,
      );
    });

    it("returns totalSeconds when format is 'totalSeconds'", () => {
      expect(getTimeZoneOffset("Asia/Bangkok", sampleUtc, "totalSeconds")).toBe(
        25200,
      );
      expect(getTimeZoneOffset("UTC", sampleUtc, "totalSeconds")).toBe(0);
    });

    it("accurately tracks Daylight Saving Time (DST) differences", () => {
      // New York in July (EDT, UTC-4 = -240 min)
      const nySummerMin = getTimeZoneOffset(
        "America/New_York",
        summerUtc,
        "minutes",
      );
      expect(nySummerMin).toBe(-240);

      // New York in January (EST, UTC-5 = -300 min)
      const nyWinterMin = getTimeZoneOffset(
        "America/New_York",
        winterUtc,
        "minutes",
      );
      expect(nyWinterMin).toBe(-300);

      // Full info object
      const nySummerInfo = getTimeZoneOffset(
        "America/New_York",
        summerUtc,
        "object",
      );
      expect(nySummerInfo).toEqual({
        formatted: "-04:00",
        minutes: -240,
        totalSeconds: -14400,
        isDst: true,
      });

      const nyWinterInfo = getTimeZoneOffset(
        "America/New_York",
        winterUtc,
        "object",
      );
      expect(nyWinterInfo).toEqual({
        formatted: "-05:00",
        minutes: -300,
        totalSeconds: -18000,
        isDst: false,
      });

      // Bangkok has no DST
      const bkkInfo = getTimeZoneOffset("Asia/Bangkok", summerUtc, "object");
      expect(bkkInfo.isDst).toBe(false);
      expect(bkkInfo.formatted).toBe("+07:00");
    });

    it("works with current time when instant is omitted", () => {
      const offset = getTimeZoneOffset("Asia/Bangkok");
      expect(offset).toBe("+07:00");
    });

    it("throws ChroneraError for invalid time zone", () => {
      expect(() => getTimeZoneOffset("EST")).toThrow(ChroneraError);
      expect(() => getTimeZoneOffset("GMT+7")).toThrow(ChroneraError);
      expect(() => getTimeZoneOffset("")).toThrow(ChroneraError);
    });
  });

  describe("isSameTimeZone()", () => {
    it("compares canonical IANA identity by default", () => {
      expect(isSameTimeZone("UTC", "Etc/UTC")).toBe(true);
      expect(isSameTimeZone("Asia/Bangkok", "Asia/Bangkok")).toBe(true);

      // Bangkok and Jakarta have the same offset (+07:00) but are distinct canonical zones
      expect(isSameTimeZone("Asia/Bangkok", "Asia/Jakarta")).toBe(false);
      expect(isSameTimeZone("Asia/Bangkok", "Asia/Tokyo")).toBe(false);
    });

    it("compares current or specified offset in 'offset' mode", () => {
      // Both are UTC+7
      expect(
        isSameTimeZone("Asia/Bangkok", "Asia/Jakarta", { mode: "offset" }),
      ).toBe(true);
      expect(isSameTimeZone("Asia/Bangkok", "Asia/Jakarta", "offset")).toBe(
        true,
      );

      // Bangkok (+7) vs Tokyo (+9)
      expect(
        isSameTimeZone("Asia/Bangkok", "Asia/Tokyo", { mode: "offset" }),
      ).toBe(false);

      // Comparing across instants with DST
      // New York and Detroit in summer are both EDT (-4)
      expect(
        isSameTimeZone("America/New_York", "America/Detroit", {
          mode: "offset",
          instant: summerUtc,
        }),
      ).toBe(true);
    });

    it("throws ChroneraError for invalid time zones", () => {
      expect(() => isSameTimeZone("Asia/Bangkok", "Invalid/Zone")).toThrow(
        ChroneraError,
      );
      expect(() => isSameTimeZone("PST", "Asia/Tokyo")).toThrow(ChroneraError);
    });
  });
});
