import { describe, it, expect } from "vitest";
import {
  timeAgo,
  formatDistance,
  formatDistanceToNow,
  chronera,
} from "../../../src/index.js";
import {
  withMockTime,
  setSystemTime,
  restoreSystemTime,
} from "../../../src/testing/index.js";

describe("Smart Relative Time & Humanizer (timeAgo / fromNow)", () => {
  const BASE_TIME = "2026-09-27T12:00:00.000Z";

  describe("English relative time formatting", () => {
    it("formats past times accurately in English", () => {
      const base = new Date(BASE_TIME).getTime();

      // Seconds
      expect(timeAgo(base, { relativeTo: base, locale: "en-US" })).toBe("now");
      expect(
        timeAgo(base - 10000, {
          relativeTo: base,
          locale: "en-US",
          numeric: "always",
        }),
      ).toBe("10 seconds ago");

      // Minutes
      expect(
        timeAgo(base - 5 * 60000, { relativeTo: base, locale: "en-US" }),
      ).toBe("5 minutes ago");

      // Hours
      expect(
        timeAgo(base - 3 * 3600000, { relativeTo: base, locale: "en-US" }),
      ).toBe("3 hours ago");

      // Days (yesterday)
      expect(
        timeAgo(base - 1 * 86400000, { relativeTo: base, locale: "en-US" }),
      ).toBe("yesterday");
      expect(
        timeAgo(base - 4 * 86400000, { relativeTo: base, locale: "en-US" }),
      ).toBe("4 days ago");

      // Months (no error when exceeding 28 days!)
      expect(
        timeAgo(base - 60 * 86400000, { relativeTo: base, locale: "en-US" }),
      ).toBe("2 months ago");

      // Years
      expect(
        timeAgo(base - 400 * 86400000, { relativeTo: base, locale: "en-US" }),
      ).toBe("last year");
      expect(
        timeAgo(base - 750 * 86400000, { relativeTo: base, locale: "en-US" }),
      ).toBe("2 years ago");
    });

    it("formats future times accurately in English", () => {
      const base = new Date(BASE_TIME).getTime();

      expect(
        timeAgo(base + 5 * 60000, { relativeTo: base, locale: "en-US" }),
      ).toBe("in 5 minutes");

      expect(
        timeAgo(base + 86400000, { relativeTo: base, locale: "en-US" }),
      ).toBe("tomorrow");

      expect(
        timeAgo(base + 3 * 86400000, { relativeTo: base, locale: "en-US" }),
      ).toBe("in 3 days");
    });

    it("formats compact notation in English", () => {
      const base = new Date(BASE_TIME).getTime();

      expect(
        timeAgo(base - 20000, {
          relativeTo: base,
          compact: true,
          locale: "en",
        }),
      ).toBe("now");
      expect(
        timeAgo(base - 5 * 60000, {
          relativeTo: base,
          compact: true,
          locale: "en",
        }),
      ).toBe("5m");
      expect(
        timeAgo(base - 2 * 3600000, {
          relativeTo: base,
          compact: true,
          locale: "en",
        }),
      ).toBe("2h");
      expect(
        timeAgo(base - 5 * 86400000, {
          relativeTo: base,
          compact: true,
          locale: "en",
        }),
      ).toBe("5d");
      expect(
        timeAgo(base - 90 * 86400000, {
          relativeTo: base,
          compact: true,
          locale: "en",
        }),
      ).toBe("3mo");
      expect(
        timeAgo(base - 400 * 86400000, {
          relativeTo: base,
          compact: true,
          locale: "en",
        }),
      ).toBe("1y");
    });

    it("supports addSuffix: false in English", () => {
      const base = new Date(BASE_TIME).getTime();

      expect(
        timeAgo(base - 5 * 60000, {
          relativeTo: base,
          addSuffix: false,
          locale: "en-US",
        }),
      ).toBe("5 minutes");

      expect(
        timeAgo(base - 1 * 3600000, {
          relativeTo: base,
          addSuffix: false,
          locale: "en-US",
        }),
      ).toBe("1 hour");
    });
  });

  describe("Thai relative time natural formatting", () => {
    it("formats past times naturally in Thai", () => {
      const base = new Date(BASE_TIME).getTime();

      // Just now / เมื่อสักครู่
      expect(timeAgo(base - 15000, { relativeTo: base, locale: "th-TH" })).toBe(
        "เมื่อสักครู่",
      );

      // Minutes
      expect(
        timeAgo(base - 3 * 60000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("3 นาทีที่แล้ว");

      // Hours
      expect(
        timeAgo(base - 2 * 3600000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("2 ชั่วโมงที่แล้ว");

      // Days (เมื่อวานนี้)
      expect(
        timeAgo(base - 1 * 86400000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("เมื่อวานนี้");
      expect(
        timeAgo(base - 4 * 86400000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("4 วันที่แล้ว");

      // Months
      expect(
        timeAgo(base - 90 * 86400000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("3 เดือนที่แล้ว");

      // Years
      expect(
        timeAgo(base - 400 * 86400000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("1 ปีที่แล้ว");
    });

    it("formats future times naturally in Thai", () => {
      const base = new Date(BASE_TIME).getTime();

      expect(
        timeAgo(base + 5 * 60000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("อีก 5 นาที");

      expect(
        timeAgo(base + 1 * 86400000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("พรุ่งนี้");

      expect(
        timeAgo(base + 2 * 86400000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("มะรืนนี้");

      expect(
        timeAgo(base + 5 * 86400000, { relativeTo: base, locale: "th-TH" }),
      ).toBe("อีก 5 วัน");
    });

    it("formats compact notation in Thai", () => {
      const base = new Date(BASE_TIME).getTime();

      expect(
        timeAgo(base - 10000, {
          relativeTo: base,
          compact: true,
          locale: "th",
        }),
      ).toBe("เมื่อสักครู่");

      expect(
        timeAgo(base - 5 * 60000, {
          relativeTo: base,
          compact: true,
          locale: "th",
        }),
      ).toBe("5 นาที");

      expect(
        timeAgo(base - 2 * 3600000, {
          relativeTo: base,
          compact: true,
          locale: "th",
        }),
      ).toBe("2 ชม.");

      expect(
        timeAgo(base - 3 * 86400000, {
          relativeTo: base,
          compact: true,
          locale: "th",
        }),
      ).toBe("3 วัน");

      expect(
        timeAgo(base - 60 * 86400000, {
          relativeTo: base,
          compact: true,
          locale: "th",
        }),
      ).toBe("2 ด.");
    });

    it("supports addSuffix: false in Thai", () => {
      const base = new Date(BASE_TIME).getTime();

      expect(
        timeAgo(base - 5 * 60000, {
          relativeTo: base,
          addSuffix: false,
          locale: "th-TH",
        }),
      ).toBe("5 นาที");

      expect(
        timeAgo(base - 2 * 3600000, {
          relativeTo: base,
          addSuffix: false,
          locale: "th-TH",
        }),
      ).toBe("2 ชั่วโมง");
    });
  });

  describe("formatDistance and formatDistanceToNow", () => {
    it("computes distance between two arbitrary dates", () => {
      const d1 = "2026-09-27T10:00:00Z";
      const d2 = "2026-09-27T10:05:00Z";

      expect(formatDistance(d1, d2, { locale: "en-US" })).toBe("5 minutes ago");
      expect(formatDistance(d2, d1, { locale: "en-US" })).toBe("in 5 minutes");
    });

    it("formatDistanceToNow acts as an alias for timeAgo", () => {
      const past = new Date(Date.now() - 3600000);
      expect(formatDistanceToNow(past, { locale: "en-US" })).toBe("1 hour ago");
    });
  });

  describe("Fluent Chronera instance methods", () => {
    it("supports .fromNow(), .toNow(), and .timeAgo()", () => {
      withMockTime("2026-09-27T12:00:00.000Z", () => {
        const past = chronera("2026-09-27T11:45:00.000Z");
        expect(past.fromNow({ locale: "en-US" })).toBe("15 minutes ago");
        expect(past.timeAgo({ locale: "en-US" })).toBe("15 minutes ago");
        expect(past.fromNow({ locale: "th-TH" })).toBe("15 นาทีที่แล้ว");

        const future = chronera("2026-09-27T12:30:00.000Z");
        expect(future.fromNow({ locale: "en-US" })).toBe("in 30 minutes");
        expect(future.fromNow({ locale: "th-TH" })).toBe("อีก 30 นาที");

        // Compact
        expect(past.fromNow({ compact: true, locale: "en" })).toBe("15m");
      });
    });

    it("supports .from(ref) and .to(ref)", () => {
      const d1 = chronera("2026-09-27T10:00:00Z");
      const d2 = chronera("2026-09-27T10:10:00Z");

      expect(d1.from(d2, { locale: "en-US" })).toBe("10 minutes ago");
      expect(d1.to(d2, { locale: "en-US" })).toBe("in 10 minutes");
    });
  });

  describe("Integration with Chronera Testing Clock Mocking", () => {
    it("respects setSystemTime and restoreSystemTime", () => {
      setSystemTime("2026-10-15T08:00:00.000Z");
      try {
        const c = chronera("2026-10-15T07:50:00.000Z");
        expect(c.fromNow({ locale: "en-US" })).toBe("10 minutes ago");
        expect(c.fromNow({ locale: "th-TH" })).toBe("10 นาทีที่แล้ว");
      } finally {
        restoreSystemTime();
      }
    });
  });
});
