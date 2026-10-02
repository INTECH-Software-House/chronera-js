import { describe, it, expect } from "vitest";
import {
  isIXDTF,
  parseIXDTF,
  formatIXDTF,
} from "../../../src/operations/ixdtf.js";
import {
  createZonedDateTime,
  getZonedFields,
  withCalendar,
} from "../../../src/operations/zoned-operations.js";
import { chronera } from "../../../src/chronera.js";
import { ChroneraParseError } from "../../../src/errors/errors.js";

describe("RFC 9557 / IXDTF Operations", () => {
  describe("isIXDTF", () => {
    it("returns true for strings containing bracketed annotations", () => {
      expect(isIXDTF("2026-10-03T01:13:43+07:00[Asia/Bangkok]")).toBe(true);
      expect(
        isIXDTF("2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]"),
      ).toBe(true);
      expect(isIXDTF("2026-10-03T01:13:43[!Asia/Tokyo]")).toBe(true);
      expect(isIXDTF("2026-10-03T01:13:43Z[UTC]")).toBe(true);
      expect(isIXDTF("2026-10-03T01:13:43.123+02:00[Europe/Paris]")).toBe(true);
    });

    it("returns false for standard ISO 8601 strings without annotations", () => {
      expect(isIXDTF("2026-10-03T01:13:43+07:00")).toBe(false);
      expect(isIXDTF("2026-10-03T01:13:43Z")).toBe(false);
      expect(isIXDTF("2026-10-03")).toBe(false);
      expect(isIXDTF("invalid-string")).toBe(false);
      // @ts-expect-error test non-string
      expect(isIXDTF(null)).toBe(false);
    });
  });

  describe("parseIXDTF", () => {
    it("parses date-time with explicit offset and timezone annotation", () => {
      const zdt = parseIXDTF("2026-10-03T01:13:43+07:00[Asia/Bangkok]");
      expect(zdt.kind).toBe("zoned-date-time");
      expect(zdt.timeZone).toBe("Asia/Bangkok");
      expect(zdt.calendar).toBe("gregory");

      const fields = getZonedFields(zdt);
      expect(fields.year).toBe(2026);
      expect(fields.month).toBe(10);
      expect(fields.day).toBe(3);
      expect(fields.hour).toBe(1);
      expect(fields.minute).toBe(13);
      expect(fields.second).toBe(43);
      expect(fields.offsetString).toBe("+07:00");
    });

    it("parses calendar annotation [u-ca=...]", () => {
      const zdt = parseIXDTF(
        "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]",
      );
      expect(zdt.calendar).toBe("buddhist");
      expect(zdt.timeZone).toBe("Asia/Bangkok");
    });

    it("parses critical timezone annotation [!TimeZone]", () => {
      const zdt = parseIXDTF("2026-10-03T01:13:43+07:00[!Asia/Bangkok]");
      expect(zdt.timeZone).toBe("Asia/Bangkok");
    });

    it("parses wall clock time without offset using IANA timezone", () => {
      const zdt = parseIXDTF("2026-10-03T01:13:43[Asia/Bangkok]");
      expect(zdt.timeZone).toBe("Asia/Bangkok");
      const fields = getZonedFields(zdt);
      expect(fields.year).toBe(2026);
      expect(fields.month).toBe(10);
      expect(fields.day).toBe(3);
      expect(fields.hour).toBe(1);
      expect(fields.minute).toBe(13);
      expect(fields.second).toBe(43);
      expect(fields.offsetString).toBe("+07:00");
    });

    it("parses fractional seconds", () => {
      const zdt = parseIXDTF("2026-10-03T01:13:43.750+07:00[Asia/Bangkok]");
      const fields = getZonedFields(zdt);
      expect(fields.millisecond).toBe(750);
    });

    it("ignores non-critical unknown annotations", () => {
      const zdt = parseIXDTF(
        "2026-10-03T01:13:43+07:00[Asia/Bangkok][unknown-key=foo]",
      );
      expect(zdt.timeZone).toBe("Asia/Bangkok");
    });

    it("throws ChroneraParseError on unknown critical annotations", () => {
      expect(() =>
        parseIXDTF("2026-10-03T01:13:43+07:00[Asia/Bangkok][!unknown-key=foo]"),
      ).toThrow(ChroneraParseError);
    });

    it("throws on invalid string or missing timezone", () => {
      // @ts-expect-error test non-string
      expect(() => parseIXDTF(12345)).toThrow(ChroneraParseError);
      expect(() => parseIXDTF("not-a-date")).toThrow(ChroneraParseError);
      expect(() => parseIXDTF("2026-10-03T01:13:43+07:00")).toThrow(
        ChroneraParseError,
      );
    });
  });

  describe("formatIXDTF", () => {
    it("formats standard ZonedDateTime to RFC 9557 string", () => {
      const zdt = createZonedDateTime(
        { year: 2026, month: 10, day: 3, hour: 1, minute: 13, second: 43 },
        "Asia/Bangkok",
      );
      const str = formatIXDTF(zdt);
      expect(str).toBe("2026-10-03T01:13:43+07:00[Asia/Bangkok]");
    });

    it("includes [u-ca=...] when calendar is non-gregorian", () => {
      const zdt = withCalendar(
        createZonedDateTime(
          { year: 2026, month: 10, day: 3, hour: 1, minute: 13, second: 43 },
          "Asia/Bangkok",
        ),
        "buddhist",
      );
      const str = formatIXDTF(zdt);
      expect(str).toBe(
        "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]",
      );
    });

    it("supports criticalTimezone option", () => {
      const zdt = createZonedDateTime(
        { year: 2026, month: 10, day: 3, hour: 1, minute: 13, second: 43 },
        "Asia/Bangkok",
      );
      const str = formatIXDTF(zdt, { criticalTimezone: true });
      expect(str).toBe("2026-10-03T01:13:43+07:00[!Asia/Bangkok]");
    });

    it("supports fractionalDigits option", () => {
      const zdt = createZonedDateTime(
        {
          year: 2026,
          month: 10,
          day: 3,
          hour: 1,
          minute: 13,
          second: 43,
          millisecond: 250,
        },
        "Asia/Bangkok",
      );
      const str = formatIXDTF(zdt, { fractionalDigits: 3 });
      expect(str).toBe("2026-10-03T01:13:43.250+07:00[Asia/Bangkok]");
    });

    it("supports round-trip parse and format", () => {
      const initial = "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]";
      const parsed = parseIXDTF(initial);
      const formatted = formatIXDTF(parsed);
      expect(formatted).toBe(initial);
    });
  });

  describe("Chronera fluent integration", () => {
    it("automatically parses RFC 9557 in chronera(input)", () => {
      const c = chronera(
        "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]",
      );
      expect(c.toIXDTF()).toBe(
        "2026-10-03T01:13:43+07:00[Asia/Bangkok][u-ca=buddhist]",
      );
      const zdt = c.toZonedDateTime();
      expect(zdt.timeZone).toBe("Asia/Bangkok");
      expect(zdt.calendar).toBe("buddhist");
    });
  });
});
