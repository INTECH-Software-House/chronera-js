import { describe, it, expect } from "vitest";
import {
  chronera,
  localDate,
  localTime,
  localDateTime,
  calendarDate,
  instantFromEpochMilliseconds,
  zonedDateTime,
  temporal,
  fromTemporal,
  isTemporalSupported,
  isTemporalObject,
  toTemporalPlainDate,
  toTemporalPlainTime,
  toTemporalPlainDateTime,
  toTemporalInstant,
  toTemporalZonedDateTime,
  toTemporalDuration,
  fromTemporalPlainDate,
  fromTemporalPlainTime,
  fromTemporalPlainDateTime,
  fromTemporalInstant,
  fromTemporalZonedDateTime,
  fromTemporalDuration,
  type TemporalNamespaceLike,
} from "../../../src/index.js";

describe("TC39 Temporal Interop Bridge", () => {
  describe("PlainDate conversions", () => {
    it("converts LocalDate, CalendarDate, Chronera, Date, and ISO string to TemporalPlainDateLike", () => {
      const ld = localDate(2026, 10, 29);
      const pd = toTemporalPlainDate(ld, { useNative: false });
      expect(pd.year).toBe(2026);
      expect(pd.month).toBe(10);
      expect(pd.day).toBe(29);
      expect(pd.monthCode).toBe("M10");
      expect(pd.calendarId).toBe("iso8601");
      expect(pd.isoYear).toBe(2026);
      expect(pd.isoMonth).toBe(10);
      expect(pd.isoDay).toBe(29);
      expect(pd.toString()).toBe("2026-10-29");
      expect(pd.toJSON()).toBe("2026-10-29");
      expect(isTemporalObject(pd)).toBe(true);
      expect(() => pd.valueOf()).toThrow(TypeError);

      // Roundtrip back to LocalDate
      const roundtrip = fromTemporalPlainDate(pd);
      expect(roundtrip).toEqual(ld);
    });

    it("preserves non-Gregorian calendar annotation on CalendarDate", () => {
      const cd = calendarDate({
        calendar: "buddhist",
        year: 2569,
        monthCode: "M10",
        month: 10,
        day: 29,
      });
      const pd = toTemporalPlainDate(cd, { useNative: false });
      expect(pd.calendarId).toBe("buddhist");
      expect(pd.toString()).toBe("2026-10-29[u-ca=buddhist]");

      const roundtrip = fromTemporalPlainDate(pd.toString());
      expect(roundtrip).toEqual(localDate(2026, 10, 29));
    });

    it("converts Chronera fluent instance via .toTemporalPlainDate()", () => {
      const c = chronera("2026-10-29");
      const pd = c.toTemporalPlainDate({ useNative: false });
      expect(pd.toString()).toBe("2026-10-29");
    });
  });

  describe("PlainTime conversions", () => {
    it("converts LocalTime and ISO time string to TemporalPlainTimeLike", () => {
      const lt = localTime(14, 30, 45, 250);
      const pt = toTemporalPlainTime(lt, { useNative: false });
      expect(pt.hour).toBe(14);
      expect(pt.minute).toBe(30);
      expect(pt.second).toBe(45);
      expect(pt.millisecond).toBe(250);
      expect(pt.microsecond).toBe(0);
      expect(pt.nanosecond).toBe(0);
      expect(pt.toString()).toBe("14:30:45.25");
      expect(isTemporalObject(pt)).toBe(true);

      const roundtrip = fromTemporalPlainTime(pt);
      expect(roundtrip).toEqual(lt);

      const fromStr = fromTemporalPlainTime("09:05:00");
      expect(fromStr).toEqual(localTime(9, 5, 0, 0));
    });
  });

  describe("PlainDateTime conversions", () => {
    it("converts LocalDateTime and ISO string to TemporalPlainDateTimeLike", () => {
      const ldt = localDateTime(
        localDate(2026, 10, 29),
        localTime(8, 15, 30, 0),
      );
      const pdt = toTemporalPlainDateTime(ldt, { useNative: false });
      expect(pdt.year).toBe(2026);
      expect(pdt.month).toBe(10);
      expect(pdt.day).toBe(29);
      expect(pdt.hour).toBe(8);
      expect(pdt.minute).toBe(15);
      expect(pdt.second).toBe(30);
      expect(pdt.toString()).toBe("2026-10-29T08:15:30");
      expect(isTemporalObject(pdt)).toBe(true);

      const roundtrip = fromTemporalPlainDateTime(pdt);
      expect(roundtrip).toEqual(ldt);

      const fromStr = fromTemporalPlainDateTime("2026-10-29T08:15:30");
      expect(fromStr).toEqual(ldt);
    });
  });

  describe("Instant conversions", () => {
    it("converts Instant, Date, and epochNanoseconds to TemporalInstantLike", () => {
      const ms = Date.UTC(2026, 9, 29, 7, 15, 0);
      const inst = instantFromEpochMilliseconds(ms);
      const ti = toTemporalInstant(inst, { useNative: false });

      expect(ti.epochMilliseconds).toBe(ms);
      expect(ti.epochNanoseconds).toBe(BigInt(ms) * 1_000_000n);
      expect(ti.toString()).toBe("2026-10-29T07:15:00.000Z");
      expect(isTemporalObject(ti)).toBe(true);

      const roundtrip = fromTemporalInstant(ti);
      expect(roundtrip).toEqual(inst);

      // Also test conversion from epochNanoseconds only
      const fromNs = fromTemporalInstant({
        epochNanoseconds: BigInt(ms) * 1_000_000n,
      });
      expect(fromNs).toEqual(inst);
    });
  });

  describe("ZonedDateTime conversions", () => {
    it("converts ZonedDateTime and RFC 9557 IXDTF string to TemporalZonedDateTimeLike", () => {
      const ms = Date.UTC(2026, 9, 29, 0, 15, 0); // 07:15 in Asia/Bangkok (+07:00)
      const zdt = zonedDateTime(
        instantFromEpochMilliseconds(ms),
        "Asia/Bangkok",
        "buddhist",
      );
      const tzdt = toTemporalZonedDateTime(zdt, undefined, undefined, {
        useNative: false,
      });

      expect(tzdt.timeZoneId).toBe("Asia/Bangkok");
      expect(tzdt.calendarId).toBe("buddhist");
      expect(tzdt.year).toBe(2026);
      expect(tzdt.month).toBe(10);
      expect(tzdt.day).toBe(29);
      expect(tzdt.hour).toBe(7);
      expect(tzdt.minute).toBe(15);
      expect(tzdt.offset).toBe("+07:00");
      expect(tzdt.offsetNanoseconds).toBe(7 * 3600 * 1_000_000_000);
      expect(tzdt.toString()).toBe(
        "2026-10-29T07:15:00+07:00[Asia/Bangkok][u-ca=buddhist]",
      );
      expect(isTemporalObject(tzdt)).toBe(true);

      const roundtrip = fromTemporalZonedDateTime(tzdt);
      expect(roundtrip).toEqual(zdt);
    });
  });

  describe("Duration conversions", () => {
    it("converts Duration and ISO 8601 duration strings to TemporalDurationLike", () => {
      const td = toTemporalDuration(
        { years: 1, months: 2, days: 3, hours: 4, minutes: 30 },
        { useNative: false },
      );
      expect(td.years).toBe(1);
      expect(td.months).toBe(2);
      expect(td.days).toBe(3);
      expect(td.hours).toBe(4);
      expect(td.minutes).toBe(30);
      expect(td.sign).toBe(1);
      expect(td.blank).toBe(false);
      expect(td.toString()).toBe("P1Y2M3DT4H30M");
      expect(isTemporalObject(td)).toBe(true);

      const roundtrip = fromTemporalDuration(td);
      expect(roundtrip).toEqual({
        years: 1,
        months: 2,
        days: 3,
        hours: 4,
        minutes: 30,
      });

      const zeroDur = toTemporalDuration({}, { useNative: false });
      expect(zeroDur.sign).toBe(0);
      expect(zeroDur.blank).toBe(true);
    });

    it("rejects mixed-sign durations per TC39 Temporal spec", () => {
      expect(() =>
        toTemporalDuration({ days: 5, hours: -2 }, { useNative: false }),
      ).toThrow();
    });
  });

  describe("Fluent Chronera & temporal namespace integration", () => {
    it("accepts Temporal*Like objects directly in chronera() and fromTemporal() without calling .valueOf()", () => {
      const pd = temporal.toPlainDate("2026-10-29", { useNative: false });
      const c1 = chronera(pd);
      expect(c1.toLocalDate()).toEqual(localDate(2026, 10, 29));

      const tzdt = temporal.toZonedDateTime(
        "2026-10-29T07:15:00+07:00[Asia/Bangkok]",
        undefined,
        undefined,
        { useNative: false },
      );
      const c2 = fromTemporal(tzdt);
      expect(c2.kind).toBe("zoned-date-time");
      expect(c2.toZonedDateTime().timeZone).toBe("Asia/Bangkok");
    });

    it("delegates to a provided custom/native Temporal namespace when passed in options", () => {
      let calledPlainDateFrom = false;
      const mockTemporal: TemporalNamespaceLike = {
        PlainDate: {
          from(item: unknown) {
            calledPlainDateFrom = true;
            return toTemporalPlainDate(String(item), { useNative: false });
          },
        },
        Instant: {
          fromEpochMilliseconds(ms: number) {
            return toTemporalInstant(ms, { useNative: false });
          },
          from(item: unknown) {
            return toTemporalInstant(String(item), { useNative: false });
          },
        },
        ZonedDateTime: {
          from(item: unknown) {
            return toTemporalZonedDateTime(String(item), undefined, undefined, {
              useNative: false,
            });
          },
        },
      };

      expect(isTemporalSupported(mockTemporal)).toBe(true);
      const res = toTemporalPlainDate("2026-10-29", { temporal: mockTemporal });
      expect(calledPlainDateFrom).toBe(true);
      expect(res.toString()).toBe("2026-10-29");
    });
  });
});
